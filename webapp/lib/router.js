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

var patients = FlowRouter.group({ prefix: "/patients" });
patients.route("/", sameNameAndAction("listPatients"));
patients.route("/:patient_id", sameNameAndAction("patient"));

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

var dataSets = FlowRouter.group({ prefix: "/data-sets" });
dataSets.route("/", sameNameAndAction("manageDataSets"));
dataSets.route("/create", {
  name: "createDataSet",
  action: _.partial(defaultAction,  "manageDataSets"),
});

var sampleGroups = FlowRouter.group({ prefix: "/sample-groups" });
sampleGroups.route("/", sameNameAndAction("manageSampleGroups"));
sampleGroups.route("/create", {
  name: "createSampleGroup",
  action: _.partial(defaultAction,  "manageSampleGroups"),
});

var geneSets = FlowRouter.group({ prefix: "/gene-sets" });
geneSets.route("/", sameNameAndAction("manageGeneSetCollections"));
geneSets.route("/create", {
  name: "manageGeneSetCollections",
  action: _.partial(defaultAction,  "manageGeneSetCollections"),
});

var tools = FlowRouter.group({ prefix: "/tools" });
tools.route("/", sameNameAndAction("listTools"));
tools.route("/limma-gsea", sameNameAndAction("listLimmaGSEA"));
tools.route("/tumor-map", sameNameAndAction("listTumorMap"));
tools.route("/outlier-analysis", sameNameAndAction("listUpDownGenes"));
tools.route("/outlier-analysis/:job_id", sameNameAndAction("upDownGenesJob"));

// Experimental

FlowRouter.route("/create-record", sameNameAndAction("createRecord"));
FlowRouter.route("/create-form", sameNameAndAction("createForm"));
FlowRouter.route("/edit-records", sameNameAndAction("editRecords"));
