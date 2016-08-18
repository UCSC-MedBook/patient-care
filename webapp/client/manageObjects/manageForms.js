// Template.viewFormRecords

Template.viewFormRecords.onCreated(function () {
  let instance = this;

  let formId = FlowRouter.getParam("form_id");
  instance.subscribe("objectFromCollection", "Forms", formId);
});

Template.viewFormRecords.helpers({
  getForm() {
    return Forms.findOne(FlowRouter.getParam("form_id"));
  },
});
