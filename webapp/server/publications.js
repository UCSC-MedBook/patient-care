Meteor.publish("PatientReport", function (patientLabel) {

  var patientCursor = PatientReports.find(
        {"patient_label": patientLabel},
        {limit: 1}
      );

  var cohortSignaturesCursor = CohortSignatures.find({
        "_id": { $in: patientCursor.fetch()[0]['cohort_signature_ids'] }
      });

  return [
    patientCursor,
    cohortSignaturesCursor,
  ];
});

// allows quick linking between patient reports
Meteor.publish("ReportMetadata", function () {
  console.log("publishing report metadata");
  return [
    PatientReports.find({}, {
      fields: {
        "patient_id": 1,
        "patient_label": 1
      }
    }),
  ];
});

Meteor.publish("GeneReport", function (geneLabel) {
  // TODO: add security and such

  var geneReportCursor = GeneReports.find({"gene_label": geneLabel});
  var currentReport = geneReportCursor.fetch()[0];

  var geneNames = _.pluck(currentReport.network.elements, 'name');
  var expression2Cursor = expression2.find({"gene": { $in: geneNames }});
  var cohortSignaturesCursor = CohortSignatures.find({
    "algorithm": "viper",
    "label": geneLabel
  });

  return [
    geneReportCursor,
    expression2Cursor,
    cohortSignaturesCursor,
  ];
});
