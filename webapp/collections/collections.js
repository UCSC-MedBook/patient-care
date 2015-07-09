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

//var patientValidation = Schemas.patientReports.newContext();
//console.log("patientValidation:");
//console.log(patientValidation);
//var thatPatient = PatientReports.find({"patient_label": "DTB-011"}).fetch();
//console.log("that patient:");
// console.log(thatPatient);
// //patientValidation.validate(thatPatient);
// console.log("validated DTB-011");
// console.log(patientValidation);

// validate data in 'patient_reports' collection
if (Meteor.isClient) {
  Meteor.subscribe("patient_reports", function () {
    console.log("subscribed");
    var patientValidation = Schemas.patientReports.newContext();
    // only do one patient to start out with
    var thatPatient = PatientReports.find({"patient_label": "DTB-011"}).fetch()[0];
    patientValidation.validate(thatPatient);
    console.log("to be printed: patient validated then validation context"
                + " (look in _invalidKeys)");
    console.log(thatPatient);
    console.log(patientValidation);
  });

}
