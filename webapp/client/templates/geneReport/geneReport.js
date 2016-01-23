/**
 *
 * @param {Object} geneReport   network data in the "network" property
 * @param {Object} expressionData
 */
function chrisCodeHere(geneReport, patientSamples, expressionData, viperSignaturesData) {
    console.log("geneReport: ", geneReport);
    console.log("expressionData: ", expressionData);
    console.log("viperSignaturesData", viperSignaturesData);
    console.log("patientSamples", patientSamples);

    if (geneReport.network.elements.length > 0) {
        // write your code here!
        var containerDiv = document.getElementById("render-circle-map-here");
        circleMapGraph.build({
            "patientSamples" : patientSamples,
            "medbookGraphData" : geneReport,
            "medbookExprData" : expressionData,
            "medbookViperSignaturesData" : viperSignaturesData,
            "containerDiv" : containerDiv,
            "circleDataLoaded" : true
        });
    }
}

function getQueryStringParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

/**
 *
 * @param {Object} patient_label
 */
function getPatientSamples(patient_label) {
    var patientData = PatientReports.findOne({
        "patient_label" : patient_label
    }, {
        "metadata" : 1
    });

    if (_.isUndefined(patientData)) {
        return [];
    }

    var sample_labels = patientData["metadata"]["sample_labels"];
    var returnObj = [{
        "patient_label" : patient_label,
        "sample_labels" : sample_labels
    }];

    return returnObj;
};

Template.renderCircleMap.rendered = function() {
    Deps.autorun(function(first) {
        if (Session.get("geneReportLoaded") === true) {
            var geneReport = GeneReports.find().fetch()[0];
            var expressionData = Expression2.find().fetch();
            var viperSignaturesData = CohortSignatures.find().fetch();

            // add in sample_values
            _.each(viperSignaturesData, function(value) {
                if (!value.sample_values) {
                    value.sample_values = value.samples;
                }
            });

            var patient_label = getQueryStringParameterByName("patient_label");
            var patientSamples = getPatientSamples(patient_label);

            chrisCodeHere(geneReport, patientSamples, expressionData, viperSignaturesData);
            first.stop();
        }
    });
};

Template.geneReport.helpers({
    networkHasElements : function(array) {
        return array.length > 0;
    }
});
