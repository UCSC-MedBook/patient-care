// so that we can resubscribe anywhere in this file
// (set in manageCollaborations.onCreated)
var collaborationsResubscribe = undefined;

// define this here so it only gets run once and is also close to the other
// stuff using collaborationsResubscribe
AutoForm.addHooks("insertCollaboration", {
  onSuccess(submitType, collaboration_id) {
    // resubscribe and then go to that collaboration
    collaborationsResubscribe();
    FlowRouter.go("manageCollaborations", {}, { collaboration_id });
  },
  formToDoc(doc) {
    // set undefined booleans to false because we set { optional: true } on
    // the client but not for the actual schema
    if (doc.publiclyListed === undefined) {
      doc.publiclyListed = false;
    }
    if (doc.adminApprovalRequired === undefined) {
      doc.adminApprovalRequired = false;
    }
    return doc;
  },
});




// add a client-side custom validation for collaboration names
SimpleSchema.messages({
  collabNameTaken: "That collaboration name is taken.",
});
// NOTE: result of the function, not a function itself!
var collaborationSchema = function() {
  let collabSchemaObject = Collaborations.simpleSchema().schema();

  let name = collabSchemaObject.name;
  let oldCustom = name.custom;
  name.custom = function () {
    // first call the normal custom validation function
    let oldCustomResult = oldCustom.call(this);
    if (oldCustomResult) {
      return oldCustomResult;
    }

    // async custom validation on the client (see SimpleSchema docs)
    Meteor.call("collabNameTaken", this.value, (error, result) => {
      if (error) throw error;

      if (result) {
        collaborationSchema
            .namedContext("insertCollaboration") // id of form
            .addInvalidKeys([{
              name: "name",
              type: "collabNameTaken"
            }]);
      }
    });
  };

  // get rid of those red star things which show required for booleans
  collabSchemaObject.publiclyListed.optional = true;
  collabSchemaObject.adminApprovalRequired.optional = true;

  return new SimpleSchema(collabSchemaObject)
}();



// Template.manageCollaborations

Template.manageCollaborations.onCreated(function () {
  let instance = this;

  collaborationsResubscribe = () => {
    instance.subscribe("adminAndCollaboratorCollaborations");
  };
  collaborationsResubscribe();
});

Template.manageCollaborations.helpers({
  getCollaborations() {
    let userCollabs = MedBook.findUser(Meteor.userId()).getCollaborations();

    return Collaborations.find({
      $or: [
        { name: { $in: userCollabs } },
        { administrators: { $in: userCollabs } },
      ],
    }, { sort: { name: 1 } });
  },
  getCollaboration() {
    return Collaborations.findOne(FlowRouter.getQueryParam("collaboration_id"));
  },
  collaborationPlaceholder() {
    return "Describe your collaboration... " +
        "Who is going to be in this collaboration? " +
        "What are you trying to accomplish?";
  },
});



// Template.createCollaboration

Template.createCollaboration.helpers({
  collaborationSchema,
  onlyPersonal() {
    return [ MedBook.findUser(Meteor.userId()).personalCollaboration() ];
  },
});


// Template.showCollaboration

Template.showCollaboration.onCreated(function() {
  let instance = this;

  instance.removeClicked = new ReactiveVar(false);
  instance.editing = new ReactiveVar(false);

  // if an update call is out but hasn't gotten back yet
  instance.waitingForServer = new ReactiveVar(false);

  // cancel editing when selecting another collaboration from the list
  instance.autorun(() => {
    let queryParam = FlowRouter.getQueryParam("collaboration_id");
    instance.editing.set(false);
  });
});

Template.showCollaboration.helpers({
  collaborationSchema,
  isAdmin() { return MedBook.findUser(Meteor.userId()).isAdmin(this); },
  editing() { return Template.instance().editing.get(); },
  waitingForServer() { return Template.instance().waitingForServer.get(); },
});

