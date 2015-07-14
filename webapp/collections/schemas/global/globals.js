Schemas = {};
Schemas.topLevel = {};

// for waterfall plots
Schemas.patientValuePair = new SimpleSchema({
  "patient_id": { type: String },
  "patient_label": { type: String },
  "value": { type: Number }
});

Schemas.thresholdColors = new SimpleSchema({
  "lower_than_threshold": { type: String },
  "higher_than_threshold": { type: String },
  "between_thresholds": { type: String },
});

Schemas.signature = new SimpleSchema({
  "signature_label": { type: String },
  "upper_significance_value": { type: Number },
  "lower_significance_value": { type: Number },
  "patient_values": { type: [Schemas.patientValuePair] }, // contains data

  // text to the left of the vertical axis
  "vertical_axis_text": { type: String, optional: true },

  // for if
  "lowest_value_for_algorithm": { type: Number, optional: true },
  "highest_value_for_algorithm": { type: Number, optional: true },
  "colors": { type: Schemas.thresholdColors, optional: true }
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
