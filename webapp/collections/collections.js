PatientReports = new Meteor.Collection("patient_reports");
PatientReports.attachSchema(Schemas.patientReports);

SignatureReports = new Meteor.Collection("signature_reports");
SignatureReports.attachSchema(Schemas.signatureReports);

SignatureAlgorithmReports = new Meteor.Collection("signature_algorithm_reports");
SignatureAlgorithmReports.attachSchema(Schemas.signatureAlgorithmReports);

PathwayReports = new Meteor.Collection("pathway_reports");
PathwayReports.attachSchema(Schemas.pathwayReports);

GeneReports = new Meteor.Collection("gene_reports");
GeneReports.attachSchema(Schemas.geneReports);

// Patients = new Meteor.Collection("patients");
// Patients.attachSchema(Schemas.patients);

// Samples = new Meteor.Collection("samples");
// Samples.attachSchema(Schemas.samples);

// validate data in 'patient_reports' collection
if (Meteor.isClient) {
  Meteor.subscribe("patient_reports", function () {
    console.log("subscribed");
    var patientValidation = Schemas.patientReports.newContext();
    // only do one patient to start out with
    var patients = PatientReports.find().fetch();
    for (var i = 0; i < patients.length; i++) {
      var currentPatient = patients[i];
      patientValidation.validate(currentPatient);
      if (patientValidation._invalidKeys.length > 0) {
        console.log("problem with " + currentPatient.patient_label);
        console.log(patientValidation._invalidKeys);
      }
    }
    console.log("done validating patients data");
  });
}
