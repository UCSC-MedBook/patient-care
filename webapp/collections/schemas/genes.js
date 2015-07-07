outlierSampleSchema = new SimpleSchema({
  "sample_id": { type: String },
  "sample_label": { type: String },
  "value": { type: Number },
});

schemas.genesInCohortSchema = new SimpleSchema({
  "created_at": { type: Date },
  "viewed": { type: Boolean },
  "study_label": { type: String },
  "study_id": { type: String },
  "gene_label": { type: String },
  "status": { type: String }, // ex. Approved / Symbol Withdrawn
  "description": { type: String, optional: true },
  "previous": { type: [String], optional: true }, // need to send to client?
  "synonym": { type: [String], optional: true }, // need to send to client?
  "genome_browser_url": { type: String, optional: true },
  "gene_cards_url": { type: String, optional: true },
  "interaction_url": { type: String, optional: true },
  "mutations": {
    "label": "Common mutations",
    "type": [mutationSchema],
    "optional": true
  },
  "high_low_activity_samples": { type: [outlierSampleSchema], optional: true }

  // Lollipop (cbio or xena)
  // Gene-omics view (see next slide)
  // Circle map with first neighbors (next slide) ==> are we doing the superpathway?
  // slide 2 of 2 of the keynote
});
