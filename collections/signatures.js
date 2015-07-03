
Signatures = new Meteor.Collection("signatures");

///////////////
// SimpleSchema
///////////////

contrastSchema = new SimpleSchema({
  name: { type: String },
  group1: { type: String },
  group2: { type: String },
  list1: { type: [String] }, // I don't think this is the right field type
  list1: { type: [String] }
  // had collaborations field
});

geneInSignatureSchema = new SimpleSchema({
  geneId: { type: String },
  name: { type: String },
  weight: { type: String }, // not optional
  pval: { type: String, optional: true }
});

// these are not shared between studies, right?
Signatures.attachSchema(new SimpleSchema({
  name: { type: String },
  contrast: { type: contrastSchema },
  study: { type: simplifiedStudySchema },
  // should we represent that as an array?
  signature: { type: [geneInSignatureSchema] },
  // do we need the version field?
  // what do we need for a waterfall plot
}));
