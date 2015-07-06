

schemas.genesInCohortSchema = new SimpleSchema({
  "study_label": { type: String },
  "study_gid": { type: String },
  "gene_label": { type: String },
  "status": { type: String },
  "description": { type: String, optional: true },
  "previous": { type: [String], optional: true },
  "synonym": { type: [String], optional: true },
  "genome_browser_url": { type: String, optional: true },
  "gene_cards_url": { type: String, optional: true },
  "interaction_url": { type: String, optional: true },
  "mutations": {
    label: "Common mutations",
    type: [mutationSchema],
    optional: true
  }

  // Lollipop (cbio or xena)
  // Gene-omics view (see next slide)
  // Circle map with first neighbors (next slide)
  // slide 2 of 2 of the keynote
});
