/**
 *
 * @param {Object} geneReport   network data in the "network" property
 * @param {Object} expressionData
 */
function chrisCodeHere(geneReport, expressionData) {
  console.log("geneReport: ", geneReport);
  console.log("expressionData: ", expressionData);

  if (geneReport.network.elements.length > 0) {
    // write your code here!
    var containerDiv = document.getElementById("render-circle-map-here");
    circleMapGraph.build({
      "medbookGraphData" : geneReport,
      "medbookExprData" : expressionData,
      "containerDiv" : containerDiv,
      "circleDataLoaded" : true
    });
  }
}

Template.renderCircleMap.rendered = function() {
  Deps.autorun(function(first) {
    if (Session.get("geneReportLoaded") === true) {
      var geneReport = GeneReports.find().fetch()[0];
      var expressionData = expression2.find().fetch();
      chrisCodeHere(geneReport, expressionData);
      first.stop();
    }
  });
};

Template.geneReport.helpers({
  networkHasElements: function (array) {
    return array.length > 0;
  }
});
