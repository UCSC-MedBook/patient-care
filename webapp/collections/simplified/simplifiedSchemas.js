// These schemas contain enough information to display a link
// to a page containing more information

// join to "studies"
simplifiedStudySchema = new SimpleSchema({
  // should I define this as a schema?
  "name": { type: String },
  "studyId": { type: String }
});

// join to "samples"
simplifiedSampleSchema = new SimpleSchema({
  "name": { type: String },
  "sampleId": { type: String } // refers to _id
});

// join to "signatures"
simplifiedSignatureSchema = new SimpleSchema({
  "name": { type: String },
  "signatureId": { type: String }
});

// join to "genes"
simplifiedGeneSchema = new SimpleSchema({
  "name": { type: String },
  "geneId": { type: String }
});

// join to "pathways"
simplifiedPathwaySchema = new SimpleSchema({
  "name": { type: String },
  "pathwayId": { type: String }
});
