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

FlowRouter.route("/data-set/:data_set_id", {
  name: "dataSet",
  action: _.partial(defaultAction, "dataSet"),
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

FlowRouter.route("/collaborations", {
  name: "manageCollaborations",
  action: _.partial(defaultAction,  "manageCollaborations"),
});

FlowRouter.route("/collaborations/create", {
  name: "createCollaboration",
  action: _.partial(defaultAction,  "manageCollaborations"),
});

FlowRouter.route("/collaborations/browse", {
  name: "browseCollaborations",
  action: _.partial(defaultAction,  "manageCollaborations"),
});

FlowRouter.route("/patients/:study_label/:patient_label", {
  name: "patient",
  action: _.partial(defaultAction, "patient"),
});

FlowRouter.route("/patients/:study_label/:patient_label/upDownGenes/:job_id", {
  name: "upDownGenes",
  action: _.partial(defaultAction, "upDownGenesJob"),
});

// tools

FlowRouter.route("/tools/limmaGSEA", {
  name: "listLimmaGSEA",
  action: _.partial(defaultAction, "listLimmaGSEA"),
});
