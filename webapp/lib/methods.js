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
});
