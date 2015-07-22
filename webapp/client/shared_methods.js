//
// defines global functions
//

// goes to a patient report given a patient_id
patientReportGo = function (patientId) {
  console.log("patientId: " + patientId);
  var patientReport = PatientReports.findOne({"patient_id": patientId});
  console.log(patientReport);
  if (patientReport) {
    if (Session.get("metadataReady")) {
      console.log("redirecting to " + patientReport.patient_label);
      Router.go("/patientReport/" + patientReport.patient_label);
    } else {
      console.log("waiting to get metadata")
    }
  } else {
    console.log("We don't have that patient!");
  }
}

// refers to parentView n times
// parentViewN = function (view, n) {
//   if (n > 0) {
//     return parentViewN(view.parentView, n - 1);
//   } else {
//     return view;
//   }
// }
