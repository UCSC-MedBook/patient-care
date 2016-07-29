// Template.listUpDownGenes

Template.listUpDownGenes.onCreated(function() {
  let instance = this;

  instance.subscribe("dataSetNamesSamples");
  instance.subscribe("sampleGroups");

  instance.customSampleGroup = new ReactiveVar();
  instance.error = new ReactiveVar(); // { header: "Uh oh", message: "hi" }
});

Template.listUpDownGenes.helpers({
  formSchema() {
    return new SimpleSchema({
      data_set_or_patient_id: {
        type: String,
        label: "Sample's data set or patient"
      },
      sample_label: { type: String, label: "Sample" },
      sample_group_id: { type: String, label: "Background sample group" },
      iqr_multiplier: { type: Number, decimal: true },
      use_filtered_sample_group: {type: Boolean, label: "Use gene filters?", defaultValue:true},
    });
  },
  undefined() { return undefined; },
  patientAndDataSets() {
    return [{
      itemGroup: "Data sets",
      items: DataSets.find({}).map((dataSet) => {
        return { value: "data_set-" + dataSet._id, label: dataSet.name };
      })
    }];
    //},
    // {
    //   itemGroup: "Patients",
    //   items: Patients.find({}).map((patient) => {
    //     return {
    //       value: "patient-" + patient._id,
    //       label: patient.patient_label
    //     };
    //   })
    // }];
  },
  sampleOptions() {
    let fieldValue =
        AutoForm.getFieldValue("data_set_or_patient_id", "createUpDownGenes");

    if (fieldValue.startsWith("patient-")) {
      let _id = fieldValue.slice("patient-".length);

      return _.map(Patients.findOne(_id).samples, ({ sample_label }) => {
        return { value: sample_label, label: sample_label };
      });
    } else if (fieldValue.startsWith("data_set-")) {
      let _id = fieldValue.slice("data_set-".length);

      return _.map(DataSets.findOne(_id).sample_labels, (label) => {
        return { value: label, label };
      });
    }
  },
  sampleGroupOptions() {
    let sgOptions = SampleGroups.find({}).map((sampleGroup) => {
      return { value: sampleGroup._id, label: sampleGroup.name };
    });

    return [ {
      value: "creating",
      label: "Create new",
      icon: "plus icon"
    } ].concat(sgOptions);
  },
  customSampleGroup() { return Template.instance().customSampleGroup; },
  error() { return Template.instance().error; },
});

Template.listUpDownGenes.events({
  "submit #createUpDownGenes"(event, instance) {
    event.preventDefault();

    let formValues = AutoForm.getFormValues("createUpDownGenes");
    console.log("got values which are", formValues); // XXX 
    let customSampleGroup = instance.customSampleGroup.get();

    // until Match.Maybe is available, make sure this is an Object
    if (!customSampleGroup) customSampleGroup = {};

    Meteor.call("createUpDownGenes", formValues.insertDoc, customSampleGroup,
        (error, job_id) => {
      if (error) {
        if (error.reason === "Match failed") {
          // there might be edge cases here which I haven't found yet so other
          // messages might have to be shown instead
          instance.error.set({ header: "Please correct errors above" });
        } else {
          instance.error.set({
            header: error.reason,
            message: error.details
          });
        }
      } else {
        FlowRouter.go("upDownGenesJob", { job_id });
      }
    });
  },
});

// Template.previouslyRunUpDownGenes

Template.previouslyRunUpDownGenes.onCreated(function() {
  let instance = this;

  instance.subscribe("jobsOfType", "UpDownGenes");
});

Template.previouslyRunUpDownGenes.helpers({
  getJobs() {
    return Jobs.find({ name: "UpDownGenes" }, {
      sort: { date_created: -1 }
    });
  },
});
