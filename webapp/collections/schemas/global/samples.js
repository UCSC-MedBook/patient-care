Schemas.pathwayMember = new SimpleSchema({
  "name": { type: String },
  "gene_id": { type: String, optional: true },
  "events": { type: [String] }
});

Schemas.samplePathway = new SimpleSchema({
  "name": { type: String }, // ex. cell cycle
  "pathway_id": { type: String },
  "members": { type: [Schemas.pathwayMember] }
});

Schemas.sampleSignature = new SimpleSchema({
  "signature_id": { type: String },
  "signature_label": { type: String }, // eg. small-cell
  "value_type": { type: String }, // ex. kinase_viper
  // contains data for waterfall plot
  "patient_values_in_cohort": { type: [Schemas.patientValuePair] }
  // we'll know the current patient from the top-level object
});

Schemas.signature = new SimpleSchema({
  "type": { type: String },
  "description": { type: String },
  "signatures": { type: [Schemas.sampleSignature] }
});

Schemas.geneSetMember = new SimpleSchema({
  "gene_label": { type: String },
  "gene_id": { type: String },
  // possibly other information
});

Schemas.geneSet = new SimpleSchema({
  "gene_set_label": { type: String },
  "members": { type: [Schemas.geneSetMember] }
});

Schemas.samples = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "sample_label": { type: String }, // Sample_ID
  "patient_id": { type: String },
  "patient_label": { type: String },
  "site_of_metastasis" : { type: String, optional: true },
  "procedure_day": { type: Number, optional: true },
  "pathways": {
    type: [Schemas.samplePathway],
    optional: true
  },
  "signatures": {
    type: [Schemas.signatureType],
    optional: true
  },
  "mutations": { type: [Schemas.mutation], optional: true },
  "gene_sets": { type: [Schemas.geneSet], optional: true }
});
