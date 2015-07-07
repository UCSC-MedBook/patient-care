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
    path: '/patient/:currentPatientId',
    data: function () {
      var currentPatient = Patients.findOne({
        Patient_ID: this.params.currentPatientId
      });
      return {
        currentPatient: currentPatient,
        patientId: this.params.currentPatientId
      };
    }
  });

});
