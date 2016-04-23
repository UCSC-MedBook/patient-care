// Template.home

Template.home.onCreated(function () {
  let instance = this;

  instance.autorun(function () {
    Meteor.userId();
    instance.subscribe("studies");
  });
});

Template.home.helpers({
  getStudies: function () {
    return Studies.find({});
  },
});



// Template.homeWelcome

Template.homeWelcome.helpers({
  shouldWelcome: function () {
    const user = Meteor.user();

    if (!user ||
        !user.profile ||
        !user.profile.PatientCare ||
        !user.profile.PatientCare.dismissedHomeWelcome) {
      return true;
    }
  },
});

Template.homeWelcome.events({
  "click .never-show-again": function (event, instance) {
    Meteor.users.update(Meteor.userId(), {
      $set: {
        "profile.PatientCare.dismissedHomeWelcome": true
      }
    });
  }
});
