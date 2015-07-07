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
  this.route('showPatient', {
    path: '/patient/:currentPatientLabel',
    subscriptions: function () {
      Meteor.subscribe("patient_reports", this.params.currentPatientLabel);
    },
    data: function () {
      var currentPatient = PatientReports.findOne({
        "patient_label": this.params.currentPatientLabel
      });
      console.log("currentPatient (router.js)");
      console.log(currentPatient);
      return currentPatient;
    }
  });

  this.route('visualizeSchema', {
    path: '/visualizeSchema'
  });

});
