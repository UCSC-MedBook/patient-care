// Template.listLimma

AutoForm.addHooks("createLimma", {
  onSuccess(formType, job_id) {
    FlowRouter.go("limmaJob", { job_id });
  },
});

Template.listLimma.onCreated(function () {
  let instance = this;

  // subscribe to the sample group data when the user selects a value type
  instance.autorun(() => {
    let valueType = AutoForm.getFieldValue("value_type", "createLimma");

    if (valueType) {
      instance.subscribe("limmaFormData", valueType);
    }
  });
});

Template.listLimma.helpers({
  createLimmaSchema() {
    // inherit allowed values from sample group allowed values
    let { allowedValues } = SampleGroups.simpleSchema().schema().value_type;

    return new SimpleSchema({
      value_type: {
        type: String,
        allowedValues,
        autoform: {
          options: _.map(allowedValues, (value) => {
            return {
              value,
              label: MedBook.utility.slugToString(value),
            };
          }),
        },
      },

      // name and version set server-side
      experimental_sample_group_id: {
        type: String,
        label: "Experimental group",
      },
      reference_sample_group_id: {
        type: String,
        label: "Reference group",
      },

      top_genes_count: { type: Number, min: 1 },
    });
  },
  loadingIfFalse(boolean) {
    if (!boolean) {
      return "loading";
    }

    // in order to show error messages
    return "warning";
  },
  sampleGroupOptions() {
    let value_type = AutoForm.getFieldValue("value_type", "createLimma");

    if (!value_type) {
      return false;
    }

    let cursor = SampleGroups.find({ value_type }, {
      sort: {
        name: 1,
        version: 1,
      }
    });

    return cursor.map((sampleGroup) => {
      return {
        value: sampleGroup._id,
        label: `${sampleGroup.name} (v${sampleGroup.version})`,
      };
    });
  },
  duplicateSamples() {
    // this should return true when a sample is selected both as a primary
    // and a progression tumor
    let primarySamples = AutoForm.getFieldValue("primary_sample_labels",
        "createLimma");
    let progressionSamples = AutoForm.getFieldValue("progression_sample_labels",
        "createLimma");

    if (primarySamples && progressionSamples) {
      let uniqueSamples = _.uniq(primarySamples.concat(progressionSamples));
      let selectedSampleCount = primarySamples.length + progressionSamples.length;

      return uniqueSamples.length !== selectedSampleCount;
    }
  },
});

// Template.previouslyRunLimma

Template.previouslyRunLimma.onCreated(function() {
  let instance = this;

  instance.subscribe("jobsOfType", "RunLimma");
});

Template.previouslyRunLimma.helpers({
  getJobs() {
    return Jobs.find({ name: "RunLimma" }, {
      sort: { date_created: -1 }
    });
  },
});

// Template.limmaJob

Template.limmaJob.onCreated(function () {
  let instance = this;

  // subscribe and keep up to date
  instance.autorun(function () {
    instance.subscribe("specificJob", FlowRouter.getParam("job_id"));
  });
});

Template.limmaJob.helpers({
  slugToString: MedBook.utility.slugToString,
  getJobResultUrl: function(fileName) {
    let userId = Meteor.userId();
    let loginToken = Accounts._storedLoginToken();
    let jobId = FlowRouter.getParam("job_id");

    return `/download/${userId}/${loginToken}/job-blob/${jobId}/${fileName}`;
  },
});

Template.limmaJob.events({
  "click .run-gsea"(event, instance) {
    // pass the gene set to the modal via a query
    FlowRouter.setQueryParams({
      "geneSetIdForGsea": GeneSets.findOne()._id
    });
  },
  "click .voom-iframe-new-tab"(event, instance) {
    // open the current iFrame URL in a new tab: magic!
    window.open($("#voom-plot").contents().get(0).location.href,'_blank');
  },
  "click .mds-iframe-new-tab"(event, instance) {
    // open the current iFrame URL in a new tab: magic!
    window.open($("#mds-plot").contents().get(0).location.href,'_blank');
  },
});

// Template.showLimmaResult

Template.showLimmaResult.onCreated(function () {
  let instance = this;

  instance.subscribe("associatedObjectGeneSet", {
    collection_name: "Jobs",
    mongo_id: instance.data._id,
  });
});

Template.showLimmaResult.helpers({
  getGeneSet() {
    // it should be the only one loaded...
    return GeneSets.findOne();
  },
});
