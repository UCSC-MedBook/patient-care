Meteor.publish("patient_reports", function () {
  return PatientReports.find();
});
