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
    path: '/patientReport/:patientWanted',
    subscriptions: function () {
      console.log("subscriptions method");
      Meteor.subscribe("patient_reports", this.params.patientWanted);
    },
    onBeforeAction: function () {
      console.log("onBeforeAction function");
      this.next();
    },
    before: function () {
      console.log("before function");
      this.next();
    },
    data: function () {
      var currentLabel = this.params.patientWanted
      var currentPatient = PatientReports.findOne({
        "patient_label": currentLabel
      });

      console.log("current patient (router.js):");
      console.log(currentPatient);
      return currentPatient;
    }
  });

  this.route('sampleReport', {
    path: '/sampleReport/:currentSampleLabel',
    onBeforeAction: function () {

      Router.go("/patient");
    }
  });

});
