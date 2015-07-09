Schemas.pathwayReportLink = new SimpleSchema({
  "pathway_id": { type: String },
  "pathway_label": { type: String }
});

Schemas.signatureAlgorithmReports = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "signature_algorithm_label": { type: String }, // eg. small-cell
  "study_id": { type: String },
  "study_label": { type: String },
  "value_type": { type: String }, // ex. kinase_viper
  "signatures": { type: [Schemas.signature] },
  "job_id": { type: String }, // refers to "jobs" collection (what generated this signatureReport)
  "version_number": { type: String },
  "top_pathways_enriched": { type: [Schemas.pathwayReportLink] },
  "training_set": { type: Schemas.trainingSet },
});
