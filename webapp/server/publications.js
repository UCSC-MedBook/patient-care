// // appBody metadata
//
// Meteor.publish("patientLabel", function(patientId) {
//   let user = MedBook.ensureUser(this.userId);
//   let patient = Patients.findOne(patientId);
//   user.ensureAccess(patient);
//
//   return Patients.find(patientId, { fields: { patient_label: 1 } });
// });

// // patients
//
// Meteor.publish("patients", function(searchString) {
//   check(searchString, String);
//
//   let user = MedBook.ensureUser(this.userId);
//
//   let query = { collaborations: { $in: user.getCollaborations() } };
//
//   // only use regex if there's something to search for
//   if (searchString) {
//     query.patient_label = {
//       $regex: new RegExp(searchString, "i")
//     };
//   }
//
//   return Patients.find(query, {
//     sort: { patient_label: 1 }
//   });
// });
//
// Meteor.publish("patient", function (patientId) {
//   check(patientId, String);
//
//   let user = MedBook.ensureUser(this.userId);
//   let patient = Patients.findOne(patientId);
//   user.ensureAccess(patient);
//
//   return Patients.find(patientId);
// });
//
// Meteor.publish("sampleLoadedData", function (patientId, sample_label) {
//   check(patientId, String);
//
//   let user = MedBook.ensureUser(this.userId);
//   let patient = Patients.findOne(patientId);
//   user.ensureAccess(patient);
//
//   let sample = _.findWhere(patient.samples, { sample_label });
//
//   return DataSets.find(sample.data_set_id, {
//     fields: {
//       ["gene_expression_index." + sample_label]: 1
//     }
//   });
// });
//
// Meteor.publish("upDownGenes", function (data_set_id, patient_label) {
//   check([data_set_id, patient_label], [String]);
//
//   let user = MedBook.ensureUser(this.userId);
//   let dataSet = DataSets.findOne(data_set_id);
//   user.ensureAccess(dataSet);
//
//   return Jobs.find({
//     name: "UpDownGenes",
//     status: { $ne: "creating" },
//     "args.data_set_id": data_set_id,
//     "args.patient_label": patient_label,
//   });
// });

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

// manageObjects

var allowedCollections = [
  "DataSets",
  "SampleGroups",
  "GeneSets",
  "GeneSetGroups",
  "Forms",
  "Studies",
];

Meteor.publish("allOfCollectionOnlyMetadata", function(collectionName) {
  check(collectionName, String);
  let user = MedBook.ensureUser(this.userId);

  if (allowedCollections.indexOf(collectionName) === -1) return [];

  return MedBook.collections[collectionName].find({
    collaborations: { $in: user.getCollaborations() },
  }, { fields: { name: 1, version: 1 } });
});

