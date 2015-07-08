// note: this collection will contain patient-identifiable information

Schemas.patientReportItem = new SimpleSchema({
  "created_at": { type: Date },
  "patient_report_id": { type: String }
});

Schemas.patients = new SimpleSchema({
  "patient_label": { type: String }, // DTB-056
  "study_id": { type: String },
  "study_label": { type: String },
  "study_site": { type: String, optional: true },
  "on_study_date": { type: Date },
  "off_study_date": { type: Date, optional: true }, // if null, still on study
  "patient_report_ids": { type: [Schemas.patientReportItem] }, // refers to "patient_reports" collection
  // age, gender, race, ethnicity
});
