Patients = new Meteor.Collection("patients");
Patients.attachSchema(schemas.patientsSchema);

Signatures = new Meteor.Collection("signatures_in_cohort");
Signatures.attachSchema(schemas.signatureInCohortSchema);

Pathways = new Meteor.Collection("pathways_in_cohort");
Pathways.attachSchema(schemas.pathwaysInCohortSchema);

Genes = new Meteor.Collection("genes_in_cohort");
Genes.attachSchema(schemas.genesInCohortSchema);
