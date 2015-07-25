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
    path: '/PatientCare/patientReport/:patient_label',
    subscriptions: function () {
      return Meteor.subscribe("PatientReport", this.params.patient_label, function () {
        console.log("loaded PatientReport subscription");
      });
    },
    data: function () {
      var currentLabel = this.params.patient_label
      var currentPatient = PatientReports.findOne({
        "patient_label": currentLabel
      });
      // check if we have a report yet for that patient
      return currentPatient;
    },
  });

  this.route('listReports', {
    path: '/PatientCare/',
  });

});
