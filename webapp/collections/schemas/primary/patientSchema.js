// note: this collection will contain patient-identifiable information

// Schemas.patientReportItem = new SimpleSchema({
//   "created_at": { type: Date },
//   "patient_report_id": { type: String }
// });

Schemas.patients = new SimpleSchema({
  // hidden from user
  "_id": { type: Meteor.ObjectID },
  "patient_label": { type: String }, // Patient_ID, ex. DTB-056
  "study_id": { type: Meteor.ObjectID },

  "on_study_date": { type: Date },
  "off_study_date": { type: Date, optional: true }, // if null, still on study

  // demographics
  "age": { type: Number, optional: true },
  "gender": { type: String, optional: true },
  "race" : { type: String, optional: true },
  "ethnicity" : { type: String, optional: true },

  // clinical information
  "last_known_survival_status" : { type: String, optional: true },
  "neoplasm_disease_stage" : { type: String, optional: true },
  "pathology_T_stage" : { type: String, optional: true },
  "pathology_N_stage" : { type: String, optional: true },
  "pathology_M_stage" : { type: String, optional: true },
  "radiation_therapy" : { type: String, optional: true },
  "radiation_regimen_indication" : { type: String, optional: true },
  "completeness_of_resection" : { type: String, optional: true },
  "number_of_lymph_nodes" : { type: Number, optional: true },
  "gleason_grade" : { type: String, optional: true },
  "baseline_psa" : { type: Number, optional: true },
  "psa_nadir" : { type: Number, optional: true },
  "psa_nadir_days" : { type: Number, optional: true },

  // links elsewhere
  "blood_lab_ids": { type: [Meteor.ObjectID], optional: true },
  "treatment_ids": { type: [Meteor.ObjectID],  optional: true },
  "sample_ids": { type: [Meteor.ObjectID], optional: true },

  // We're never going to view a page with all of the patient information
  // (aka it should structured more like a SQL database than a Mongo database)
  // "patient_report_ids": { type: [Schemas.patientReportItem] }, // refers to "patient_reports" collection
});
