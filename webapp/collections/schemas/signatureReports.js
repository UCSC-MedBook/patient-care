Schemas.contrast = new SimpleSchema({
  "name": { type: String },
  "group1": { type: String },
  "group2": { type: String },
  "list1": { type: [String] }, // probably not a String
  "list1": { type: [String] }
  // had collaborations field
});

Schemas.geneInSignature = new SimpleSchema({
  "gene_id": { type: String },
  "gene_label": { type: String },
  "weight": { type: String }, // not optional
  "pval": { type: String, optional: true }
});

Schemas.signatureReports = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "name": { type: String },
  "contrast": { type: Schemas.contrast },
  "study_id": { type: String },
  "study_label": { type: String },
  "members": { type: [Schemas.geneInSignature] },
});
