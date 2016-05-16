FlowRouter.notFound = {
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "routeNotFound",
      params,
    });
  }
};

FlowRouter.route("/", {
  name: "home",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "home",
      params
    });
  }
});

FlowRouter.route("/data-set/:data_set_id", {
  name: "dataSet",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "dataSet",
      params
    });
  }
});

FlowRouter.route("/create-record", {
  name: "createRecord",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "createRecord",
      params
    });
  }
});

FlowRouter.route("/create-form", {
  name: "createForm",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "createForm",
      params
    });
  }
});

FlowRouter.route("/patients/:study_label/:patient_label", {
  name: "patient",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "patient",
      params
    });
  }
});

FlowRouter.route("/patients/:study_label/:patient_label/upDownGenes/:job_id", {
  name: "upDownGenes",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "upDownGenesJob",
      params
    });
  }
});

// tools

FlowRouter.route("/tools/limmaGSEA", {
  name: "listLimmaGSEA",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "listLimmaGSEA",
      params
    });
  }
});
