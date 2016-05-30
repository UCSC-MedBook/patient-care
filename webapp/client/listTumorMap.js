// Template.listTumorMap

Template.listTumorMap.helpers({
  overlaySchema() {
    return MedBook.jobSchemas.TumorMapOverlay.args;
  },
});

// Template.afObjectField_dataSetsAndSamples

Template.afObjectField_dataSetsAndSamples.onCreated(function() {
  let instance = this;

  instance.subscribe("dataSetNamesAndSamples");
});

Template.afObjectField_dataSetsAndSamples.helpers({
  dataSetOptions() {
    return DataSets.find().map((dataSet) => {
      return { value: dataSet._id, label: dataSet.name };
    });
  },
  getDataSetName() {
    let dataSetField = this.name + ".data_set_id";
    let dataSetId = AutoForm.getFieldValue(dataSetField, "tumorMapOverlay");

    if (dataSetId) {
      return DataSets.findOne(dataSetId).name;
    }
  },
  undefined() { return undefined; },
  sampleOptions() {
    let dataSetField = this.name + ".data_set_id";
    let dataSetId = AutoForm.getFieldValue(dataSetField, "tumorMapOverlay");

    return _.map(DataSets.findOne(dataSetId).sample_labels, (label) => {
      return { value: label, label };
    });
  },
});

// Template.previouslyRunTumorMapOverlays

Template.previouslyRunTumorMapOverlays.onCreated(function() {
  let instance = this;

  instance.subscribe("jobsOfType", "TumorMapOverlay");
});

Template.previouslyRunTumorMapOverlays.helpers({
  getJobs() {
    return Jobs.find({ name: "TumorMapOverlay" }, {
      sort: { date_created: -1 }
    });
  },
});
