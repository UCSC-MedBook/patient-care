// note on "_day" fields:
// These are numbers as counted from patient.on_study_date

//////////////////
// Schemas.samples
//////////////////

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
  "patient_values_in_cohort": { type: [Schemas.patientValuePair] },
  "job_id": { type: String }, // refers to "jobs" collection (what generated this signatureReport)
  // we'll know the current patient from the top-level object
});

Schemas.signatureType = new SimpleSchema({
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
  "sample_id": { type: String }, // refers to "samples" collection
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

//////////////////////////////////////////
// Related specifically to patients schema
//////////////////////////////////////////

Schemas.treatment = new SimpleSchema({
  "drug_name": { type: String }, // better name?
  // if day 3, they started 3 days after starting the trial
  "start_day": { type: Number },
  // if null --> still on treatment
  "end_day": { type: Number, optional: true },
  "reason_for_stop": { type: String, optional: true },
});

Schemas.psaLevel = new SimpleSchema({
  "day": { type: Number },
  "value": { type: Number }
});

Schemas.patientReports = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean }, // should it be kept forever? dun dun dunn
  "patient_id": { type: String }, // refers to "patients" collection
  "patient_label": { type: String }, // Patient_ID, ex. DTB-056
  "study_id": { type: String },
  "study_label": { type: String },
  "study_site": { type: String, optional: true },
  "is_on_study": { type: Boolean, optional: true },
  "age": { type: Number, optional: true },
  "gender": { type: String, optional: true },
  "race" : { type: String, optional: true },
  "ethnicity" : { type: String, optional: true },
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
  // for timeline
  "psa_trend": { type: [Schemas.psaLevel], optional: true },
  "treatments": {
    type: [Schemas.treatment],
    optional: true
  },
  "samples": {
    type: [Schemas.samples],
    optional: true
  }
});
