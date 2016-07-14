// Template.createStudy

AutoForm.addHooks("insertStudy", {
  onSuccess(submitType, selected) {
    FlowRouter.setParams({ selected });
  },
});

Template.createStudy.helpers({
  nameAndDescription() {
    return Studies.simpleSchema().pick(["name", "description"]);
  },
});

// Template.showStudy

Template.showStudy.helpers({
  newSampleSchema() {
    return new SimpleSchema({
      study_label: { type: String },
      uq_sample_label: { type: String, label: "Sample name" },
    });
  },
  newSamplePlaceholder() {
    return `Name of sample (excluding "${this.study_label}/")`;
  },
});
