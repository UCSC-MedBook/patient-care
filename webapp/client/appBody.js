// Template.appBody

Template.appBody.onCreated(function () {
  let instance = this;

  instance.autorun(function () {
    let params = instance.data.params();

    if (params.patient_id) {
      instance.subscribe("patientLabel", params.patient_id);
    }
  });
});

Template.appBody.helpers({
  getPatientLabel: function () {
    let patient = Patients.findOne(this.params().patient_id);
    if (patient) return patient.patient_label;
    return "loading";
  },
  invalidUrl() {
    return FlowRouter.getRouteName() === undefined;
  },
  activeRouteIsInTools() {
    return [
      "listTools",
      "listLimmaGSEA",
      "listTumorMap",
      "listUpDownGenes",
      "upDownGenesJob",
    ].indexOf(FlowRouter.getRouteName()) !== -1;
  },
});



// Template.showErrorMessage

Template.showErrorMessage.helpers({
  getError: function () {
    return Template.instance().data.get();
  },
});

Template.showErrorMessage.events({
  "click .close-error-message": function (event, instance) {
    instance.data.set(null);
  },
});
