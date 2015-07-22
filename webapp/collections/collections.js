// // validate data in 'patient_reports' collection
// // taken out because we need to add data
// if (Meteor.isClient) {
//   Meteor.subscribe("patient_reports", function () {
//     console.log("subscribed, done recieving data");
//     var patientValidation = PatientReports._c2._simpleSchema.newContext();
//
//     var currentPatient = PatientReports.findOne({"patient_label": "DTB-011"});
//     console.log("validating :: ");
//     console.log(currentPatient);
//     patientValidation.validate(currentPatient);
//     if (patientValidation._invalidKeys.length > 0) {
//       console.log("problem with " + currentPatient.patient_label);
//       console.log(patientValidation._invalidKeys);
//     } else {
//       console.log(currentPatient.patient_label + " is all right");
//     }
//
//     console.log("done validating patients data");
//   });
// }
