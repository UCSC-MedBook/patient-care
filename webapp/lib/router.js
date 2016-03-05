FlowRouter.route("/", {
  name: "home",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "home",
      params
    });
  }
});

FlowRouter.route("/:study_label", {
  name: "study",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "study",
      params
    });
  }
});

FlowRouter.route("/:study_label/:patient_label", {
  name: "patient",
  action: function(params) {
    BlazeLayout.render("appBody", {
      content: "patient",
      params
    });
  }
});
