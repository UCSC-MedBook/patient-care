Samples = new Meteor.Collection("samples_in_cohort");

///////////////
// SimpleSchema
///////////////

Samples.attachSchema(new SimpleSchema({
  "name": { type: String }, // Sample_ID
  "site_of_metastasis" : { type: String, optional: true },
  "procedure_day": { type: Number, optional: true },
  "pathways": {
    type: [simplifiedPathwaySchema],
    optional: true
  },
  "signatures": {
    type: [simplifiedSignatureSchema],
    optional: true
  }
}));
