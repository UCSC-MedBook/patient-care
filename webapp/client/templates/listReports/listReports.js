Template.listReports.helpers({
  getPatientReports: function () {
    return PatientReports.find({}, {sort: { "patient_label": 1 }});
  },
  getGeneReports: function () {
    return GeneReports.find({}, {sort: { "gene_label": 1 }, limit: 100});
  },
  getPathwayReports: function () {
    return ["Pathway 1", "Pathway 2", "Pathway 3"];
  }
});
