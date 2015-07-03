
Patients = new Meteor.Collection("patients_in_cohort");

///////////////
// SimpleSchema
///////////////

treatmentSchema = new SimpleSchema({
  "start_date": { type: Date },
  "end_date": { type: Date, optional: true },
  "drug_name": { type: String },
  "reason_for_stop": { type: String, optional: true },
  "prior_treatment": { type: Boolean, optional: true },
  // add optional fields
});

memberEventSchema = new SimpleSchema({
  name: { type: simplifiedGeneSchema },
  event: { type: [String] } // to be defined further later
});

pathwaySchema = new SimpleSchema({
  name: { type: String },
  members: { type: [memberEventSchema] }
  // events array for each member?
});

Patients.attachSchema(new SimpleSchema({
  "Patient_ID": { type: String },
  "study": { type: simplifiedStudySchema },
  "age": { type: Number, optional: true },
  "is_alive" : { type: Boolean, optional: true },
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
  "samples": { // contains Sample_IDs
    type: [String],
    // will we display more information
    optional: true
  },
  "treatments": {
    type: [treatmentSchema],
    optional: true
  },
  "pathways": {
    type: [pathwaySchema],
    optional: true
  },
  "signatures": {
    type: [simplifiedSignatureSchema],
    optional: true
  }
}));
