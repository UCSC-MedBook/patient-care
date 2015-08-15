Meteor.publish("PatientReport", function (patientLabel) {
  return PatientReports.find(
        // TODO: sort by date (once there are multiple per patient)
        {"patient_label": patientLabel},
        {limit: 1}
      );
});

function rankCohortSignature(cohortSignature, sampleLabels) {
  var samples = cohortSignature.samples;
  for (var labelIndex = sampleLabels.length - 1;
      labelIndex >= 0;
      labelIndex--) {
    var label = sampleLabels[labelIndex];
    for (var index in samples) {
      if (label === samples[index].sample_label) {
        return labelIndex + index / samples.length;
      }
    }
  }
  //console.log("ERROR: samples not found in given provided cohort signature");
  return 0;
}

function sortByRank(first, second) {
  return second.rank - first.rank;
}

Meteor.publish("topCohortSignatures",
  function(typeName, maxCount, sampleLabels) {
    console.log("publishing topCohortSignatures  typeName:", typeName,
        "  maxCount:", maxCount,
        "  sampleLabels:", sampleLabels);

    check(typeName, String);
    check(maxCount, Number);
    check(sampleLabels, [String]);

    var self = this;
    var initializing = true;
    var lowestPublishedRank = -1;

    function addTopOnes() {
      var allOfType = CohortSignatures.find({
        "type": typeName,
        "samples": {
          $elemMatch: {
            sample_label: {
              $in: sampleLabels
            }
          }
        }
      }).fetch();

      if (allOfType.length > 0) {
        // assign ranks
        for (var index in allOfType) {
          allOfType[index].rank = rankCohortSignature(allOfType[index],
              sampleLabels);
        }

        var toPublish = allOfType.sort(sortByRank).slice(0, maxCount);
        lowestPublishedRank = toPublish[toPublish.length - 1].rank;

        // publish top ones according to rank
        for (var current in toPublish) {
          self.added("cohort_signatures", toPublish[current]._id,
              toPublish[current]);
        }
      }
    }

    var handle = CohortSignatures.find({"type": typeName}).observeChanges({
      added: function (id, newOne) {
        if (!initializing) {
          console.log("something was added to CohortSignatures:", newOne);
          if (lowestPublishedRank < rankCohortSignature(newOne, sampleLabels)) {
            // TODO: should we remove the old ones?
            self.added("cohort_signatures", id, newOne);
          }
        }
      },
      removed: function (id) {
        console.log("something was removed in CohortSignatures");
      },
      changed: function (id) {
        console.log("something changed in CohortSignatures");
      }
    });

    initializing = false;
    addTopOnes();

    // Stop observing the cursor when client unsubs.
    self.onStop(function () {
      handle.stop();
    });

    self.ready();
  }
);

Meteor.publish("GeneReport", function (geneLabel) {
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
  return PatientReports.find({}, {
    fields: {
      "patient_label": 1,
      "metadata": 1,
    }
  });
});
