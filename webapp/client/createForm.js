AutoForm.addHooks("insertForm", {
  onSuccess: function () {
    // clear (almost) all dropdowns
    $("#insertForm .reset-dropdown .ui.dropdown").dropdown("clear")
  },
});

// Template.createForm

Template.createForm.onCreated(function () {
  let instance = this;

  // get the collaborations this user can share with
  instance.sharableCollabs = new ReactiveVar([
    Meteor.user().collaborations.personal
  ]);
  Meteor.call("getSharableCollaborations", (error, result) => {
    if (error) {
      throw error;
    } else {
      instance.sharableCollabs.set(result);
    }
  });
});

Template.createForm.helpers({
  formSchema() {
    return Forms.simpleSchema();
  },
  collaborationOptions() {
    return _.map(Template.instance().sharableCollabs.get(), (name) => {
      return { value: name, label: name };
    });
  },
  onlyPersonal() {
    return [MedBook.findUser(Meteor.userId()).personalCollaboration()];
  },
});



Template.afObjectField_patientCare.helpers({
  makeName(restOfName) {
    return this.name + "." + restOfName;
  }
});
