// appBody metadata

Meteor.publish("patientLabel", function(patientId) {
  let user = MedBook.ensureUser(this.userId);
  let patient = Patients.findOne(patientId);
  user.ensureAccess(patient);

  return Patients.find(patientId, { fields: { patient_label: 1 } });
});

// patients

Meteor.publish("patients", function(searchString) {
  check(searchString, String);

  let user = MedBook.ensureUser(this.userId);

  let query = { collaborations: { $in: user.getCollaborations() } };

  // only use regex if there's something to search for
  if (searchString) {
    query.patient_label = {
      $regex: new RegExp(searchString, "i")
    };
  }

  return Patients.find(query, {
    sort: { patient_label: 1 }
  });
});

Meteor.publish("patient", function (patientId) {
  check(patientId, String);

  let user = MedBook.ensureUser(this.userId);
  let patient = Patients.findOne(patientId);
  user.ensureAccess(patient);

  return Patients.find(patientId);
});

Meteor.publish("sampleLoadedData", function (patientId, sample_label) {
  check(patientId, String);

  let user = MedBook.ensureUser(this.userId);
  let patient = Patients.findOne(patientId);
  user.ensureAccess(patient);

  let sample = _.findWhere(patient.samples, { sample_label });

  return DataSets.find(sample.data_set_id, {
    fields: {
      ["gene_expression_index." + sample_label]: 1
    }
  });
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

// collaborations

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

// manage DataSets/SampleGroups/GeneSetCollections

var allowedCollections = [
  "DataSets",
  "SampleGroups",
  "GeneSetCollections",
];

Meteor.publish("allOfCollectionOnlyName", function(collectionName) {
  check(collectionName, String);
  let user = MedBook.ensureUser(this.userId);

  return MedBook.collections[collectionName].find({
    collaborations: { $in: user.getCollaborations() },
  }, { fields: { name: 1 } });
});

Meteor.publish("objectFromCollection", function(collectionName, objectId) {
  check([collectionName, objectId], [String]);
  let user = MedBook.ensureUser(this.userId);

  return MedBook.collections[collectionName].find({
    _id: objectId,
    collaborations: { $in: user.getCollaborations() },
  });
});

// tools

Meteor.publish("dataSets", function() {
  var user = MedBook.ensureUser(this.userId);

  return DataSets.find({
    collaborations: {$in: user.getCollaborations() },
  });
});

Meteor.publish("dataSetNamesAndSamples", function() {
  var user = MedBook.ensureUser(this.userId);

  return DataSets.find({
    collaborations: {$in: user.getCollaborations() },
  }, { fields: { name: 1, sample_labels: 1 } });
});

Meteor.publish("jobsOfType", function (name) {
  check(name, String);

  let user = MedBook.ensureUser(this.userId);

  // only allow certain job names
  let allowedJobNames = [
    "RunLimmaGSEA",
    "UpDownGenes",
    "TumorMapOverlay"
  ];
  if (allowedJobNames.indexOf(name) === -1) {
    return null;
  }

  return Jobs.find({
    name,
    collaborations: { $in: user.getCollaborations() },
  });
});

Meteor.publish("patientAndSampleLabels", function() {
  var user = MedBook.ensureUser(this.userId);

  return Patients.find({
    collaborations: {$in: user.getCollaborations() },
  }, { fields: { patient_label: 1, "samples.sample_label": 1 } });
});

// tools/OutlierAnalysis

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

// experimenal

Meteor.publish("forms", function () {
  let user = MedBook.ensureUser(this.userId);

  return Forms.find({
    collaborations: { $in: user.getCollaborations() },
  });
});

Meteor.publish("records", function(form_id) {
  let user = MedBook.ensureUser(this.userId);

  let form = Forms.findOne(form_id);



  return Records.find({
    collaborations: { $in: user.getCollaborations() },
    form_id,
    data_set_id,
  });
});

// general

Meteor.publish("geneSetCollections", function () {
  let user = MedBook.ensureUser(this.userId);

  return GeneSetCollections.find({
    collaborations: { $in: user.getCollaborations() },
  });
});

Meteor.publish("sampleGroups", function () {
  let user = MedBook.ensureUser(this.userId);

  return SampleGroups.find({
    collaborations: { $in: user.getCollaborations() },
  });
});

Meteor.publish("blob", function (blobId) {
  check(blobId, String);

  // TODO
  // NOTE: no security... if they have the _id they can have it
  return Blobs.find(blobId);
});
