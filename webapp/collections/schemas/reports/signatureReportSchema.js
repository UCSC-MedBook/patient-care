Schemas.sampleInTrainingSet = new SimpleSchema({
  "sample_id": { type: String },
  "sample_label": { type: String }
});

Schemas.signatureWeights = new SimpleSchema({
  "gene_id": { type: String },
  "gene_label": { type: String },
  "weight": { type: String }, // not optional
  "pval": { type: String, optional: true } // do we need a p-value?
});

Schemas.studyMetadata = new SimpleSchema({
  "study_id": { type: String },
  "study_label": { type: String },
});

Schemas.signatureReports = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "signature_algorithm_id": { type: String },
  "signature_algorithm_label": { type: String },
  "studies": { type: Schemas.studyMetadata },
  "value_type": { type: String },
  "sparse_weights": { type: [Schemas.signatureWeights] },
  "dense_weights": { type: [Schemas.signatureWeights] },
});
