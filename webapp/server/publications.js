function topCohortSignatures(typeArray, patientReport) {

  function concatArrays(arrayOfArrays) {
    if (arrayOfArrays.length > 0) {
      return arrayOfArrays[0].concat(concatArrays(arrayOfArrays.slice(1)));
    }
    // should never get here
    return [];
  }

  var eachType = [];
  for (var i = 0; i < typeArray.length; i++) {
    eachType.push(topCohortSignaturesOfType(typeArray[i], patientReport));
  }

  return concatArrays(eachType);
}

Meteor.publish("PatientReport", function (patientLabel) {

  var patientCursor = PatientReports.find(
        // TODO: sort by date (once there are multiple per patient)
        {"patient_label": patientLabel},
        {limit: 1}
      );

  // collect all the signatures the patient is part of
  var patientReport = patientCursor.fetch()[0];

  var topCohortSignatureIds = _.pluck(topCohortSignatures([
    "kinase",
    "tf",
    "other"
  ], patientReport), "_id");

  console.log("topCohortSignatureIds: ", topCohortSignatureIds);

  if (patientReport) { // in case we don't have one
    var patientSamples = _.pluck(patientReport.samples, "sample_label");

    return [
      patientCursor,
      CohortSignatures.find({"_id": {$in: topCohortSignatureIds}}),
    ];
  } else {
    // must return this for Meteor to say the subscription is ready
    return [];
  }
});

Meteor.publish("GeneReport", function (geneLabel) {
  // TODO: add security and such

  var geneReportCursor = GeneReports.find(
    {"gene_label": geneLabel},
    {limit: 1}
  );
  var currentReport = geneReportCursor.fetch()[0];

  if (currentReport) { // in case we don't have one
    var geneNames = _.pluck(currentReport.network.elements, 'name');
    var expression2Cursor = expression2.find({"gene": { $in: geneNames }});
    var cohortSignaturesCursor = CohortSignatures.find({
      "algorithm": "viper",
      "label": { $in: geneNames },
    });

    return [
      geneReportCursor,
      expression2Cursor,
      cohortSignaturesCursor,
    ];
  } else {
    // must return this for Meteor to say the subscription is ready
    return [];
  }
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
