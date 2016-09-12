function defaultAction(templateName, params) {
  // renders appBody with templateName inside
  BlazeLayout.render("appBody", { content: templateName, params });
}

function sameNameAndAction(name) {
  return { name, action: _.partial(defaultAction, name) }
}

FlowRouter.notFound = {
  action: _.partial(defaultAction, "routeNotFound"),
};

FlowRouter.route("/", sameNameAndAction("home"));

// var patients = FlowRouter.group({ prefix: "/patients" });
// patients.route("/", sameNameAndAction("listPatients"));
// patients.route("/:patient_id", sameNameAndAction("patient"));

var collaborations = FlowRouter.group({ prefix: "/collaborations" });
collaborations.route("/", sameNameAndAction("manageCollaborations"));
collaborations.route("/create", {
  name: "createCollaboration",
  action: _.partial(defaultAction,  "manageCollaborations"),
});
collaborations.route("/browse", {
  name: "browseCollaborations",
  action: _.partial(defaultAction,  "manageCollaborations"),
});

// manage data

var manage = FlowRouter.group({ prefix: "/manage" });

manage.route("/:collectionSlug?/:selected?",
    sameNameAndAction("manageObjects"));

manage.route("/clinical-forms/:form_id/view-records",
    sameNameAndAction("viewFormRecords"));

// tools

var tools = FlowRouter.group({ prefix: "/tools" });
tools.route("/gsea", sameNameAndAction("listGsea"));
tools.route("/gsea/:job_id", sameNameAndAction("gseaJob"));
tools.route("/paired-analysis", sameNameAndAction("listPairedAnalysis"));
tools.route("/paired-analysis/:job_id", sameNameAndAction("pairedAnalysisJob"));
tools.route("/limma", sameNameAndAction("listLimma"));
tools.route("/limma/:job_id", sameNameAndAction("limmaJob"));
tools.route("/outlier-analysis", sameNameAndAction("listUpDownGenes"));
tools.route("/outlier-analysis/:job_id", sameNameAndAction("upDownGenesJob"));
tools.route("/single-sample-top-genes",
    sameNameAndAction("listSingleSampleTopGenes"));
tools.route("/single-sample-top-genes/:job_id",
    sameNameAndAction("singleSampleTopGenesJob"));

// old jobs
tools.route("/limma-gsea", sameNameAndAction("listLimmaGSEA"));
tools.route("/limma-gsea/:job_id", sameNameAndAction("limmaGseaJob"));
tools.route("/tumor-map", sameNameAndAction("listTumorMap"));


// documentation

FlowRouter.route("/widgets", sameNameAndAction("widgetsDemo"));
