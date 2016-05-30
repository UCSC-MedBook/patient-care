function defaultAction(templateName, params) {
  // renders appBody with templateName inside
  BlazeLayout.render("appBody", { content: templateName, params });
}

FlowRouter.notFound = {
  action: _.partial(defaultAction, "routeNotFound"),
};

FlowRouter.route("/", {
  name: "home",
  action: _.partial(defaultAction, "home"),
});



var patients = FlowRouter.group({ prefix: "/patients" });

patients.route("/", {
  name: "listPatients",
  action: _.partial(defaultAction, "listPatients"),
});

patients.route("/:patient_id", {
  name: "patient",
  action: _.partial(defaultAction, "patient"),
});

// FlowRouter.route("/patient/:patient_id/upDownGenes/:job_id", {
//   name: "upDownGenes",
//   action: _.partial(defaultAction, "upDownGenesJob"),
// });



var collaborations = FlowRouter.group({ prefix: "/collaborations" });

collaborations.route("/", {
  name: "manageCollaborations",
  action: _.partial(defaultAction,  "manageCollaborations"),
});

collaborations.route("/create", {
  name: "createCollaboration",
  action: _.partial(defaultAction,  "manageCollaborations"),
});

collaborations.route("/browse", {
  name: "browseCollaborations",
  action: _.partial(defaultAction,  "manageCollaborations"),
});



var tools = FlowRouter.group({ prefix: "/tools" });

tools.route("/", {
  name: "listTools",
  action: _.partial(defaultAction, "listTools"),
});

tools.route("/limma-gsea", {
  name: "listLimmaGSEA",
  action: _.partial(defaultAction, "listLimmaGSEA"),
});

tools.route("/tumor-map", {
  name: "listTumorMap",
  action: _.partial(defaultAction, "listTumorMap"),
});

tools.route("/outlier-analysis", {
  name: "listUpDownGenes",
  action: _.partial(defaultAction, "listUpDownGenes"),
});

tools.route("/outlier-analysis/:job_id", {
  name: "upDownGenesJob",
  action: _.partial(defaultAction, "upDownGenesJob"),
});






FlowRouter.route("/create-record", {
  name: "createRecord",
  action: _.partial(defaultAction, "createRecord"),
});

FlowRouter.route("/create-form", {
  name: "createForm",
  action: _.partial(defaultAction, "createForm"),
});

FlowRouter.route("/edit-records", {
  name: "editRecords",
  action: _.partial(defaultAction, "editRecords"),
});
