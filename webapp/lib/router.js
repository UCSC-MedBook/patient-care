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
    path: '/patientReport/:patientLabel',
    subscriptions: function () {
      return Meteor.subscribe("patient_reports", this.params.patientLabel);
    },
    data: function () {
      var currentLabel = this.params.patientLabel
      var currentPatient = PatientReports.findOne({
        "patient_label": currentLabel
      });
      return currentPatient;
    },
  });

  this.route('sampleReport', {
    path: '/sampleReport/:currentSampleLabel',
    onBeforeAction: function () {

      Router.go("/patient");
    }
  });

});
