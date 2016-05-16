// Template.dataSet

Template.dataSet.onCreated(function () {
  const instance = this;

  instance.autorun(function () {
    Meteor.userId();
    instance.subscribe("dataSet", instance.data.data_set_id);
  });
});

Template.dataSet.helpers({
  getDataSet: function () {
    return DataSets.findOne(this.data_set_id);
  },
});
