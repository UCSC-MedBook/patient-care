// Template.createSampleGroup

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

    Meteor.call("createSampleGroup", sampleGroup, (error, selected) => {
      if (error) {
        if (error.reason === "Match failed") {
          // there might be edge cases here which I haven't found yet so other
          // messages might have to be shown instead
          instance.error.set({ header: "Please correct errors above" });
        } else if (!error.details) {
          console.log("error:", error);
          instance.error.set({
            header: "Internal server error",
            message: error.reason || "Error: " + error.error,
          });
        } else {
          console.log("error:", error);
          instance.error.set({
            header: error.reason,
            message: error.details
          });
        }
      } else {
        FlowRouter.setParams({ selected });
      }
    });
  },
});

// Template.showSampleGroup

Template.showSampleGroup.helpers({
  slugToString: MedBook.utility.slugToString,
  downloadUrl() {
    let userId = Meteor.userId();
    let loginToken = Accounts._storedLoginToken();

    return `/download/${userId}/${loginToken}/data-collection/` +
        `SampleGroups/${this._id}`;
  },
  totalSampleCount() {
    return _.reduce(this.data_sets, (memo, sgDataSet) => {
      return memo + sgDataSet.sample_count;
    }, 0);
  },
});

// Template.waitAndThenPermissionDenied

Template.waitAndThenPermissionDenied.onCreated(function() {
  let instance = this;

  instance.waitForTheServer = new ReactiveVar(true);

  instance.timeoutHandle = Meteor.setTimeout(() => {
    instance.waitForTheServer.set(false);
  }, 15 * 1000);
});

Template.waitAndThenPermissionDenied.events({
  "click .skip-wait"(event, instance) {
    Meteor.clearTimeout(instance.timeoutHandle);

    instance.waitForTheServer.set(false);
  },
});
