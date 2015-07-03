
Patients = new Meteor.Collection("patients_in_cohort");

///////////////
// SimpleSchema
///////////////

treatmentSchema = new SimpleSchema({
  // if day 3, they started 3 days after starting the trial
  "start_day": { type: Number },
  // if null --> still on treatment
  "end_day": { type: Number, optional: true },
  "drug_name": { type: String },
  "reason_for_stop": { type: String, optional: true },
  //"prior_treatment": { type: Boolean, optional: true },
});

sampleSchema = new SimpleSchema({
  "name": { type: String }, // Sample_ID
  "arm" : { type: String, optional: true },
  "day" : { type: Number, optional: true },
  "phase" : { type: String, optional: true },
  "segment" : { type: String, optional: true },
  "site" : { type: String, optional: true },
  "day_of_procedure": { type: Number, optional: true },
  "visit_day": { type: Number, optional: true },
  "pathways": {
    type: [simplifiedPathwaySchema],
    optional: true
  },
  "signatures": {
    type: [simplifiedSignatureSchema],
    optional: true
  }
});

Patients.attachSchema(new SimpleSchema({
  "Patient_ID": { type: String },
  "study": { type: simplifiedStudySchema },
  "study_site": { type: String, optional: true },
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
  "psa_result_preop" : { type: Number, optional: true },
  "psa_value" : { type: Number, optional: true },
  "race" : { type: String, optional: true },
  "ethnicity" : { type: String, optional: true },
  "samples": {
    type: [sampleSchema],
    optional: true
  },
  "treatments": {
    type: [treatmentSchema],
    optional: true
  }
}));
