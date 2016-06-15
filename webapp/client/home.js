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



// Template.listPatients

Template.listPatients.onCreated(function() {
  let instance = this;

  instance.subscribe("patients", ""); // subscribe immidiately

  function resubscribe(searchString) {
    // currently we load all the patients :)
    // instance.subscribe("patients", searchString);
  }
  let debouncedResubscribe = _.debounce(resubscribe);

  instance.searchString = new ReactiveVar("");
  instance.autorun((computation) => {
    let searchString = instance.searchString.get();

    // subscribe immidiately the first time and then debounced resubscribes
    if (computation.firstRun) {
      resubscribe(searchString);
    } else {
      debouncedResubscribe(searchString);
    }
  });
});

Template.listPatients.helpers({
  getPatients() {
    let searchString = Template.instance().searchString.get();

    return Patients.find({
      patient_label: { $regex: new RegExp(searchString) }
    }, { sort: { patient_label: 1 } });
  },
});

Template.listPatients.events({
  "keyup .search-patients"(event, instance) {
    instance.searchString.set(event.target.value);
  },
});
