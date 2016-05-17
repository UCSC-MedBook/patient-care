Template.manageDataSets.onCreated(function () {
  let instance = this;

  instance.creating = new ReactiveVar(true);
  instance.selectedCollaboration = new ReactiveVar(null);

  instance.subscribe("dataSets");
  // woohoo!
});

Template.manageDataSets.helpers({
  getDataSets() {
    return DataSets.find({});
  },
});
