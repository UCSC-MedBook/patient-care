Meteor.publish("studies", function () {
  var user = MedBook.ensureUser(this.userId);

  return Studies.find({
    collaborations: {$in: user.getCollaborations() },
  });
});

Meteor.publish("study", function (study_label) {
  check(study_label, String);
  var user = MedBook.ensureUser(this.userId);

  return Studies.find({
    id: study_label,
    collaborations: {$in: user.getCollaborations() },
  });
});

Meteor.publish("patientSamples", function (study_label, patient_label) {
  check([study_label, patient_label], [String]);

  var user = MedBook.ensureUser(this.userId);
  var study = Studies.findOne({id: study_label});
  user.ensureAccess(study);

  var cursor = Samples.find({
    study_label,
    patient_label,
  });

  // if the samples don't exist for the patient, create them
  var asArray = cursor.fetch();
  var sample_labels = _.pluck(asArray, "sample_label");
  var patient = _.findWhere(study.patients, { patient_label });
  if (!patient) {
    this.ready();
    return;
  }

  _.each(patient.sample_labels, (sample_label) => {
    if (sample_labels.indexOf(sample_label) === -1) {
      Samples.insert({
        study_label,
        patient_label,
        sample_label
      });
    }
  });

  return cursor;
});

Meteor.publish("upDownGenes", function (study_label, patient_label) {
  check([study_label, patient_label], [String]);

  let user = MedBook.ensureUser(this.userId);
  let study = Studies.findOne({id: study_label});
  user.ensureAccess(study);

  return Jobs.find({
    name: "UpDownGenes",
    status: { $ne: "creating" },
    "args.study_label": study_label,
    "args.patient_label": patient_label,
  });
});

Meteor.publish("upDownGenesJob", function (jobId) {
  check(jobId, String);

  let user = MedBook.ensureUser(this.userId);
  let job = Jobs.findOne({
    _id: jobId,
    name: "UpDownGenes",
  });
  let study = Studies.findOne({id: job.args.study_label});
  user.ensureAccess(study);

  return Jobs.find({ _id: jobId });
});

Meteor.publish("blob", function (blobId) {
  check(blobId, String);

  // NOTE: no security... if they have the _id they can have it
  return Blobs.find(blobId);
});

Meteor.publish("sampleGroups", function () {
  let user = MedBook.ensureUser(this.userId);

  return SampleGroups.find({
    collaborations: { $in: user.getCollaborations() },
  });
});

Meteor.publish("geneSetCollections", function () {
  let user = MedBook.ensureUser(this.userId);

  return GeneSetCollections.find({
    collaborations: { $in: user.getCollaborations() },
  });
});

Meteor.publish("limmaGSEAJobs", function () {
  let user = MedBook.ensureUser(this.userId);

  return Jobs.find({
    name: "RunLimmaGSEA",
    user_id: this.userId,
  });
});
