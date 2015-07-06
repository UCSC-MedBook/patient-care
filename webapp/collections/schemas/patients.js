// note on "_day" fields:
// These are numbers as counted from patient.on_study_date

treatmentSchema = new SimpleSchema({
  // if day 3, they started 3 days after starting the trial
  "start_day": { type: Number },
  // if null --> still on treatment
  "end_day": { type: Number, optional: true },
  "drug_name": { type: String },
  "reason_for_stop": { type: String, optional: true },
  //"prior_treatment": { type: Boolean, optional: true },
});

console.log(schemas.samplesSchema);

schemas.patientsSchema = new SimpleSchema({
  "human_patient_id": { type: String }, // Patient_ID, ex. DTB-056
  "human_study_id": { type: String },
  "study_site": { type: String, optional: true },
  "on_study_date": { type: Date, optional: true },
  "off_study_day": { type: Number, optional: true },
  "age": { type: Number, optional: true },
  "gender": { type: String, optional: true },
  "last_known_survival_status" : { type: String, optional: true },
  "neoplasm_disease_stage" : { type: String, optional: true },
  "pathology_T_stage" : { type: String, optional: true },
  "pathology_N_stage" : { type: String, optional: true },
  "pathology_M_stage" : { type: String, optional: true },
  "radiation_therapy" : { type: String, optional: true },
  "radiations_radiation_regimen_indication" : { type: String, optional: true },
  "completeness_of_resection" : { type: String, optional: true },
  "number_of_lymph_nodes" : { type: Number, optional: true },
  "gleason_grade" : { type: String, optional: true },
  "baseline_psa" : { type: Number, optional: true },
  "psa_nadir" : { type: Number, optional: true },
  "psa_nadir_days" : { type: Number, optional: true },
  "race" : { type: String, optional: true },
  "ethnicity" : { type: String, optional: true },
  // What information do we have for prior treatments?
  // Should they be kept under "treatments" or "prior_treatments"
  "treatments": {
    type: [treatmentSchema],
    optional: true
  },
  "samples": {
    type: [schemas.samplesSchema],
    optional: true
  }
});
