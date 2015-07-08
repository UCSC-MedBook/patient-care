Router.configure({
  // we use the  appBody template to define the layout for the entire app
  layoutTemplate: 'appBody',

  // the appNotFound template is used for unknown routes and missing lists
  notFoundTemplate: 'appNotFound',

  // show the appLoading template whilst the subscriptions below load their data
  loadingTemplate: 'appLoading',
});

Router.map(function() {
  this.route('signin');

  // showPatient (/sample/:currentSampleLabel) ==> same thing
  this.route('patientReport', {
    path: '/patientReport/:currentPatientLabel',
    subscriptions: function () {
      Meteor.subscribe("patient_reports", this.params.currentPatientLabel);
    },
    data: function () {
      var currentLabel = this.params.currentPatientLabel
      var currentPatient = PatientReports.findOne({
        "patient_label": currentLabel
      });
      var upper = currentLabel.toUpperCase();
      if (!currentPatient && upper !== currentLabel) {
        // we should have an error here just in case
        Router.go("/patient/" + upper);
      }
      console.log("currentPatient (router.js)");
      console.log(currentPatient);
      return currentPatient;
    }
  });

  this.route('sampleReport', {
    path: '/sampleReport/:currentSampleLabel',
    onBeforeAction: function () {
      // look up sample,
      Router.go("/patient");
    }
  });

  this.route('visualizeSchema', {
    path: '/visualizeSchema'
  });

});
