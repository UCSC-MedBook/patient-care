// Template.listPairedAnalysis

AutoForm.addHooks("createPairedAnalysis", {
  onSuccess(formType, job_id) {
    FlowRouter.go("pairedAnalysisJob", { job_id });
  },
});

Template.listPairedAnalysis.onCreated(function () {
  let instance = this;

  // first only subscribe to the name
  instance.subscribe("allOfCollectionOnlyName", "DataSets");

  // when the data set is selected, subscribe to the sample_labels
  // NOTE: this subscribe introduces a race condition that
  // I'm relying on to clear the two select boxes. They are cleared
  // becuase they are removed from the DOM and re-added because the
  // subscribe takes just enough time to have this happen. If the
  // subscribe happens instantaneously they select boxes will not
  // be cleared.
  instance.autorun(() => {
    let dataSetId = AutoForm.getFieldValue("data_set_id",
        "createPairedAnalysis");

    if (dataSetId) {
      instance.subscribe("dataSetSampleLabels", dataSetId);
    }
  });
});

Template.listPairedAnalysis.helpers({
  createPairedAnalysisSchema() {
    return new SimpleSchema({
      data_set_id: { type: String, label: "Data set" },
      // data_set_name set on the server

      primary_sample_labels: { type: [ String ] },
      progression_sample_labels: { type: [ String ] },
    });
  },
  loadingIfFalse(boolean) {
    if (!boolean) {
      return "loading";
    }

    // in order to show error messages
    return "warning";
  },
  dataSetOptions() {
    return DataSets.find({}).map((dataSet) => {
      return {
        label: dataSet.name,
        value: dataSet._id,
      };
    });
  },
  sampleOptions() {
    let dataSetId = AutoForm.getFieldValue("data_set_id",
        "createPairedAnalysis");
    if (!dataSetId) { return false; }

    // make sure the sample labels are loaded
    let { sample_labels } = DataSets.findOne(dataSetId);
    if (!sample_labels) { return false; }

    return sample_labels.sort().map((label) => {
      return { label, value: label };
    });
  },
  duplicateSamples() {
    // this should return true when a sample is selected both as a primary
    // and a progression tumor
    let primarySamples = AutoForm.getFieldValue("primary_sample_labels",
        "createPairedAnalysis");
    let progressionSamples = AutoForm.getFieldValue("progression_sample_labels",
        "createPairedAnalysis");

    if (primarySamples && progressionSamples) {
      let uniqueSamples = _.uniq(primarySamples.concat(progressionSamples));
      let selectedSampleCount = primarySamples.length + progressionSamples.length;

      return uniqueSamples.length !== selectedSampleCount;
    }
  },
});

// Template.previouslyRunPairedAnalysis

Template.previouslyRunPairedAnalysis.onCreated(function() {
  let instance = this;

  instance.subscribe("jobsOfType", "RunPairedAnalysis");
});

Template.previouslyRunPairedAnalysis.helpers({
  getJobs() {
    return Jobs.find({ name: "RunPairedAnalysis" }, {
      sort: { date_created: -1 }
    });
  },
});

// Template.pairedAnalysisJob

Template.pairedAnalysisJob.onCreated(function () {
  let instance = this;

  // subscribe and keep up to date
  instance.autorun(function () {
    instance.subscribe("specificJob", FlowRouter.getParam("job_id"));
  });
});

Template.pairedAnalysisJob.events({
  "click .run-gsea"(event, instance) {
    // pass the gene set to the modal via a query
    FlowRouter.setQueryParams({
      "geneSetIdForGsea": GeneSets.findOne()._id
    });
  },
});

// Template.showPairedAnalysisResult

Template.showPairedAnalysisResult.onCreated(function () {
  let instance = this;

  instance.subscribe("associatedObjectGeneSet", {
    collection_name: "Jobs",
    mongo_id: instance.data._id,
  });
});

Template.showPairedAnalysisResult.helpers({
  getGeneSet() {
    // it should be the only one loaded...
    return GeneSets.findOne();
  },
});
