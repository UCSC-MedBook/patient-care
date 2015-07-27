Template.listReports.helpers({
  getReports: function () {
    return PatientReports.find({}, {sort: { "patient_label": 1 }});
  }
});
