Meteor.methods({
  patientReportGo: function (description) {

    // console.log("patientReportGo description :: ");
    // console.log(description);

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
});
