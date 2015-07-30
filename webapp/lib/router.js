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
      // TODO: check if we have a report yet for that patient
      return currentPatient;
    },
    onStop: function () {
      console.log("onStop (router.js)");
    },
  });

  this.route('listReports', {
    path: '/PatientCare/',
  });

  this.route('geneReport', {
    path: '/PatientCare/geneReport/:gene_label',
    subscriptions: function () {
      Session.set("geneReportLoaded", false);
      return Meteor.subscribe("GeneReport", this.params.gene_label, function () {
        Session.set("geneReportLoaded", true);
        console.log("loaded GeneReport subscription");
      });
    },
    data: function () {
      var currentLabel = this.params.gene_label
      var currentGene = GeneReports.findOne({
        "gene_label": currentLabel
      });
      // TODO: check if we have a report yet for that gene
      return currentGene;
    },
    onStop: function () {
      console.log("onStop (router.js)");
    },
  });

});
