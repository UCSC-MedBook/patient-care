Router.configure({
  // we use the  appBody template to define the layout for the entire app
  layoutTemplate: 'appBody',

  // the appNotFound template is used for unknown routes and missing lists
  notFoundTemplate: 'appNotFound',

  // show the appLoading template whilst the subscriptions below load their data
  loadingTemplate: 'appLoading',
});

Router.map(function() {
  //this.route('signin');

  // root ==> list of patients, list of studies

  this.route('patientReport', {
    path: '/patientReport/:patientLabel',
    subscriptions: function () {
      return Meteor.subscribe("PatientReports", this.params.patientLabel);
    },
    data: function () {
      var currentLabel = this.params.patientLabel
      var currentPatient = PatientReports.findOne({
        "patient_label": currentLabel
      });
      // check if we have a report yet for that patient
      return currentPatient;
    },
  });

  // not really used
  this.route('redirecting', { // this is literally just a redirect
    path: '/patientReportById/:patientId',
    onBeforeAction: function () {
      Meteor.call("patientReportGo", patientId);
      this.next();
    }
  });

});
