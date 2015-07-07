Patients = new Meteor.Collection("patients");
Patients.attachSchema(Schemas.patients);

Signatures = new Meteor.Collection("signatures_in_cohort");
Signatures.attachSchema(Schemas.signatureInCohort);

Pathways = new Meteor.Collection("pathways_in_cohort");
Pathways.attachSchema(Schemas.pathwaysInCohort);

Genes = new Meteor.Collection("genes_in_cohort");
Genes.attachSchema(Schemas.genesInCohort);

console.log(Schemas);
