let Future = Npm.require('fibers/future');

Meteor.methods({
  // Starts an UpDownGenes job for each of the sample_labels. If a job already
  // exists, the duplicate job is returned.
  // Returns an array of job _ids
  createUpDownGenes: function (formValues, customSampleGroup) {
    check(formValues, new SimpleSchema({
      data_set_id: { type: String },
      sample_labels: { type: [String] },
      sample_group_id: { type: String },
      iqr_multiplier: { type: Number, decimal: true },
      use_filtered_sample_group: {type: Boolean },
    }));
    check(customSampleGroup, Object);

    let user = MedBook.ensureUser(Meteor.userId());
    // data set and sample group security is below...

    let {
      data_set_id,
      sample_labels,
      sample_group_id,
      iqr_multiplier,
      use_filtered_sample_group,
    } = formValues;

    user.ensureAccess(DataSets.findOne(data_set_id));

    // if we need to create a new sample group, do so
    if (formValues.sample_group_id === "creating") {
      this.unblock();

      let creatingError;
      Meteor.call("createSampleGroup", customSampleGroup, (err, ret) => {
        // NOTE: this callback is executed before the Meteor.call returns

        creatingError = err;
        sample_group_id = ret;
      });

      // if there was a problem with that one, throw the associated error
      if (creatingError) throw creatingError;
    }

    // security for the sample group
    let sampleGroup = SampleGroups.findOne(sample_group_id);
    user.ensureAccess(sampleGroup);

    // If this job uses the gene filters on the sample group,
    // and they're not already generated,
    // queue a job to generate them and set it as a prerequisite
    // for the outlier analysis job.
    let prerequisite_job_ids = [];
    if(use_filtered_sample_group){
      // check the sample group for a gene-filter blob
      let foundFilter = Blobs2.findOne({
        "associated_object.collection_name":"SampleGroups",
        "associated_object.mongo_id":sample_group_id,
        "metadata.type":"ExprAndVarFilteredSampleGroupData",
      });
      if(!foundFilter){
        // No existing filters -- queue a new job to create them
        prerequisite_job_ids.push(Jobs.insert({
          name: "ApplyExprAndVarianceFilters",
          status: "waiting",
          user_id: user._id,
          collaborations: [ user.personalCollaboration() ],
          args: {"sample_group_id":sample_group_id},
        }));
      }
    }

    let sameArgs = {
      data_set_id,
      iqr_multiplier,
      sample_group_id,
      sample_group_name: sampleGroup.name,
      use_filtered_sample_group,
    };

    return _.map(sample_labels, (sample_label) => {
      // figure out the args for this job
      var args = _.clone(sameArgs);
      args.sample_label = sample_label;

      // check to see if a job like this one has already been run,
      // and if so, return that job's _id
      // NOTE: I believe there could be a race condition here, but
      // I don't think Meteor handles more than one Meteor method at once.
      // (That said, we unblock above to create a sample group, but because
      // that is a new object, this should be the first thing run with the
      // new _id.)

      // Jobs that predate sample group filters will match for new jobs using
      // an unfiltered sample group as neither has 'use_filtered_sample_group'
      // as an arg.
      let duplicateJob = Jobs.findOne({
        args,
        collaborations: user.personalCollaboration(),
        status: { $ne: "error" }
      });

      let jobId;
      if (duplicateJob) {
        jobId = duplicateJob._id;
      } else {
        jobId = Jobs.insert({
          name: "UpDownGenes",
          status: "waiting",
          user_id: user._id,
          collaborations: [ user.personalCollaboration() ],
          args,
          prerequisite_job_ids
        });
      }

      return jobId;
    });
  },
  createSampleGroup: function (sampleGroup) {
    // NOTE: this method might produce "unclean" errors because I don't
    // feel like rewriting most of the schema for SampleGroups for the
    // check function (above)
    check(sampleGroup, Object);

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(sampleGroup);

    // sanity checks (complete with nice error messages)
    if (!sampleGroup.name) {
      throw new Meteor.Error("name-missing", "Name missing",
          "Please name your sample group.");
    }
    if (sampleGroup.data_sets.length === 0) {
      throw new Meteor.Error("no-data-sets", "No data sets",
          "Please add at least one data set to your sample group.");
    }

    // make sure the version is correct (aka don't trust the user)
    // TODO: when should we increment the version?
    // What if the samples are the same?
    sampleGroup.version =
        Meteor.call("getSampleGroupVersion", sampleGroup.name);

    // ensure uniqueness for data sets
    let uniqueDataSets = _.uniq(_.pluck(sampleGroup.data_sets, "_id"));
    if (uniqueDataSets.length !== sampleGroup.data_sets.length) {
      throw new Meteor.Error("non-unique-data-sets");
    }

    // filter through each data set
    sampleGroup.data_sets = _.map(sampleGroup.data_sets,
        (sampleGroupDataSet) => {
      // ensure access
      let dataSet = DataSets.findOne(sampleGroupDataSet.data_set_id);
      user.ensureAccess(dataSet);

      // make sure they're all the same type
      if (!sampleGroup.value_type) {
        // infer from the data sets for now
        sampleGroup.value_type = dataSet.value_type;
      }

      if (dataSet.value_type !== sampleGroup.value_type) {
        throw new Meteor.Error("mixed-value-types", "Mixed value types",
            "You can only create a sample group with data sets " +
            "of a single value type.");
      }

      // don't trust the client's name or unfiltered count
      sampleGroupDataSet.data_set_name = dataSet.name;
      sampleGroupDataSet.unfiltered_sample_count =
          dataSet.sample_labels.length;

      // Apply the sample group's filters.
      // We start with all the sample labels in a data set.
      // Then, apply filters as follows.
      // -  Filter by form values: Run the passed query in mongo and remove all samples
      //    that are not included in the query results
      // -  Include Specific Samples : remove all samples NOT on the include list
      // -  Exclude Specific Samples : remove all samples on the exclude list
      let allSamples = dataSet.sample_labels;
      let sample_labels = allSamples; // need a copy of this


      _.each(sampleGroupDataSet.filters, (filter) => {
        let { options } = filter;

        if (filter.type === "form_values"){
          if (!options.mongo_query) {
            throw new Meteor.Error("mongo-query-empty", "Not done editing filters",
                "Please click done to continue.");
          }

          // Run the mongo_query
          // Get the result sample labels synchronously
          let result_sample_labels = Meteor.call('getSamplesFromFormFilter',
            sampleGroupDataSet.data_set_id,
            options.mongo_query,
            options.form_id
          );

          console.log("Query found", result_sample_labels.length,
              "sample labels.");

          sample_labels = _.intersection(sample_labels, result_sample_labels);

        } else if (filter.type === "include_sample_list") {
          if (_.difference(options.sample_labels, allSamples).length) {
            throw new Meteor.Error("invalid-sample-labels");
          }
          sample_labels = _.intersection(sample_labels, options.sample_labels);
        } else if (filter.type === "exclude_sample_list") {
          if (_.difference(options.sample_labels, allSamples).length) {
            throw new Meteor.Error("invalid-sample-labels");
          }
          sample_labels = _.difference(sample_labels, options.sample_labels);
        } else {
          throw new Meteor.Error("invalid-filter-type");
        }
      });

      if (sample_labels.length === 0) {
        throw new Meteor.Error("data-set-empty", "Data set empty",
            `The ${dataSet.name} data set is empty. ` +
            "Remove filters or remove the data set to continue.");
      }

      sampleGroupDataSet.sample_labels = sample_labels;

      return sampleGroupDataSet; // NOTE: _.map at beginning
    });

    // We can't use the regular SampleGroups.insert because SimpleSchema can't
    // handle inserting objects with very large arrays (ex. sample_labels).
    // Instead, handle the autoValues and check the schema manually...

    // check to make sure sample_labels are valid in actual sample group
    // (not done below because SimpleSchema hangs)
    _.each(sampleGroup.data_sets, (dataSet) => {
      check(dataSet.sample_labels, [String]);

      dataSet.sample_count = dataSet.sample_labels.length;
      check(dataSet.sample_count, Number);

      // Confirm the filter options (include / exclude sample list only)
      _.each(dataSet.filters, (filter) => {
        if((filter.type === "include_sample_list") ||
            (filter.type === "exclude_sample_list")){
          check(filter.options.sample_labels, [String]);
          filter.options.sample_count = filter.options.sample_labels.length;
        }
      });
    });

    // clone object to be checked for the schema
    let clonedSampleGroup = JSON.parse(JSON.stringify(sampleGroup));
    _.each(clonedSampleGroup.data_sets, (dataSet) => {
      // SimpleSchema can't handle large arrays, so set this to one
      dataSet.sample_labels = [ "yop" ];
      dataSet.sample_count = 1;
    });

    let validationContext = SampleGroups.simpleSchema().newContext();
    var isValid = validationContext.validate(clonedSampleGroup);
    if (!isValid) {
      console.log("Someone's doing something funky or there's a bug in " +
          "the UI code. User:", user._id);
      console.log("clonedSampleGroup:", clonedSampleGroup);
      console.log("validationContext.invalidKeys():",
          validationContext.invalidKeys());
      throw new Meteor.Error("invalid-sample-group");
    }

    sampleGroup.date_created = new Date();
    let newId = Random.id(); // XXX: might cause collisions
    sampleGroup._id = newId;

    // insert asynchronously -- thanks @ArnaudGallardo
    var future = new Future();
    SampleGroups.rawCollection().insert(sampleGroup, (err, insertedObj) => {
      // Need to either throw err, or return ID, but NOT BOTH
      // or will crash with "Future resolved more than once" error
      if (err) {
        console.log("Creating sample group threw Future error:", err);
        future.throw(err);
      } else {
        future.return(newId);
      }
    });

    return future.wait();
  },
  // Applies the expression and variance filters to a sample group
  // returns the job id...
  applyExprVarianceFilters: function(sampleGroupId){

    // checks and permissions
    check(sampleGroupId, String);
    let user = MedBook.ensureUser(Meteor.userId());
    let sampleGroup = SampleGroups.findOne(sampleGroupId);
    user.ensureAccess(sampleGroup);

    // TODO : this job should never run more than once for
    // a sample group, so we should never need to search for
    // an existing filter blob & delete it. But we probably should,
    // just in case.

    args = {
      sample_group_id: sampleGroupId
    }

    return Jobs.insert({
      name: "ApplyExprAndVarianceFilters",
      status: "waiting",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args
    });
  },
  getFormRecords(form_id) {
    check(form_id, String);

    let user = MedBook.ensureUser(this.userId);
    let form = Forms.findOne(form_id);
    user.ensureAccess(form);

    return Records.find({ form_id }, {
      sort: { [form.sample_label_field]: 1 },
    }).fetch();
  },
});
