pathwayMemberSchema = new SimpleSchema({
  "name": { type: String },
  "gene_gid": { type: String, optional: true },
  "events": { type: [String] }
});

sampleSpecificPathwaySchema = new SimpleSchema({
  "name": { type: String }, // ex. cell cycle
  "pathway_gid": { type: String },
  "members": { type: [pathwayMemberSchema] }
});

sampleSpecificSignatureSchema = new SimpleSchema({
  "signature_gid": { type: String },
  "signature_human_id": { type: String }, // eg. small-cell
  "value_type": { type: String }, // ex. kinase_viper
  "patient_values_in_cohort": { type: [patientValuePairSchema] }
  // we'll know the current patient from the top-level object
});

schemas.samplesSchema = new SimpleSchema({
  "human_sample_name": { type: String }, // Sample_ID
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
  "mutations": { type: [mutationSchema], optional: true }
});
