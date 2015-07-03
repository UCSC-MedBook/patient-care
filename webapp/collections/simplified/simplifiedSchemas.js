// These schemas contain enough information to display a link
// to a page containing more information

// join to "studies"
simplifiedStudySchema = new SimpleSchema({
  // should I define this as a schema?
  "name": { type: String },
  "Study_ID": { type: String }
});

// join to "samples"
simplifiedSampleSchema = new SimpleSchema({
  // need to rewrite this
});

// join to "signatures"
simplifiedSignatureSchema = new SimpleSchema({
  "name": { type: String },
  "Signature_ID": { type: String }
});

// join to "genes"
simplifiedGeneSchema = new SimpleSchema({
  "name": { type: String },
  "Gene_ID": { type: String }
});

memberEventSchema = new SimpleSchema({
  "name": { type: simplifiedGeneSchema },
  "events": { type: [String] } // to be defined further later (allowed fields)
});

simplifiedPathwaySchema = new SimpleSchema({
  "name": { type: String },
  "Pathway_ID": { type: String },
  "members": { type: [memberEventSchema] }
});
