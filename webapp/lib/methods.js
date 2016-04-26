Meteor.methods({
  // Starts a new job with the given args. If a job already exists with
  // the given args, it instead returns the _id of that duplicate job.
  createUpDownGenes: function (args) {
    check(args, new SimpleSchema({
      study_label: { type: String },
      patient_label: { type: String },
      sample_label: { type: String },
      sample_group_id: { type: String },
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

    let user = MedBook.findUser(Meteor.userId());
    user.ensureAccess(sampleGroup);

    // make sure the version is correct (aka don't trust the user)
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
        if (filter.type === "sample_label_list") {
          // for good measure, make sure all the sample labels are in the array
          let studySampleLabelMap =
              _.reduce(study.Sample_IDs, (memo, label) => {
            memo[label] = true;
            return memo;
          }, {});

          let badValues = _.filter(filter.options.sample_labels, (label) => {
            return !studySampleLabelMap[label];
          });

          if (badValues.length) {
            throw new Meteor.Error("invalid-sample-label-list");
          }

          // actually do the filtering
          sample_labels =
              _.intersection(sample_labels, filter.options.sample_labels);
        } else {
          throw new Meteor.Error("invalid-filter-type");
        }
      });

      sampleGroupStudy.sample_labels = sample_labels;

      return sampleGroupStudy; // NOTE: _.map at beginning
    });

    return SampleGroups.insert(sampleGroup)
  },
});
