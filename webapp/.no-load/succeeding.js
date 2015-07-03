pathologyCallSchema = new SimpleSchema({
  "date": { type: Date },
  "patient_id": { type: String }
});


biopsySchema = new SimpleSchema({
  "date": { type: Date }
});

pathwayEventSchema = new SimpleSchema({
  "pathway_id": { type: String },
  "name": { type: String },
  "baseline_p": {
    type: Boolean,
    label: "is baseline"
  },
  // field about Kinase/Target/TF/paradigm

});



Schemas.Patient = new SimpleSchema({
  "living": { type: Boolean },
  "last_contact_date": { type: Date } ,

  "primary_castration_resistance": { type: Boolean },
  "pathology_calls": { type: [Object] },
  "pathology_calls.$": { type: [pathologyCallSchema] },

  "biopsies": { type: [biopsySchema] },
  "pathway_events": { type: [pathwayEventSchema] },

});


interactionSchema = new SimpleSchema({
  otherElementId: { type: String },
  otherElementName: { type: String },
  relation: { type: String } // -a>, component>, -a|, etc.
});

// used on gene page
Schemas.Gene = new SimpleSchema({
  // TEO: Abigail: can we have a field called type?
  name: { type: String },
  interactions: { type: [interactionSchema] }
});
