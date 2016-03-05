// Template.study

Template.study.onCreated(function () {
  const instance = this;

  instance.autorun(function () {
    Meteor.userId();
    instance.subscribe("study", instance.data.study_label);
  });
});

Template.study.helpers({
  getStudy: function () {
    return Studies.findOne({study_label: Template.currentData().study_label});
  },
  getStudyLabel: function () {
    return Template.currentData().study_label;
  },
});
