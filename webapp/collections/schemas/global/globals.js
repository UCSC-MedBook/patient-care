schemas = {};

// for waterfall plots
patientValuePairSchema = new SimpleSchema({
  "patient_gid": { type: String },
  "human_patient_id": { type: String },
  "value": { type: Number }
});
