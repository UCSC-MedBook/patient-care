contrastSchema = new SimpleSchema({
  "name": { type: String },
  "group1": { type: String },
  "group2": { type: String },
  "list1": { type: [String] }, // probably not a String
  "list1": { type: [String] }
  // had collaborations field
});

geneInSignatureSchema = new SimpleSchema({
  "name": { type: String }, // human_gene_id
  "weight": { type: String }, // not optional
  "pval": { type: String, optional: true }
});

schemas.signatureInCohortSchema = new SimpleSchema({
  "name": { type: String },
  "contrast": { type: contrastSchema },
  "study_human_id": { type: String },
  "study_gid": { type: String },
  "members": { type: [geneInSignatureSchema] },
});
