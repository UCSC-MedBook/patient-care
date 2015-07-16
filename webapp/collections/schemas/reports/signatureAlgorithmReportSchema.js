Schemas.pathwayReportLink = new SimpleSchema({
  "pathway_id": { type: String },
  "pathway_label": { type: String }
});

Schemas.trainingSet = new SimpleSchema({
  "name": { type: String },
  "group1": { type: String },
  "group2": { type: String },
  "list1": { type: [Schemas.sampleInTrainingSet] }, // probably not a String
  "list1": { type: [Schemas.sampleInTrainingSet] }
  // had collaborations field
});

Schemas.signatureAlgorithmReports = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "signature_algorithm_label": { type: String }, // eg. small-cell
  "value_type": { type: String }, // ex. kinase_viper
  "signatures": { type: [Schemas.signature] },
  "job_id": { type: String }, // refers to "jobs" collection (what generated this signatureReport)
  "version_number": { type: String },
  "top_pathways_enriched": { type: [Schemas.pathwayReportLink] },
  "training_set": { type: Schemas.trainingSet },
});

// delete me/move to signature_algorithms intermediary
