pathwayMemberSchema = new SimpleSchema({
  "name": { type: String },
  "gene_id": { type: String, optional: true },
  "events": { type: [String] }
});

samplePathwaySchema = new SimpleSchema({
  "name": { type: String }, // ex. cell cycle
  "pathway_id": { type: String },
  "members": { type: [pathwayMemberSchema] }
});

sampleSignatureSchema = new SimpleSchema({
  "signature_id": { type: String },
  "signature_label": { type: String }, // eg. small-cell
  "value_type": { type: String }, // ex. kinase_viper
  // contains data for waterfall plot
  "patient_values_in_cohort": { type: [patientValuePairSchema] }
  // we'll know the current patient from the top-level object
});

signatureType = new SimpleSchema({
  "type": { type: String },
  "description": { type: String },
  "signatures": { type: [sampleSignatureSchema] }
});

schemas.samplesSchema = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "sample_label": { type: String }, // Sample_ID
  "patient_id": { type: String },
  "patient_label": { type: String },
  "site_of_metastasis" : { type: String, optional: true },
  "procedure_day": { type: Number, optional: true },
  "pathways": {
    type: [samplePathwaySchema],
    optional: true
  },
  "signatures": {
    type: [signatureType],
    optional: true
  },
  "mutations": { type: [mutationSchema], optional: true },
});
