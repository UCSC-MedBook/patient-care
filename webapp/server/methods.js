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
    let uniqueDataSets = _.uniq(_.pluck(sampleGroup.data_sets, "data_set_id"));
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
        throw new Meteor.Error("data-set-empty", "No samples found",
            `Specified filters for ${dataSet.name} returned no samples. ` +
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
  getRecords(collection_name, mongo_id) {
    check([collection_name, mongo_id], [String]);

    let user = MedBook.ensureUser(this.userId);
    let obj = MedBook.collections[collection_name].findOne(mongo_id);
    user.ensureAccess(obj);

    // make sure the collection name is okay, figure out the sort object
    let sort;
    if (collection_name === "Forms") {
      sort = {
        [obj.sample_label_field]: 1
      };
    } else if (collection_name === "GeneSets") {
      sort = {
        [obj.gene_label_field]: 1
      };
    } else {
      throw new Meteor.Error("permission-denied");
    }

    return Records.find({
      "associated_object.mongo_id": mongo_id,
      "associated_object.collection_name": collection_name,
    }, { sort }).fetch();
  },
  // Applies the expression and variance filters to a sample group
  // returns the upsert return value
  applyExprVarianceFilters(sampleGroupId) {
    // checks and permissions
    check(sampleGroupId, String);
    let user = MedBook.ensureUser(Meteor.userId());
    let sampleGroup = SampleGroups.findOne(sampleGroupId);
    user.ensureAccess(sampleGroup);

    // This job should never run more than once for
    // a sample group, so we should never need to search for
    // an existing filter blob & delete it. But we probably should,
    // just in case.
    return Jobs.upsert({
      name: "ApplyExprAndVarianceFilters",
      args: {
        sample_group_id: sampleGroupId,
      }
    }, {
      $setOnInsert: {
        status: "waiting",
        user_id: user._id,
        collaborations: [],

        // defaultValues don't work with upserts, so set some fields manually
        timeout_length: 7 * 24 * 60 * 60 * 1000, // a week
        collaborations: [],
        prerequisite_job_ids: [],
        retry_count: 0,
      }
    });
  },

  // Get the genes that should have icons appear next to their names.
  // They are contained in a special geneSetGroup named
  // "GeneSets appearing as icons. Do not delete. oRZvz3Gbim"
  // To specify the icon & color, each gene_set's name should be, eg, "yellow star".
  // (this is a meteor method & not a publication so we can transform the find server-side)
  getGeneInfos(){
    let findBlessedSet = {"name":"GeneSets appearing as icons. Do not delete. oRZvz3Gbim"};

    let addExtraInfo = function(geneSet) {
      let genesWithInfo = {} ;
      genesWithInfo.color = geneSet.name.split(" ")[0];
      genesWithInfo.icon = geneSet.name.split(" ")[1];
      genesWithInfo.description = geneSet.description ;
      genesWithInfo.genes = geneSet.gene_labels;
      return genesWithInfo ;
    }
    let howManyBlessed = GeneSetGroups.find(findBlessedSet).count();
    // If we don't find the collection -- OR someone else has attempted to hijack the icons by
    // making their own collection -- shut the whole thing down
    // TODO: This isn't the best implementation --
    // We need a better way / UI to indicate this collection.
    if(howManyBlessed !== 1){
      console.log("Can't determine which gene sets to display as icons.")
     return [];
    }
    let blessedGeneSet = GeneSetGroups.findOne(findBlessedSet);

    return GeneSets.find({
      gene_set_group_id: blessedGeneSet._id,
    }, {transform: addExtraInfo}).fetch();
  },

  createNewUser(email, password) {
    check([email, password], [String]);

    // Only allow logged-in users to create new users so that no one
    // can come along and start using our precious resources.
    let loggedInUser = MedBook.ensureUser(Meteor.userId());

    let newUserId = Accounts.createUser({
      email,
      password
    });
    console.log(`${loggedInUser.email()} created new user: ${email}`);

    return newUserId;
  },

  // remove a single sample from a data set
  // NOTE: If someone is reading data from a data set while this
  //       Meteor method is running, they could get bogus data. We need to
  //       put in soft-locks to prevent that before making a UI for this
  //       functionality.
  // TODO: perhaps have a flag on a data set where we can see if it's corrupt
  //       or not (in case a function like this fails). Currently if it fails,
  //       currently_wrangling will continue to be true and no one can modify
  //       the data set, but users can continue to read the data (running jobs
  //       or downloading the data).
  removeSampleFromDataSet(data_set_id, sampleIndex) {
    check(data_set_id, String);
    check(sampleIndex, Number);

    let user = MedBook.ensureUser(Meteor.userId());

    let dataSet = DataSets.findOne(data_set_id);
    user.ensureAccess(dataSet);

    // soft lock the data set, bail if we can't get a lock on it
    let modifiedCount = DataSets.update({
      _id: data_set_id,

      // This query attribute is the reason we can be sure the lock
      // doesn't go to two threads at the same time.
      currently_wrangling: false,
    }, {
      $set: {
        currently_wrangling: true
      }
    });
    if (modifiedCount !== 1) {
      throw new Meteor.Error("data-set-wrangling",
          "The data set is currently being modified elsewhere. " +
          "Please try again later.");
    }

    // validate the provided sampleIndex
    // NOTE: we need to do this after the soft lock because otherwise the
    //       data set could change out from under us
    if (sampleIndex < 0 || sampleIndex >= dataSet.sample_labels.length) {
      // we're going to bail out so unset the soft lock on the data set
      DataSets.update(data_set_id, {
        $set: {
          currently_wrangling: false
        }
      });

      throw new Meteor.Error("invalid-sample-index");
    }

    // calculate the new sample label array and index for the data set
    let { sample_labels } = dataSet;

    // remove the sample label from the array
    sample_labels.splice(sampleIndex, 1);

    // regenerate the index based on the new array
    let sample_label_index = _.reduce(sample_labels,
        (memo, sampleLabel, index) => {
      memo[sampleLabel] = index;
      return memo;
    }, {});

    // create a future in order to do some fun async stuff before the method
    // returns
    let future = new Future();

    // update the GenomicExpression documents
    // NOTE: There is no way to remove a given index from an array with mongo.
    //       It's been 6 YEARS and they still haven't scheduled the feature:
    //       https://jira.mongodb.org/browse/SERVER-1014
    // Instead of using a mongo modifier: we pull each document out of the db,
    // modify it, and then put it back. This requires N update commands where
    // N is the number of features in the data set.
    let promises = GenomicExpression.find({ data_set_id }).map((doc) => {
      let { values } = doc;

      // remove the value for the specified sample
      values.splice(sampleIndex, 1);

      // make a promise for this single update
      return new Promise((resolve, reject) => {
        // push the modified document back into the db
        GenomicExpression.rawCollection().update({ _id: doc._id }, {
          $set: { values }
        }, (error, result) => {
          if (error) { reject(error); }
          else { resolve(); }
        });
      });
    });

    // Wait until all of the genomic expression updates have completed and then
    // update the data set with the new sample information. Also unset the
    // soft lock because we're all done.
    Promise.all(promises)
      .then(() => {
        // use rawCollection because we don't have the Meteor environment
        // and also because SimpleSchema takes forever to validate large arrays
        DataSets.rawCollection().update({ _id: data_set_id }, {
          $set: {
            currently_wrangling: false,
            sample_labels,
            sample_label_index,
          }
        }, (error, result) => {
          if (error) {
            console.log("Error updating data set after removing single " +
                "sample from the data set genomic expression docs. The " +
                `data set ${dataSet.name} is now currupt: ${data_set_id}`);
            future.throw(error);
          } else {
            future.return();
          }
        });
      })
      .catch((error) => {
        console.log("Error removing single sample from data set! " +
            `The data set ${dataSet.name} may now be corrupt: ${data_set_id}`);
        console.log(error);
        future.throw(error);
      });

    // wait for future.throw or future.return to be called
    return future.wait();
  },
});
