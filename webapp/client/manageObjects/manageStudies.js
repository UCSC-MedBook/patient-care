// Template.createStudy

AutoForm.addHooks("insertStudy", {
  onSuccess(submitType, selected) {
    FlowRouter.setParams({ selected });
  },
});

Template.createStudy.helpers({
  newStudySchema() {
    var schema = Studies.simpleSchema().pick([
      "name",
      "description",
      "study_label",
    ]).schema();

    let instance = Template.instance();

    schema.study_label.custom = function () {
      Meteor.call("studyLabelTaken", this.value, function (error, result) {
        if (result) {
          schema.namedContext("insertStudy").addInvalidKeys([
            {name: "study_label", type: "studyLabelNotUnique"}
          ]);
        }
      });
    };

    // make it a SimpleSchema
    schema = new SimpleSchema(schema);

    // change the regex message to something informative
    schema.messages({
      regEx: "Study labels can only contain letters, numbers, dashes, " +
          "and underscores",
    });

    return schema;
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