Template.showCollaboration.events({
  "click .edit-collaboration": function(event, instance) {
    instance.editing.set(true);
  },
  "click .cancel-editing-collaboration"(event, instance) {
    instance.editing.set(false);
  },
  "click .done-editing-collaboration": function(event, instance) {
    var valid = AutoForm.validateForm("editCollaboration");
    if (valid) {
      let values = AutoForm.getFormValues("editCollaboration").insertDoc;

      // make sure they changed something
      let collab = Collaborations.findOne(this._id);
      if (_.isEqual(_.pick(collab, _.keys(values)), values)) {
        instance.editing.set(false);
        return;
      }

      // make sure they're not removing all admins
      if (values.administrators && values.administrators.length === 0) {
        window.alert("You cannot remove all administrators." +
            "To delete a collaboration, use the delete button.");
      }

      // make sure they want to remove themselves if applicable
      let user = MedBook.findUser(Meteor.userId());
      collab.administrators = values.administrators;
      if (!user.isAdmin(collab)) {
        let stillContinue = window.confirm("You are about to remove " +
            "yourself as an administrator of this collaboration. Are you " +
            "sure you want to do this?");
        if (!stillContinue) return;
      }

      instance.waitingForServer.set(true);
      Meteor.call("updateCollaboration", this._id, values, (error, result) => {
        if (error) throw error;

        instance.editing.set(false);
        instance.waitingForServer.set(false);
      });
    }
  },
  "click .remove-collaboration": function(event, instance) {
    var removeClicked = instance.removeClicked;

    if (removeClicked.get()) {
      let user = MedBook.findUser(Meteor.userId());
      let collab = Collaborations.findOne(instance.data._id);

      // delete if admin, otherwise leave collaboration
      if (user.isAdmin(collab)) {
        var stillRemove = window.confirm("You are about to delete this " +
            "collaboration for all users. You will never be able to " +
            "create a collaboration with this name again. " +
            "This action cannot be undone.");
        if (!stillRemove) {
          removeClicked.set(false);
          return; // quit
        }

        Meteor.call("removeCollaboration", instance.data._id, (error) => {
          if (error) throw error;

          collaborationsResubscribe();
          FlowRouter.go("manageCollaborations");

          // the delete button popup doesn't want to go away, so let's
          // remove if forcibly
          $(".ui.popup").remove();
        });
      } else {
        Meteor.call("leaveCollaboration", instance.data._id, (error) => {
          if (error) throw error;

          collaborationsResubscribe();
          FlowRouter.go("manageCollaborations");
        });
      }
    } else {
      removeClicked.set(true);

      // if they click elsewhere, cancel remove
      // wait until propogation finishes before registering event handler
      Meteor.defer(() => {
        $("html").one("click", () => {
          removeClicked.set(false);
        });
      });
    }
  },
  "click .approve-collaborator"(event, instance) {
    Meteor.call("approveOrDenyCollaborator", instance.data._id,
        this.personalCollaboration, true);
  },
  "click .deny-collaborator"(event, instance) {
    Meteor.call("approveOrDenyCollaborator", instance.data._id,
        this.personalCollaboration, false);
  },
});



// Template.browseCollaborations

Template.browseCollaborations.onCreated(function() {
  let instance = this;

  instance.subscribe("browseCollaborations");
});

Template.browseCollaborations.helpers({
  getBrowsingCollaborations() {
    let userCollabs = MedBook.findUser(Meteor.userId()).getCollaborations();

    return Collaborations.find({
      $nor: [
        { name: { $in: userCollabs } },
        { administrators: { $in: userCollabs } },
      ],
    }, { sort: { name: 1 } });
  },
  alreadyAppliedToJoin() {
    let personalCollaboration =
        MedBook.findUser(Meteor.userId()).personalCollaboration();
    let requests = Collaborations.findOne(this._id).requestsToJoin;

    return _.where(requests, { personalCollaboration });
  },
  alreadySetName() {
    let profile = Meteor.user().profile;
    return profile && profile.firstName && profile.lastName;
  },
  firstLastName() {
    return new SimpleSchema({
      firstName: { type: String },
      lastName: { type: String },
    });
  },
});

Template.browseCollaborations.events({
  "click .join-collaboration": function(event, instance) {
    Meteor.call("joinCollaboration", this._id, (error, collaboration_id) => {
      if (error) throw error;

      if (collaboration_id) {
        collaborationsResubscribe();
        FlowRouter.go("manageCollaborations", {}, { collaboration_id });
      }
    });
  },
});



// Template.alwaysShowCollaborationFields

Template.alwaysShowCollaborationFields.helpers({
  collaborationPlaceholder() {
    return "Describe your collaboration... " +
        "Who is going to be in this collaboration? " +
        "What are you trying to accomplish?";
  },
});



// Template.listCollaborators

Template.listCollaborators.helpers({
  isPersonalCollaboration() {
    return this.indexOf("@") !== -1;
  },
});



// Template.adminAndCollaboratorFields

Template.adminAndCollaboratorFields.onCreated(function() {
  let instance = this;

  // who the user can share with
  instance.collabs = new ReactiveVar(null);
  Meteor.call("getSharableCollaborations", (error, result) => {
    instance.collabs.set(result);
  });
});

Template.adminAndCollaboratorFields.helpers({
  collabsLoaded() { return Template.instance().collabs.get(); },
  collaborationOptions() {
    return _.map(Template.instance().collabs.get(), (collabName) => {
      return { label: collabName, value: collabName };
    });
  },
});



// Template.deleteCollabButton

Template.deleteCollabButton.onRendered(function() {
  let instance = this;

  instance.$(".show-popup").popup({
    position: "bottom right",
  });
});

Template.deleteCollabButton.helpers({
  deletePopupText() {
    return "Remove yourself as an administrator to leave this collaboration";
  }
});
