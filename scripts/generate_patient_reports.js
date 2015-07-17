// remove all old patient reports (for now)
PatientReports.remove({});

function dateToDays(patient, date) {
  return date - patient.on_study_date;
}

function databaseError(error, result) {
  console.log("databaseError!!!");
  console.log(error);
  console.log(result);
}

//
// make the first level of the patient report
//

Patients.find().forEach(function (current) {

  var newReport = {
    // things not on the directCopyList
    "created_at": { new Date() },
    "patient_id": current._id,
    "is_on_study": !current.hasOwnProperty("off_study_date"),
  }

  var directCopyList = [ // newReport["thingy"]: current["thingy"]
    "patient_label",
    "study_id",
    "study_label",
    "study_site",

    // demographics
    "age",
    "gender",
    "race",
    "ethnicity",

    // clinical information
    "last_known_survival_status",
    "neoplasm_disease_stage",
    "pathology_T_stage",
    "pathology_N_stage",
    "pathology_M_stage",
    "radiation_therapy",
    "radiation_regimen_indication",
    "completeness_of_resection",
    "number_of_lymph_nodes",
    "gleason_grade",
    "baseline_psa",
    "psa_nadir",
    "psa_nadir_days",
  ];

  for (var i = 0; i < directCopyList.length; i++) {
    var attribute = directCopyList[i];
    newReport[attribute] = current[attribute];
  }

  // set samples

  PatientReports.insert(newReport);
});

//
// set patientReport.psa_levels
//

BloodLabs.find().forEach(function (current) {
  if (current.psa_level) { // only add if it has the info
    PatientReports.find({"_id": current.patient_id}) // find the right patient
      .update({
        $addToSet: {
          psa_levels: {
            "day": dateToDays(this, current.visit_date),
            "value": current.psa_level
          }
        }
      });
  }
});

//
// set patientReport.treatments
//

Treatments.find().forEach(function (current) {

  var newTreatment;

  var directCopyList = [
    "start_day": { type: Number, optional: true },
    // if null --> still on treatment
    "end_day": { type: Number, optional: true },
    "description": { type: String, optional: true },
    "drug_name": { type: String, optional: true },
    "reason_for_stop": { type: String, optional: true },
    "psa_response": { type: String, optional: true },
    "bone_response": { type: String, optional: true },
    "category": { type: String, optional: true }, // ex. "Clinical Trial"
  ];

  for (var i = 0; i < directCopyList.length; i++) {
    var attribute = directCopyList[i];
    newTreatment[attribute] = current[attribute];
  }

  PatientReports.find({"_id": current.patient_id})
    .update({
      $addToSet: {
        "treatments": newTreatment
      }
    });
});


//
// set samples level of patientReport (excluding deeper levels)
//

Samples.find().forEach(function (current) {

  var newSample;

  var directCopyList = [
    "start_day",
    "end_day",
    "description",
    "drug_name",
    "category",
  ];

  for (var i = 0; i < directCopyList.length; i++) {
    var attribute = directCopyList[i];
    newSample[attribute] = current[attribute];
  }

  PatientReports.find({"_id": current.patient_id})
    .update({
      $addToSet: {
        "samples": newSample
      }
    });
});

//
// validate all elements of PatientReports
//

var patients = PatientReports.find({"patient_label": "DTB-011"}).fetch();
for (var i = 0; i < patients.length; i++) {
  var currentPatient = patients[i];
  patientValidation.validate(currentPatient);
  if (patientValidation._invalidKeys.length > 0) {
    console.log("problem with " + currentPatient.patient_label);
    console.log(patientValidation._invalidKeys);
  } else {
    console.log(currentPatient.patient_label + " is all right");
  }
}
