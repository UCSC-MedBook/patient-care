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
