function chrisCodeHere(geneReport, expressionData) {
  console.log("geneReport: ", geneReport);
  console.log("expressionData: ", expressionData);

  // write your code here!
}

Template.renderCircleMap.rendered = function () {
  Deps.autorun(function (first) {
    if (Session.get("geneReportLoaded") === true) {
      var geneReport = GeneReports.find().fetch()[0];
      var expressionData = expression2.find().fetch();
      chrisCodeHere(geneReport, expressionData);
      first.stop();
    }
  });
};
