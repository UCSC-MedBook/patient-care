// Template.manageDataSets

Template.manageDataSets.onCreated(function () {
  let instance = this;

  instance.subscribe("dataSetNames");
});

Template.manageDataSets.helpers({
  getDataSets() { return DataSets.find({}); },
  getDataSet() {
    return DataSets.findOne(FlowRouter.getQueryParam("data_set_id"));
  },
});

// Template.createDataSet

AutoForm.addHooks("insertDataSet", {
  onSuccess(submitType, data_set_id) {
    FlowRouter.go("manageDataSets", {}, { data_set_id });
  },
});

Template.createDataSet.helpers({
  nameAndDescription() {
    return DataSets.simpleSchema().pick(["name", "description"]);
  },
});

// Template.showDataSet

Template.showDataSet.onCreated(function() {
  let instance = this;

  instance.autorun(() => {
    instance.subscribe("dataSet", FlowRouter.getQueryParam("data_set_id"));
  });
});

Template.showDataSet.helpers({
  dataExistsClasses(attribute) {
    let dataSet = DataSets.findOne(Template.instance().data._id);

    if (dataSet &&
        dataSet[attribute][this] !== undefined) {
      return "green checkmark";
    } else {
      return "red remove";
    }
  },
  newSampleSchema() {
    return new SimpleSchema({
      data_set_id: { type: String },
      sample_label: { type: String, label: "Sample name" },
    });
  },
});
