Meteor.publish("PatientReport", function (patientLabel) {

  var patientCursor = PatientReports.find(
    {"patient_label": patientLabel},
    {limit: 1});

  var chartIds = [];
  patientCursor.forEach(function (patient) { // better way to get the data?
    _.each(patient.samples, function (currentSample) {
      if (currentSample.cohort_signatures) {
        _.each(currentSample.cohort_signatures, function (currentSignature) {
          chartIds.push(currentSignature.chart_id);
        });
      }
    });
  });

  //console.log(chartIds);

  return [
    patientCursor,
    Charts.find({ "_id": {$in: chartIds} })
  ];
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

Meteor.publish("GeneReport", function (geneLabel) {
  // TODO: add security and such
  return [
    GeneReports.find({"gene_label": geneLabel})
  ];
});
