Template.listReports.helpers({
  getReports: function () {
    return PatientReports.find();
  }
});
