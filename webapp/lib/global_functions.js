getPatientSampleLabels = function(patientReport) {

  if (patientReport === undefined) {
    // walks up the Template.parentData tree until it finds where samples are
    var parentIndex = 0;
    var parentData;
    do {
      parentData = Template.parentData(parentIndex);
      parentIndex++;
    } while (parentData && parentData.samples === undefined);

    // couldn't find it in parent templates
    if (parentData === null
        || parentData.samples === undefined) {
      return undefined;
    }

    patientReport = parentData;
  }

  return _.pluck(patientReport.samples, "sample_label");
}

cohortSignaturesOfType = function (typeName) {
  var patientSampleLabels = getPatientSampleLabels();

  if (patientSampleLabels === undefined) {
    patientSampleLabels = [];
  }

  console.log("returning a new cursor with ", patientSampleLabels);

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

topCohortSignaturesOfType = function(typeName) {

  var patientSampleLabels = getPatientSampleLabels();

  if (patientSampleLabels !== undefined) {
    var documents = cohortSignaturesOfType.fetch();

    function findPercentThrough(cohortSignature, sample_label) {
      var index = lodash.findIndex(cohortSignature.sample_values, function (current) {
        return current.sample_label == sample_label;
      });
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

    return documents.sort(compareHighestSample).slice(0, 10);
  }
  return [];
}
