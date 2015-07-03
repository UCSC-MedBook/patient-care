
Genes = new Meteor.Collection("genes");

///////////////
// SimpleSchema
///////////////



Genes.attachSchema(new SimpleSchema({
  name: { type: String },
  description: { type: String },
  // links to genome browser, genecards
  // Interactions (max or interaction browser)
  // Lollipop (cbio or xena)
  // Gene-omics view (see next slide)
  // Circle map with first neighbors (next slide)
  // slide 2 of 2 of the keynote
}));
