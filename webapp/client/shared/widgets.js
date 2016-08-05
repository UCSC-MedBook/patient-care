// Template.widgetsDemo
// This template is for internal documentation only.

Template.widgetsDemo.onCreated(function () {
  let instance = this;

  instance.error = new ReactiveVar({
    header: "I am a header",
    message: "You did something very wrong.",
  });
});

Template.widgetsDemo.helpers({
  fakeObject() {
    return {
      _id: "I am an _id",
      collaborations: [
        "wow Teo is so cool",
        "Ellen is cool too I guess",
        "I am a potato collaboration name",
      ],
    };
  },
  reactiveError() { return Template.instance().error; },
  fakeSamples() {
    return [
      "ckcc/A01",
      "ckcc/A02",
      "ckcc/A03",
      "ckcc/A04",
      "ckcc/A05",
      "ckcc/B01",
      "ckcc/B02",
      "ckcc/B03",
      "ckcc/B04",
      "ckcc/B05",
    ];
  },
  fakeJob(status) {
    return { status };
  },
  noAction() {
    return {
      action: "nothing"
    }
  },
});

// Template.shareAndDeleteButtons

Template.shareAndDeleteButtons.onCreated(function() {
  let instance = this;

  instance.deleteClicked = new ReactiveVar(false);
});

Template.shareAndDeleteButtons.helpers({
  deleteClicked() { return Template.instance().deleteClicked.get(); },
});

Template.shareAndDeleteButtons.events({
  "click .share.button"(event, instance) {
    Session.set("editCollaborationsCollection", instance.data.collectionName);
    Session.set("editCollaborationsMongoId", instance.data.object._id);

    $('.edit-collaborations.modal').modal('show');
  },
  "click .delete.button": function(event, instance) {
    var deleteClicked = instance.deleteClicked;

    if (deleteClicked.get()) {
      Meteor.call("removeObject", instance.data.collectionName,
          instance.data.object._id, (error) => {
        if (error) throw error;

        let onDelete = instance.data.onDelete;
        if (onDelete) {
          onDelete();
        }
      });
    } else {
      deleteClicked.set(true);

      // if they click elsewhere, cancel remove
      // wait until propogation finishes before registering event handler
      Meteor.defer(() => {
        $("html").one("click", () => {
          deleteClicked.set(false);
        });
      });
    }
  },
});

// Template.editCollaborationsModal

Template.editCollaborationsModal.onCreated(function() {
  let instance = this;

  instance.waitingForServer = new ReactiveVar(false);

  // who the user can share with
  instance.collabs = new ReactiveVar(null);
  instance.autorun(() => {
    // wait until we're logged in before getting sharable collaborations
    // also wait until they set one of the session variables to communicate
    // they're about to open the modal
    if (MedBook.findUser(Meteor.userId()) &&
        Session.get("editCollaborationsMongoId")) {
      Meteor.call("getSharableCollaborations", (error, result) => {
        if (error) throw error;

        instance.collabs.set(result);
      });
    }
  });
});

Template.editCollaborationsModal.onRendered(function() {
  let instance = this;

  instance.$('.edit-collaborations.modal').modal({
    onApprove() {
      var valid = AutoForm.validateForm("editCollaborations");
      if (valid) {
        let values = AutoForm.getFormValues("editCollaborations").insertDoc;
        instance.waitingForServer.set(true);

        let collectionName = Session.get("editCollaborationsCollection");
        let mongoId = Session.get("editCollaborationsMongoId");

        Meteor.call("updateObjectCollaborations",
            collectionName, mongoId,
            values.collaborations,
            (error) => {
          instance.waitingForServer.set(false);
          if (!error) {
            $('.edit-collaborations.modal').modal("hide");
          }
        });
      }

      return false;
    }
  });
});

Template.editCollaborationsModal.helpers({
  sessionPopulated() {
    return Session.get("editCollaborationsCollection") &&
        Session.get("editCollaborationsMongoId");
  },
  isPersonalCollaboration() { return this.indexOf("@") !== -1; },
  getObject() {
    let collectionName = Session.get("editCollaborationsCollection");
    let mongoId = Session.get("editCollaborationsMongoId");

    let collection = MedBook.collections[collectionName];
    if (collection) {
      return collection.findOne(mongoId);
    }
  },
  onlyCollaborations() {
    return new SimpleSchema({ collaborations: { type: [String] } });
  },
  collaborationOptions() {
    return _.map(Template.instance().collabs.get(), (collabName) => {
      return { label: collabName, value: collabName };
    });
  },
  waitingForServer() { return Template.instance().waitingForServer.get(); },
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

// Template.contactUsButton

Template.contactUsButton.helpers({
  emailSubject() {
    return `MedBook%20Patient%20Care:%20${FlowRouter.current().path}`;
  },
});

// Template.listSamplesButton

Template.listSamplesButton.onCreated(function () {
  let instance = this;

  let showAllDefault = instance.data.length <= 5;
  instance.showAllSamples = new ReactiveVar(showAllDefault);

  instance.hideStudyLabels = new ReactiveVar(false);
});

Template.listSamplesButton.helpers({
  showAllSamples() { return Template.instance().showAllSamples.get(); },
  hideStudyLabels() { return Template.instance().hideStudyLabels.get(); },
  sampleToShow() {
    let instance = Template.instance();

    let sampleLabels = instance.data;

    // remove study labels if necessary
    if (instance.hideStudyLabels.get()) {
      sampleLabels = MedBook.utility.unqualifySampleLabels(sampleLabels);
    }

    // return either the whole list or the first couple items
    if (instance.showAllSamples.get()) {
      return sampleLabels;
    } else {
      return sampleLabels
        .slice(0, 3)
        .concat([`... and ${sampleLabels.length - 3} more samples`]);
    }
  },
  dropdownOptions() {
    return {
      action: "nothing"
    };
  },
});

Template.listSamplesButton.events({
  "click .show-list"(event, instance) {
    instance.showAllSamples.set(!instance.showAllSamples.get());
  },
  "click .toggle-study-labels"(event, instance) {
    instance.hideStudyLabels.set(!instance.hideStudyLabels.get());
  },
});

// Template.semanticUIDropdown

Template.semanticUIDropdown.onRendered(function () {
  this.$(".ui.dropdown").dropdown(this.data.options);
});

// Template.viewJobButton

Template.viewJobButton.helpers({
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  buttonClass() {
    if (this.job.status === "done") { return "primary"; }
    else if (this.job.status === "error") { return "negative"; }
    // else { return "" }
  },
});

// Template.jobStatusWrapper

Template.jobStatusWrapper.onCreated(function () {
  let instance = this;

  // subscribe and keep up to date
  instance.autorun(function () {
    instance.subscribe("specificJob", Template.currentData());
  });
});

Template.jobStatusWrapper.helpers({
  getJob: function () {
    return Jobs.findOne(this.toString());
  },
});
