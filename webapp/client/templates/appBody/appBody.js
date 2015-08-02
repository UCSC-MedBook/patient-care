Template.chartPicker.events({
  "click #change-chart-type": function () {
    if (Session.get("chartToRender") === "waterfall") {
      Session.set("chartToRender", "boxAndWhisker");
    } else {
      Session.set("chartToRender", "waterfall");
    }
  }
});
