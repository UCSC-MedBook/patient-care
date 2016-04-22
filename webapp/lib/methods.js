Meteor.methods({
  createUpDownGenes: function (args) {
    check(args, new SimpleSchema({
      study_label: { type: String },
      patient_label: { type: String },
    }));

    let user = MedBook.ensureUser(Meteor.userId());

    // TODO: cron job to delete "creating" jobs that are old.
    return Jobs.insert({
      name: "UpDownGenes",
      user_id: user._id,
      status: "creating",
      args,
    });
  },
  // Set the rest of the arguments to the UpDownGenes job and start it.
  // If the job has already been run with other arguments, return the _id
  // of the job that has those arguments.
  startUpDownGenes: function (jobId, args) {
    check(jobId, String);
    check(args, new SimpleSchema({
      study_label: { type: String },
      patient_label: { type: String },
      sample_label: { type: String },
    }));

    _.extend(args, {
      sample_group_name: "Manual name",
      sample_group_id: "manually_created_sample_group"
    });

    let user = MedBook.ensureUser(Meteor.userId());
    let study = Studies.findOne({id: args.study_label});
    user.ensureAccess(study);

    // check to see if a job like this one has already been run,
    // and if so, return that job's _id
    let duplicateJob = Jobs.findOne({ args });
    if (duplicateJob) {
      Jobs.remove(jobId);
      return duplicateJob._id;
    }

    Jobs.update({
      _id: jobId,
      name: "UpDownGenes",
      status: "creating",
    }, {
      $set: {
        args,
        status: "waiting",
      }
    });
  },
});
