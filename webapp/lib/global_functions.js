getPatientSampleLabels = function(patientReport) {
  return _.pluck(patientReport.samples, "sample_label");
}

cohortSignaturesOfType = function (typeName, patientReport) {

  var patientSampleLabels

  if (patientReport === undefined) {
    patientSampleLabels = [];
  } else {
    patientSampleLabels = getPatientSampleLabels(patientReport);
  }

  return CohortSignatures.find({
    "type": typeName,
    "sample_values": {
      $elemMatch: {
        sample_label: {
          $in: patientSampleLabels
        }
      }
    }
  });
}

topCohortSignaturesOfType = function(typeName, patientReport) {

  var patientSampleLabels = getPatientSampleLabels(patientReport);

  if (patientSampleLabels !== undefined) {
    var documents = cohortSignaturesOfType(typeName, patientReport).fetch();

    function findPercentThrough(cohortSignature, sample_label) {
      var index = lodash.findIndex(cohortSignature.sample_values,
        function (current) {
          return current.sample_label == sample_label;
        }
      );
      if (index === -1) {
        return 0;
      }
      return index / cohortSignature.sample_values.length;
    }


    function compareHighestSample(first, second) {
      for (var i = patientSampleLabels.length - 1; 0 <= i ; i--) {
        var difference = findPercentThrough(second, patientSampleLabels[i])
            - findPercentThrough(first, patientSampleLabels[i]);
        if (difference !== 0) {
          return difference;
        }
      }
      return 0;
    }

    var toRet = documents.sort(compareHighestSample).slice(0, 10);

    return toRet;
  }
  return [];
}
