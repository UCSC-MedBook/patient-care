Meteor.publish("PatientReports", function (patientLabel) {
  return PatientReports.find({"patient_label": patientLabel});
});

// allows quick linking between patient reports
Meteor.publish("PatientReportMetadata", function () {
  console.log("publishing patient report metadata");
  return PatientReports.find({}, {
    fields: {
      "patient_id": 1,
      "patient_label": 1
    }
  });
});
