Pathways = new Meteor.Collection("pathways_in_cohort");

///////////////
// SimpleSchema
///////////////

Pathways.attachSchema(new SimpleSchema({
  "name": { type: String },

}));
