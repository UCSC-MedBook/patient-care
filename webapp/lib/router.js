FlowRouter.notFound = {
  action(params) {
    BlazeLayout.render("appBody", {content: "routeNotFound", params, });
  }
};

FlowRouter.route("/", {
  name: "home",
  action(params) {
    BlazeLayout.render("appBody", {content: "home", params });
  }
});

FlowRouter.route("/data-set/:data_set_id", {
  name: "dataSet",
  action(params) {
    BlazeLayout.render("appBody", {content: "dataSet", params });
  }
});

FlowRouter.route("/create-record", {
  name: "createRecord",
  action(params) {
    BlazeLayout.render("appBody", {content: "createRecord", params });
  }
});

FlowRouter.route("/create-form", {
  name: "createForm",
  action(params) {
    BlazeLayout.render("appBody", {content: "createForm", params });
  }
});

FlowRouter.route("/edit-records", {
  name: "editRecords",
  action(params) {
    BlazeLayout.render("appBody", {content: "editRecords", params });
  }
});

FlowRouter.route("/manage-data-sets", {
  name: "manageDataSets",
  action(params) {
    BlazeLayout.render("appBody", { content: "manageDataSets", params });
  }
});

FlowRouter.route("/manage-data-sets/create", {
  name: "createDataSet",
  action(params) {
    BlazeLayout.render("appBody", { content: "manageDataSets", params });
  }
});

FlowRouter.route("/patients/:study_label/:patient_label", {
  name: "patient",
  action(params) {
    BlazeLayout.render("appBody", {content: "patient", params });
  }
});

FlowRouter.route("/patients/:study_label/:patient_label/upDownGenes/:job_id", {
  name: "upDownGenes",
  action(params) {
    BlazeLayout.render("appBody", {content: "upDownGenesJob", params });
  }
});

// tools

FlowRouter.route("/tools/limmaGSEA", {
  name: "listLimmaGSEA",
  action(params) {
    BlazeLayout.render("appBody", {content: "listLimmaGSEA", params });
  }
});
