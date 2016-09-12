// Template.listUpDownGenes

Template.listUpDownGenes.onCreated(function() {
  let instance = this;

  instance.subscribe("dataSetNamesSamples");
  instance.subscribe("sampleGroups");

  instance.customSampleGroup = new ReactiveVar();
  instance.error = new ReactiveVar(); // { header: "Uh oh", message: "hi" }

  instance.talkingToServer = new ReactiveVar(false);
});

Template.listUpDownGenes.helpers({
  formSchema() {
    return new SimpleSchema({
      data_set_id: {
        type: String,
        label: "Sample's data set"
      },
      sample_labels: { type: [String], label: "Samples" },
      sample_group_id: { type: String, label: "Background sample group" },
      iqr_multiplier: { type: Number, decimal: true },
      use_filtered_sample_group: {type: Boolean, label:
         "Apply gene filters to background sample group?", defaultValue:true},
    });
  },
  undefined() { return undefined; },
  patientAndDataSets() {
    return DataSets.find({}, { sort: { name: 1 } }).map((dataSet) => {
      return { value: dataSet._id, label: dataSet.name };
    });
  },
  sampleOptions() {
    let _id = AutoForm.getFieldValue("data_set_id", "createUpDownGenes");

    // http://stackoverflow.com/questions/8996963/
    // how-to-perform-case-insensitive-sorting-in-javascript
    let samples = DataSets.findOne(_id).sample_labels.sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    return _.map(samples, (label) => {
      return { value: label, label };
    });
  },
  sampleGroupOptions() {
    let query = SampleGroups.find({}, { sort: { name: 1 } });

    let sgOptions = query.map((sampleGroup) => {
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
  talkingToServer() { return Template.instance().talkingToServer.get() },
  multipleSamplesSelected() {
    let samples = AutoForm.getFieldValue("sample_labels", "createUpDownGenes");

    return samples && samples.length > 1;
  },
});

Template.listUpDownGenes.events({
  "submit #createUpDownGenes"(event, instance) {
    event.preventDefault();

    let formValues = AutoForm.getFormValues("createUpDownGenes");
    let customSampleGroup = instance.customSampleGroup.get();

    // until Match.Maybe is available, make sure this is an Object
    if (!customSampleGroup) customSampleGroup = {};

    instance.talkingToServer.set(true);
    Meteor.call("createUpDownGenes", formValues.insertDoc, customSampleGroup,
        (error, jobIds) => {
      instance.talkingToServer.set(false);

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
        if (jobIds.length === 1) {
          FlowRouter.go("upDownGenesJob", { job_id: jobIds[0] });
        }
      }
    });
  },
});

// Template.previouslyRunUpDownGenes

Template.previouslyRunUpDownGenes.onCreated(function() {
  let instance = this;

  instance.subscribe("upDownGenesJobs");
});

Template.previouslyRunUpDownGenes.helpers({
  getJobs() {
    return Jobs.find({ name: "UpDownGenes" }, {
      sort: { date_created: -1 }
    });
  },
});
