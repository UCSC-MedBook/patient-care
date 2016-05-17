AutoForm.addHooks("insertRecord", {
  onSuccess: function () {
    // clear (almost) all dropdowns
    $("#insertRecord .reset-dropdown .ui.dropdown").dropdown("clear")
  },
  onError: function (first, second) {
    console.log("first, second:", first, second);
  },
});

// Template.createRecord

Template.createRecord.onCreated(function () {
  let instance = this;

  instance.subscribe("forms");
  instance.subscribe("dataSets");

  // get the collaborations this user can share with
  instance.sharableCollabs = new ReactiveVar([
    Meteor.user().collaborations.personal
  ]);
  Meteor.call("getSharableCollaborations", (error, result) => {
    if (error) {
      throw error;
    } else {
      instance.sharableCollabs.set(result);
    }
  });

  // need one level of indirection to stop the recordSchema from rerunning
  // forever
  instance.form_id = new ReactiveVar();
  instance.data_set_id = new ReactiveVar();
  instance.autorun(() => {
    instance.form_id.set(AutoForm.getFieldValue("form_id", "insertRecord"));
  });
  instance.autorun(() => {
    let _id = AutoForm.getFieldValue("data_set_id", "insertRecord");
    instance.data_set_id.set(_id);
  });
});

var commonRecordFields = Records.simpleSchema().pick([
  "form_id",
  "data_set_id",
  "patient_label",
  "sample_label",
  "collaborations",
  "collaborations.$",
]).schema();

Template.createRecord.helpers({
  recordSchema() {
    let instance = Template.instance();

    let formId = instance.form_id.get();
    let dataSetId = instance.data_set_id.get();

    let form = Forms.findOne(formId);
    let dataSet = DataSets.findOne(dataSetId);

    if (form && dataSet) {
      // modify the patient_label/sample_label schema a bit to use the default
      // AutoForm UI insead of having to code it myself
      commonRecordFields.patient_label.allowedValues =
          _.pluck(dataSet.patients, "patient_label");
      commonRecordFields.sample_label.allowedValues = dataSet.sample_labels;

      // require patient or sample label
      if (form.specificity === "patient") {
        commonRecordFields.patient_label.optional = false;
      } else {
        commonRecordFields.sample_label.optional = false;
      }

      let schemaFromForm = MedBook.schemaObjectFromForm(form);

      // add the schemas together
      return new SimpleSchema([
        schemaFromForm,
        commonRecordFields,
      ]);
    }

    return new SimpleSchema(commonRecordFields);
  },
  getForm() {
    return Forms.findOne(Template.instance().form_id.get());
  },
  getDataSet() {
    return DataSets.findOne(Template.instance().data_set_id.get());
  },
  onlyPersonal() {
    return [MedBook.findUser(Meteor.userId()).personalCollaboration()];
  },

  collaborationOptions() {
    return _.map(Template.instance().sharableCollabs.get(), (name) => {
      return { value: name, label: name };
    });
  },
  formOptions() {
    return Forms.find().map((form) => {
      return { value: form._id, label: form.name };
    });
  },
  dataSetOptions() {
    return DataSets.find().map((dataSet) => {
      return { value: dataSet._id, label: dataSet.name };
    });
  },
});



// Template.patientAndOrSampleFields

Template.patientAndOrSampleFields.onCreated(function () {
  let instance = this;

  // look up the patient when they set sample_label
  // NOTE: "" is for "No patient", undefined is  for "Set automatically"
  instance.lookedUpPatient = new ReactiveVar();
  instance.autorun(() => {
    let patient_label = undefined;
    let sample_label = AutoForm.getFieldValue("sample_label", "insertRecord");

    if (sample_label) {
      let dataSet = DataSets.findOne(instance.parent().data_set_id.get());

      let patient = _.find(dataSet.patients, (patient) => {
        return patient.sample_labels.indexOf(sample_label) !== -1;
      });

      if (patient) {
        patient_label = patient.patient_label;
      } else {
        patient_label = "";
      }
    }

    instance.lookedUpPatient.set(patient_label);
  });
});

Template.patientAndOrSampleFields.helpers({
  lookedUpPatient: function () {
    return Template.instance().lookedUpPatient.get();
  },
});



// Template.automaticPatientLabelField

Template.automaticPatientLabelField.onRendered(function () {
  let instance = this;

  instance.autorun(() => {
    let hello = Template.currentData();

    Meteor.defer(() => {
      instance.$("input[name=patient_label]").popup({
        content: "This field is set based on the selected sample."
      });
    });
  });
});
