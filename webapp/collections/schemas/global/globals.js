Schemas = {};
Schemas.topLevel = {};

Schemas.signature = new SimpleSchema({
  "signature_label": { type: String },
  // contains data for waterfall plot
  "patient_values_in_cohort": { type: [Schemas.patientValuePair] },
});

Schemas.mutation = new SimpleSchema({
  "gene_label": { type: String },
  "gene_id": { type: String },
  "protein_change": { type: String, optional: true },
  "mutation_type": { type: String }, // variant_classification for us
  "chromosome": { type: String },
  "start_position": { type: Number },
  "end_position": { type: Number },
  "reference_allele": { type: String },
  "variant_allele": { type: String },
  "MA_FImpact": { type: String, optional: true },
  "MA_FIS": { type: Number, optional: true }
});

// for waterfall plots
Schemas.patientValuePair = new SimpleSchema({
  "patient_id": { type: String },
  "patient_label": { type: String },
  "value": { type: Number }
});
