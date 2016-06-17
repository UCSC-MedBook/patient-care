// Template.manageSampleGroups

Template.manageSampleGroups.onCreated(function () {
  let instance = this;

  instance.subscribe("allOfCollectionOnlyName", "SampleGroups");
});

Template.manageSampleGroups.helpers({
  getSampleGroups() { return SampleGroups.find({}); },
  getSampleGroup() {
    return SampleGroups.findOne(FlowRouter.getQueryParam("selected_id"));
  },
});

// Template.createSampleGroup

AutoForm.addHooks("insertSampleGroup", {
  onSuccess(submitType, selected_id) {
    FlowRouter.go("manageSampleGroups", {}, { selected_id });
  },
});

Template.createSampleGroup.onCreated(function() {
  let instance = this;

  instance.newSampleGroup = new ReactiveVar();
  instance.error = new ReactiveVar();
});

Template.createSampleGroup.helpers({
  nameAndDescription() {
    return SampleGroups.simpleSchema().pick(["name", "description"]);
  },
  error() { return Template.instance().error },
  newSampleGroup() { return Template.instance().newSampleGroup },
});

Template.createSampleGroup.events({
  "click .create-sample-group"(event, instance) {
    let sampleGroup = instance.newSampleGroup.get();

    Meteor.call("createSampleGroup", sampleGroup, (error, selected_id) => {
      if (error) {
        if (error.reason === "Match failed") {
          // there might be edge cases here which I haven't found yet so other
          // messages might have to be shown instead
          instance.error.set({ header: "Please correct errors above" });
        } else {
          instance.error.set({
            header: error.reason,
            message: error.details
          });
        }
      } else {
        FlowRouter.go("manageSampleGroups", {}, { selected_id });
      }
    });
  },
});

// Template.showSampleGroup

Template.showSampleGroup.onCreated(function() {
  let instance = this;

  instance.autorun(() => {
    let selectedId = FlowRouter.getQueryParam("selected_id");
    instance.subscribe("objectFromCollection", "SampleGroups", selectedId);
  });
});

Template.showSampleGroup.helpers({
  onDelete() {
    return () => {
      FlowRouter.setQueryParams({ selected_id: null });
    };
  },
});

// Template.waitAndThenPermissionDenied

Template.waitAndThenPermissionDenied.onCreated(function() {
  let instance = this;

  instance.waitForTheServer = new ReactiveVar(true);
  Meteor.setTimeout(() => {
    instance.waitForTheServer.set(false);
  }, 15 * 1000);
});
