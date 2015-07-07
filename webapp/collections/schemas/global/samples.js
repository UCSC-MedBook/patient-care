pathwayMemberSchema = new SimpleSchema({
  "name": { type: String },
  "gene_id": { type: String, optional: true },
  "events": { type: [String] }
});

sampleSpecificPathwaySchema = new SimpleSchema({
  "name": { type: String }, // ex. cell cycle
  "pathway_id": { type: String },
  "members": { type: [pathwayMemberSchema] }
});

sampleSpecificSignatureSchema = new SimpleSchema({
  "signature_id": { type: String },
  "signature_label": { type: String }, // eg. small-cell
  "value_type": { type: String }, // ex. kinase_viper
  // contains data for waterfall plot
  "patient_values_in_cohort": { type: [patientValuePairSchema] }
  // we'll know the current patient from the top-level object
});

schemas.samplesSchema = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "sample_label": { type: String }, // Sample_ID
  "patient_id": { type: String },n
  "patient_label": { type: String },
  "site_of_metastasis" : { type: String, optional: true },
  "procedure_day": { type: Number, optional: true },
  "pathways": {
    type: [sampleSpecificPathwaySchema],
    optional: true
  },
  "signatures": {
    type: [sampleSpecificSignatureSchema],
    optional: true
  },
  "mutations": { type: [mutationSchema], optional: true },
  "genes": { type: [geneExpressionSchema], optional: true } // should we have this?
});
