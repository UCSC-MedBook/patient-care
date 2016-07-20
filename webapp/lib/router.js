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

// tools

var tools = FlowRouter.group({ prefix: "/tools" });
tools.route("/limma-gsea", sameNameAndAction("listLimmaGSEA"));
tools.route("/limma-gsea/:job_id", sameNameAndAction("limmaGseaJob"));
tools.route("/tumor-map", sameNameAndAction("listTumorMap"));
tools.route("/outlier-analysis", sameNameAndAction("listUpDownGenes"));
tools.route("/outlier-analysis/:job_id", sameNameAndAction("upDownGenesJob"));
