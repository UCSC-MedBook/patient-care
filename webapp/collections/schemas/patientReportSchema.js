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
  "pathway_id": { type: String },
  "pathway_label": { type: String }, // ex. cell cycle
  "members": { type: [Schemas.pathwayMember] }
});

Schemas.signatureAlgorithm = new SimpleSchema({
  "signature_algorithm_report_id": { type: String }, // "signature_algorithm_report"
  "signature_algorithm_label": { type: String }, // eg. small-cell
  "value_type": { type: String }, // ex. kinase_viper
  "individual_signatures": { type: [Schemas.signature] },
  "job_id": { type: Meteor.ObjectID }, // refers to "jobs" collection (what generated this signatureReport)
  "version_number": { type: String }
  // we'll know the current patient from the top-level object
});

Schemas.signatureType = new SimpleSchema({
  "type": { type: String },
  "description": { type: String },
  "signature_algorithms": { type: [Schemas.signatureAlgorithm] }
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
  "sample_id": { type: Meteor.ObjectID }, // refers to "samples" collection
  "sample_label": { type: String }, // Sample_ID
  "site_of_metastasis" : { type: String, optional: true },
  "procedure_day": { type: Number, optional: true },
  "pathways": {
    type: [Schemas.samplePathway],
    optional: true
  },
  "signature_types": {
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
  // if day 3, they started 3 days after starting the trial
  "start_day": { type: Number, optional: true },
  // if null --> still on treatment
  "end_day": { type: Number, optional: true },
  "description": { type: String, optional: true },
  "drug_name": { type: String, optional: true },
  "reason_for_stop": { type: String, optional: true },
  "psa_response": { type: String, optional: true },
  "bone_response": { type: String, optional: true },
  "category": { type: String, optional: true }, // ex. "Clinical Trial"
});

Schemas.psaReading = new SimpleSchema({
  "day": { type: Number },
  "value": { type: Number }
});

Schemas.patientReports = new SimpleSchema({
  // hidden from user
  "_id": { type: Meteor.ObjectID },
  "created_at": { type: Date },
  "viewed": { type: Boolean }, // should it be kept forever? dun dun dunn
  "patient_id": { type: Meteor.ObjectID }, // refers to "patients" collection
  "study_id": { type: Meteor.ObjectID },

  // header
  "patient_label": { type: String }, // Patient_ID, ex. DTB-056

  // study
  "study_label": { type: String },
  "study_site": { type: String, optional: true },
  "is_on_study": { type: Boolean, optional: true },

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

  // treatments
  "psa_levels": { type: [Schemas.psaReading], optional: true },
  "treatments": {
    type: [Schemas.treatment],
    optional: true
  },

  // samples
  "samples": {
    type: [Schemas.samples],
    optional: true
  }
});
