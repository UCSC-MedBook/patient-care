// Template.manageDataSets

Template.manageDataSets.onCreated(function () {
  let instance = this;

  instance.subscribe("allOfCollectionOnlyName", "DataSets");
});

Template.manageDataSets.helpers({
  getDataSets() { return DataSets.find({}); },
  getDataSet() {
    return DataSets.findOne(FlowRouter.getQueryParam("selected_id"));
  },
});

// Template.createDataSet

AutoForm.addHooks("insertDataSet", {
  onSuccess(submitType, selected_id) {
    FlowRouter.go("manageDataSets", {}, { selected_id });
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
    let selectedId = FlowRouter.getQueryParam("selected_id");
    instance.subscribe("objectFromCollection", "DataSets", selectedId);
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
  onDelete() {
    return () => {
      FlowRouter.setQueryParams({ selected_id: null });
    };
  },
});
