Meteor.publish("dataSetsNames", function() {
  var user = MedBook.ensureUser(this.userId);

  return DataSets.find({
    collaborations: {$in: user.getCollaborations() },
  }, {
    fields: { name: 1, collaborations: 1 },
  });
});

Meteor.publish("dataSets", function () {
  var user = MedBook.ensureUser(this.userId);

  return DataSets.find({
    collaborations: {$in: user.getCollaborations() },
  }, {
    fields: {
      name: 1,
      description: 1,
      sample_labels: 1,
      patients: 1,
      collaborations: 1,
    }
  });
});

Meteor.publish("dataSet", function (dataSetId) {
  check(dataSetId, String);
  var user = MedBook.ensureUser(this.userId);

  return DataSets.find({
    _id: dataSetId,
    collaborations: {$in: user.getCollaborations() },
  });
});

Meteor.publish("patientSamples", function (data_set_id, patient_label) {
  check([data_set_id, patient_label], [String]);

  var user = MedBook.ensureUser(this.userId);
  var dataSet = DataSets.findOne(data_set_id);
  user.ensureAccess(dataSet);

  var cursor = Samples.find({
    data_set_id,
    patient_label,
  });

  // if the samples don't exist for the patient, create them
  var asArray = cursor.fetch();
  var sample_labels = _.pluck(asArray, "sample_label");
  var patient = _.findWhere(dataSet.patients, { patient_label });
  if (!patient) {
    this.ready();
    return;
  }

  _.each(patient.sample_labels, (sample_label) => {
    if (sample_labels.indexOf(sample_label) === -1) {
      Samples.insert({
        data_set_id,
        patient_label,
        sample_label
      });
    }
  });

  return cursor;
});

Meteor.publish("upDownGenes", function (data_set_id, patient_label) {
  check([data_set_id, patient_label], [String]);

  let user = MedBook.ensureUser(this.userId);
  let dataSet = DataSets.findOne(data_set_id);
  user.ensureAccess(dataSet);

  return Jobs.find({
    name: "UpDownGenes",
    status: { $ne: "creating" },
    "args.data_set_id": data_set_id,
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
  let dataSet = DataSets.findOne(job.args.data_set_id);
  user.ensureAccess(dataSet);

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

Meteor.publish("forms", function () {
  let user = MedBook.ensureUser(this.userId);

  return Forms.find({
    collaborations: { $in: user.getCollaborations() },
  });
});

Meteor.publish("records", function(form_id, data_set_id) {
  let user = MedBook.ensureUser(this.userId);

  return Records.find({
    collaborations: { $in: user.getCollaborations() },
    form_id,
    data_set_id,
  });
});

Meteor.publish("adminAndCollaboratorCollaborations", function() {
  let user = MedBook.ensureUser(this.userId);
  let userCollabs = user.getCollaborations();

  return Collaborations.find({
    $or: [
      { name: { $in: userCollabs } },
      { administrators: { $in: userCollabs } },
    ],
  });
});

Meteor.publish("browseCollaborations", function() {
  let user = MedBook.ensureUser(this.userId);

  return Collaborations.find({
    publiclyListed: true,
    administrators: { $ne: [] }
  });
});
