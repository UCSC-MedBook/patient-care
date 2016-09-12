// Template.listSingleSampleTopGenes

AutoForm.addHooks("createSingleSampleTopGenes", {
  onSuccess(formType, jobIds) {
    // foward to job page if they specified only one sample
    if (jobIds.length === 1) {
      FlowRouter.go("singleSampleTopGenesJob", {
        job_id: jobIds[0]
      });
    }
  },
});

Template.listSingleSampleTopGenes.onCreated(function () {
  let instance = this;

  // first only subscribe to the name
  instance.subscribe("allOfCollectionOnlyMetadata", "DataSets");

  instance.autorun(() => {
    let dataSetId = AutoForm.getFieldValue("data_set_id",
        "createSingleSampleTopGenes");

    if (dataSetId) {
      instance.subscribe("dataSetSampleLabels", dataSetId);
    }
  });
});

Template.listSingleSampleTopGenes.helpers({
  schema() {
    return new SimpleSchema({
      // data_set_name set on the server
      data_set_id: { type: String, label: "Data set" },
      sample_labels: { type: [String], label: "Sample(s)" },
      percent_or_count: {
        type: String,
        allowedValues: [
          "percent",
          "count",
        ],
        label: "Filter top genes by percent or count?"
      },
      top_percent: {
        type: Number,
        optional: true,
        custom() {
          if (!this.isSet &&
              this.field("percent_or_count").value === "percent") {
            return "required";
          }
        },
        min: 0.001,
        max: 100,
        decimal: true,
      },
      top_count: {
        type: Number,
        optional: true,
        custom() {
          if (!this.isSet &&
              this.field("percent_or_count").value === "count") {
            return "required";
          }
        },
        min: 1,
      },
    });
  },
  loadingIfFalse(boolean) {
    if (!boolean) {
      return "loading";
    }
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
        "createSingleSampleTopGenes");
    if (!dataSetId) { return false; }

    // make sure the sample labels are loaded
    let { sample_labels } = DataSets.findOne(dataSetId);
    if (!sample_labels) { return false; }

    return sample_labels.sort().map((label) => {
      return { label, value: label };
    });
  },
  multipleSamplesSelected() {
    let sampleLabels = AutoForm.getFieldValue("sample_labels",
        "createSingleSampleTopGenes");

    return sampleLabels && sampleLabels.length > 1;
  },
});

// Template.previouslyRunSingleSampleTopGenes

Template.previouslyRunSingleSampleTopGenes.onCreated(function() {
  let instance = this;

  instance.subscribe("jobsOfType", "RunSingleSampleTopGenes");
});

Template.previouslyRunSingleSampleTopGenes.helpers({
  getJobs() {
    return Jobs.find({ name: "RunSingleSampleTopGenes" }, {
      sort: { date_created: -1 }
    });
  },
});

// Template.singleSampleTopGenesJob

Template.singleSampleTopGenesJob.onCreated(function () {
  let instance = this;

  // subscribe and keep up to date
  instance.autorun(function () {
    instance.subscribe("specificJob", FlowRouter.getParam("job_id"));
  });
});

Template.singleSampleTopGenesJob.events({
  "click .run-gsea"(event, instance) {
    // pass the gene set to the modal via a query
    FlowRouter.setQueryParams({
      "geneSetIdForGsea": GeneSets.findOne()._id
    });
  },
});
