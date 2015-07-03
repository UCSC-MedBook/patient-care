/*
// add this back in when we have the sign-in package
Router.onBeforeAction(function () {
  // all properties available in the route function
  // are also available here such as this.params

  if(!Meteor.user()){
    this.render('signin');
  }else{
    this.next();
  }

});
*/

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
