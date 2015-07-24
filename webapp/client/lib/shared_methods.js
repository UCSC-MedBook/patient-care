//
// defines global functions (TODO: move them to MedBook.* in package)
//

// Router._scrollToHash = function (hash) {
//   var section = $(hash);
//   if (section.length) {
//       var sectionTop = section.offset().top;
//       $("html, body").animate({
//           scrollTop: sectionTop
//       }, "fast");
//   }
// };

patientReportGo = function (description) {
  if (Session.get("metadataReady")) {
    if (description.patient_id) {
      var patientReport = PatientReports.findOne({"patient_id": description.patient_id});
      if (patientReport) { // have a report for that patient_id ?
        if (description.sample_label) { // should jump to given sample ?
          //console.log("going to hash");
          Router.go(
            "patientReport",
            { "patient_label": patientReport.patient_label },
            { "hash": description.sample_label }
          );
        } else {
          //console.log("going regular");
          Router.go(
            "patientReport",
            { "patient_label": patientReport.patient_label }
          );
        }
      } else {
        console.log("no report for that patient");
      }
    } else {
      console.log("broken json description")
    }
  } else {
    console.log("waiting to get metadata")
  }
}
