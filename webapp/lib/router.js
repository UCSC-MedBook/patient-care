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

// patient-view

FlowRouter.route("/patients/:study_label", {
  name: "study",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "study",
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
