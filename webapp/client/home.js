// Template.listDataSets

Template.listDataSets.onCreated(function () {
  let instance = this;

  instance.autorun(function () {
    Meteor.userId(); // make reactive
    instance.subscribe("dataSets");
  });
});

Template.listDataSets.helpers({
  getDataSets: function () {
    return DataSets.find({});
  },
});



// Template.homeWelcome

Template.homeWelcome.helpers({
  shouldWelcome: function () {
    const user = Meteor.user();

    if (!user ||
        !user.profile ||
        !user.profile.patient_care ||
        !user.profile.patient_care.dismissedHomeWelcome) {
      return true;
    }
  },
});

Template.homeWelcome.events({
  "click .never-show-again": function (event, instance) {
    Meteor.users.update(Meteor.userId(), {
      $set: {
        "profile.patient_care.dismissedHomeWelcome": true
      }
    });
  }
});