Meteor.publish("objectFromCollection", function(collectionName, objectId) {
  check([collectionName, objectId], [String]);
  let user = MedBook.ensureUser(this.userId);

  if (allowedCollections.indexOf(collectionName)  === -1) return [];

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

Meteor.publish("dataSetNamesSamples", function() {
  var user = MedBook.ensureUser(this.userId);

  return DataSets.find({
    collaborations: {$in: user.getCollaborations() },
  }, {
    fields: {
      name: 1,
      sample_labels: 1,

      // to get rid of ensureAccess errors client-side
      collaborations: 1,
    }
  });
});

// all data necessary for the GSEA form
Meteor.publish("gseaFormData", function (maybeGeneSetId) {
  // See below for string validation. maybeGeneSetId can be null sometimes,
  // so Match.Optional will fail. This should be Match.Maybe but that's
  // not available until Meteor 1.3.
  check(maybeGeneSetId, Match.Any);

  let user = MedBook.ensureUser(this.userId);

  // send only siguatures
  let geneSetsQuery = {
    collaborations: { $in: user.getCollaborations() },
    "fields.value_type": "Number",
  };

  // send only the selected gene set if provided
  if (maybeGeneSetId) {
    check(maybeGeneSetId, String);

    geneSetsQuery._id = maybeGeneSetId;
  }

  return [
    GeneSets.find(geneSetsQuery, {
      fields: {
        name: 1,
      }
    }),
    GeneSetGroups.find({
      collaborations: { $in: user.getCollaborations() },
    }, {
      fields: {
        name: 1,
        gene_set_names: 1,
      }
    }),
  ];
});

// send down the sample labels for a specific data set
Meteor.publish("dataSetSampleLabels", function (dataSetId) {
  check(dataSetId, String);

  let user = MedBook.ensureUser(this.userId);

  return DataSets.find({
    _id: dataSetId,
    collaborations: { $in: user.getCollaborations() },
  }, {
    name: 1,
    sample_labels: 1,
  });
});

Meteor.publish("limmaFormData", function (value_type) {
  check(value_type, String);

  let user = MedBook.ensureUser(this.userId);

  return SampleGroups.find({
    value_type,
    collaborations: { $in: user.getCollaborations() },
  });
});

// return all jobs with a given name, filtered by extraQuery if provided
Meteor.publish("jobsOfType", function (name, query) {
  check(name, String);

  // first check with Match.Any so the audit-arguments package doesn't
  // complain about us using the variable before checking it's type
  check(query, Match.Any);
  if (!query) { query = {}; }
  check(query, Object);

  let user = MedBook.ensureUser(this.userId);

  // only allow certain job names
  // NOTE: I don't know if this actually adds any security
  let allowedJobNames = [
    "RunLimmaGSEA",
    "UpDownGenes",
    "TumorMapOverlay",
    "ApplyExprAndVarianceFilters",
    "RunGSEA",
    "RunPairedAnalysis",
    "RunLimma",
  ];
  if (allowedJobNames.indexOf(name) === -1) {
    return null;
  }

  // NOTE: name and collaborations override those attributes in query if
  // they exist
  _.extend(query, {
    name,
    collaborations: { $in: user.getCollaborations() },
  });

  return Jobs.find(query);
});

// publish all UpDownGenes jobs to be shown in a list view
Meteor.publish("upDownGenesJobs", function () {
  let user = MedBook.ensureUser(this.userId);

  return Jobs.find({
    name: "UpDownGenes",
    collaborations: { $in: user.getCollaborations() },
  }, {
    fields: {
      // for showing the job
      name: 1,
      collaborations: 1,
      status: 1,
      args: 1,

      // only send down relevant output
      // (the list of genes itself is relatively large)
      "output.up_genes_count": 1,
      "output.down_genes_count": 1,

      // client-side sorting
      date_created: 1,
    },
  });
});

// a gene set linked to a certain object
Meteor.publish("associatedObjectGeneSet",
    function (associatedObj, metadata = {}) {
  check(associatedObj, {
    mongo_id: String,
    collection_name: String
  });
  check(metadata, Object);

  let { mongo_id, collection_name } = associatedObj

  let user = MedBook.ensureUser(this.userId);
  let obj = MedBook.collections[collection_name].findOne(mongo_id);
  user.ensureAccess(obj);

  let query = {
    "associated_object.mongo_id": mongo_id,
    "associated_object.collection_name": collection_name,
  };

  // only query with metadata if something is defined
  if (Object.keys(metadata).length > 0) {
    query.metadata = metadata;
  }

  return GeneSets.find(query, {
    fields: {
      // don't send down this gigantic list
      gene_labels: 0
    }
  });
});

// Let anyone with access to a sample group have access
// to all ApplyExprAndVarianceFilters jobs for that sample group,
// to avoid applying them twice.
Meteor.publish("sampleGroupFilterJobs", function(sampleGroupId) {
  check(sampleGroupId, String);
  let user = MedBook.ensureUser(this.userId);
  let sampleGroup = SampleGroups.findOne(sampleGroupId);
  if(! user.hasAccess(sampleGroup)){ return this.ready();}

  return Jobs.find({
    name: "ApplyExprAndVarianceFilters",
    'args.sample_group_id': sampleGroupId,
  });
});

// Let a document subscribe to all blobs2 associated with it
Meteor.publish("blobsAssociatedWithObject", function(collectionName, objectId) {
  check(collectionName, String);
  check(objectId, String);

  let user = MedBook.ensureUser(this.userId);
  let doc = MedBook.collections[collectionName].findOne(objectId);

  // Indicate that the subscription will send no further data
  if(! user.hasAccess(doc)){ return this.ready();}

  return Blobs2.find({
    "associated_object.collection_name": collectionName,
    "associated_object.mongo_id": objectId,
  });
});

// Meteor.publish("patientAndSampleLabels", function() {
//   var user = MedBook.ensureUser(this.userId);
//
//   return Patients.find({
//     collaborations: {$in: user.getCollaborations() },
//   }, { fields: { patient_label: 1, "samples.sample_label": 1 } });
// });

// tools/OutlierAnalysis

Meteor.publish("specificJob", function (jobId) {
  check(jobId, String);

  let user = MedBook.ensureUser(this.userId);

  return Jobs.find({
    _id: jobId,
    collaborations: { $in: user.getCollaborations() },
  });
});

// general

Meteor.publish("geneSetGroups", function () {
  let user = MedBook.ensureUser(this.userId);

  return GeneSetGroups.find({
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

Meteor.publish("geneSetsForGroup", function (gene_set_group_id) {
  check(gene_set_group_id, String);

  let user = MedBook.ensureUser(this.userId);
  user.ensureAccess(GeneSetGroups.findOne(gene_set_group_id));

  return GeneSets.find({ gene_set_group_id });
});

Meteor.publish("geneSetInGroup", function (gene_set_group_id, geneSetNameIndex) {
  check(gene_set_group_id, String);
  check(geneSetNameIndex, Number);

  let user = MedBook.ensureUser(this.userId);
  let geneSetGroup = GeneSetGroups.findOne(gene_set_group_id);
  user.ensureAccess(geneSetGroup);

  return GeneSets.find({
    gene_set_group_id,
    name: geneSetGroup.gene_set_names[geneSetNameIndex]
  });
});
