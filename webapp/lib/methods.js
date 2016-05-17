Meteor.methods({
  // Starts a new job with the given args. If a job already exists with
  // the given args, it instead returns the _id of that duplicate job.
  createUpDownGenes: function (args) {
    check(args, new SimpleSchema({
      study_label: { type: String },
      patient_label: { type: String },
      sample_label: { type: String },
      sample_group_id: { type: String },
      iqr_multiplier: { type: Number, decimal: true },
    }));

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(Studies.findOne({id: args.study_label}));

    let sampleGroup = SampleGroups.findOne(args.sample_group_id);
    user.ensureAccess(sampleGroup);
    _.extend(args, {
      sample_group_name: sampleGroup.name,
    });

    // make sure they have access to each of the studies in the sample group
    _.each(sampleGroup.studies, (sampleGroupStudy) => {
      user.ensureAccess(Studies.findOne({id: sampleGroupStudy.study_label}));
    });

    // check to see if a job like this one has already been run,
    // and if so, return that job's _id
    let duplicateJob = Jobs.findOne({ args });
    if (duplicateJob) {
      return duplicateJob._id;
    }

    // NOTE: I believe there could be a race condition here, but
    // I don't think Meteor handles more than one Meteor method at once.
    return Jobs.insert({
      name: "UpDownGenes",
      status: "waiting",
      user_id: user._id,
      args
    });
  },
  getSampleGroupVersion: function (name) {
    // return the next version given the sample group name
    // NOTE: this function only looks at the sample groups this user has
    // access to, which means sample groups are not necessarily uniquely
    // identifiable by { name, version }.

    let user = MedBook.ensureUser(Meteor.userId());

    let latestSampleGroup = SampleGroups.findOne({
      name,
      collaborations: { $in: user.getCollaborations() },
    }, { sort: { version: -1 } });

    if (latestSampleGroup) {
      return latestSampleGroup.version + 1
    }

    return 1; // default value
  },
  createSampleGroup: function (sampleGroup) {
    check(sampleGroup, Object); // more checking down below...

    // NOTE: this method might produce "unclean" errors because I don't
    // feel like rewriting most of the schema for SampleGroups for the
    // check function (above)

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(sampleGroup.collaborations);

    // make sure the version is correct (aka don't trust the user)
    // TODO: when should we increment the version?
    // What if the samples are the same?
    sampleGroup.version =
        Meteor.call("getSampleGroupVersion", sampleGroup.name);

    // ensure uniqueness for studies
    let uniqueStudies = _.uniq(_.pluck(sampleGroup.studies, "study_label"));
    if (uniqueStudies.length !== sampleGroup.studies.length) {
      throw new Meteor.Error("non-unique-studies");
    }

    // filter through each study
    // - make sure they have access
    // - filter the samples
    sampleGroup.studies = _.map(sampleGroup.studies, (sampleGroupStudy) => {
      let study = Studies.findOne({id: sampleGroupStudy.study_label});
      user.ensureAccess(study);

      // start with all the samples and then filter down from there
      let sample_labels = study.Sample_IDs;

      _.each(sampleGroupStudy.filters, (filter) => {
        let { options } = filter;

        if (filter.type === "sample_label_list") {
          if (_.difference(options.sample_labels, study.Sample_IDs).length) {
            throw new Meteor.Error("invalid-sample-labels");
          }

          sample_labels = _.intersection(sample_labels, options.sample_labels);
        } else if (filter.type === "exclude_sample_label_list") {
          if (_.difference(options.sample_labels, study.Sample_IDs).length) {
            throw new Meteor.Error("invalid-sample-labels");
          }

          sample_labels = _.difference(sample_labels, options.sample_labels);
        } else if (filter.type === "data_loaded") {
          if (options.gene_expression) {
            sample_labels = _.intersection(sample_labels,
                study.gene_expression);
          }
        }else {
          throw new Meteor.Error("invalid-filter-type");
        }
      });

      sampleGroupStudy.sample_labels = sample_labels;

      return sampleGroupStudy; // NOTE: _.map at beginning
    });

    return SampleGroups.insert(sampleGroup)
  },
  removeSampleGroup: function (sampleGroupId) {
    check(sampleGroupId, String);

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(SampleGroups.findOne(sampleGroupId));

    SampleGroups.remove(sampleGroupId);
  },
  createLimmaGSEA: function (args) {
    check(args, new SimpleSchema({
      sample_group_a_id: { type: String },
      sample_group_b_id: { type: String },
      limma_top_genes_count: { type: Number, min: 1 },
      gene_set_collection_id: { type: String },
    }));

    let user = MedBook.ensureUser(Meteor.userId());

    let geneSetColl = GeneSetCollections.findOne(args.gene_set_collection_id);
    user.ensureAccess(geneSetColl);

    // ensure access to sample group, studies inside
    _.each([
      args.sample_group_a_id,
      args.sample_group_b_id
    ], (sampleGroupId) => {
      let sampleGroup = SampleGroups.findOne(sampleGroupId);
      user.ensureAccess(sampleGroup);

      // studies not necessarily loaded on client
      if (Meteor.isServer) {
        _.each(sampleGroup.studies, (study) => {
          user.ensureAccess(Studies.findOne({id: study.study_label}));
        });
      }
    });

    // add the sample group names in there to make joins on the client easy
    // TODO: don't do to SampleGroups.findOne()s
    _.extend(args, {
      sample_group_a_name: SampleGroups.findOne(args.sample_group_a_id).name,
      sample_group_b_name: SampleGroups.findOne(args.sample_group_b_id).name,
      gene_set_collection_name: geneSetColl.name,
    });

    // if it's been run before return that
    let duplicateJob = Jobs.findOne({ args });
    if (duplicateJob) {
      return duplicateJob._id;
    }

    return Jobs.insert({
      name: "RunLimmaGSEA",
      status: "waiting",
      user_id: user._id,
      args,
    });
  },

  // return a list of the collaborations this user can share with
  getSharableCollaborations: function () {
    let user = MedBook.ensureUser(this.userId);

    // TODO: who can we share with?
    let usersCursor = Meteor.users.find({}, {
      fields: { "collaborations.personal": 1 }
    });
    let usersPersonalCollabs =
        _.pluck(_.pluck(usersCursor.fetch(), "collaborations"), "personal");

    return _.union(usersPersonalCollabs, user.getCollaborations());
  },
  insertRecord: function(values) {
    check(values, Object);

    let nonValueFields = [
      "collaborations",
      "data_set_id",
      "form_id",
      "patient_label",
      "sample_label",
    ];

    // remove added fields so that values is just the values
    let record = _.pick(values, nonValueFields);
    record.values = _.omit(values, nonValueFields);

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(Forms.findOne(record.form_id));
    user.ensureAccess(DataSets.findOne(record.data_set_id));
    user.ensureAccess(record.collaborations);

    Records.insert(record);
  },
  insertForm: function(newForm) {
    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(newForm);
    Forms.insert(newForm);
  },
});
