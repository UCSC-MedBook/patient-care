// Template.appBody

Template.appBody.onCreated(function () {
  let instance = this;

  instance.autorun(function () {
    let params = instance.data.params();

    if (params.data_set_id) {
      instance.subscribe("dataSet", params.data_set_id);
    }
  });
});

Template.appBody.helpers({
  getDataSetName: function () {
    let dataSet = DataSets.findOne(this.params().data_set_id);
    if (dataSet) {
      return dataSet.name;
    }
    return "loading";
  },
  invalidUrl() {
    return FlowRouter.getRouteName() === undefined;
  },
});



// Template.showErrorMessage

Template.showErrorMessage.helpers({
  getError: function () {
    return Template.instance().data.get();
  },
});

Template.showErrorMessage.events({
  "click .close-error-message": function (event, instance) {
    instance.data.set(null);
  },
});
