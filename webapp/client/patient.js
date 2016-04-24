// Template.patient

Template.patient.onCreated(function () {
  const instance = this;
  const { study_label, patient_label } = instance.data;

  instance.autorun(function () {
    Meteor.userId(); // resubscribe when this changes
    instance.subscribe("study", study_label);
    instance.subscribe("patientSamples", study_label, patient_label);
  });

  instance.patient = new ReactiveVar(); // from the study's `patients` list
  instance.autorun(function () {
    let study = Studies.findOne({ id: study_label });

    let patient;
    if (study) {
      patient = _.findWhere(study.patients, { patient_label });
      _.extend(patient, {
        study_label: study.id
      });
    }
    instance.patient.set(patient);
  });
});

Template.patient.helpers({
  getPatient: function () {
    return Template.instance().patient.get();
  },
});



// Template.questions

Template.questions.onRendered(function () {
  const instance = this;

  // make the accordion work
  instance.$('.ui.accordion')
    .accordion()
  ;
});



// Template.patientLoadedData

Template.patientLoadedData.helpers({
  geneExpExists: function (normalization) {
    const sample_label = this.toString(); // IDK why `typeof this` === "object"
    const study = Studies.findOne({id: Template.instance().data.study_label});

    const samples = study.gene_expression;
    if (samples && samples.includes(sample_label)) {
      return "green checkmark";
    } else {
      return "red remove";
    }
  },
});



// Template.patientTumorMap

Template.patientTumorMap.helpers({
  mapTypes: function () {
    return [
      { title: "Gene Expression", mapLabel: "gene_expression" },
      { title: "Copy Number", mapLabel: "copy_number" },
      { title: "Mutations", mapLabel: "mutations" },
    ];
  },
});



// Template.tumorMapButton

Template.tumorMapButton.onCreated(function () {
  const instance = this;

  instance.creatingBookmark = new ReactiveVar(false);
});

Template.tumorMapButton.helpers({
  bookmarkExists: function () {
    let sample = Samples.findOne({sample_label: this.sample_label});

    return !!sample.tumor_map_bookmarks &&
        sample.tumor_map_bookmarks[this.mapLabel.toString()];
  },
  creatingBookmark: function () {
    return Template.instance().creatingBookmark.get();
  },
  getBookmark: function () {
    let sample = Samples.findOne({sample_label: this.sample_label});
    return sample.tumor_map_bookmarks[this.mapLabel.toString()];
  },
});

Template.tumorMapButton.events({
  "click .generate-bookmark": function (event, instance) {
    instance.creatingBookmark.set(true);

    const { study_label } = instance.parent(3).data;
    const { sample_label, mapLabel } = instance.data;
    Meteor.call("createTumorMapBookmark", study_label, sample_label, mapLabel,
        function (error, result) {
      // regardless of result, stop "creatingBookmark"
      instance.creatingBookmark.set(false);
    });
  },
});



// Template.patientUpDownGenes

Template.patientUpDownGenes.onCreated(function () {
  const instance = this;
  let { data } = instance;

  instance.sampleGroupsSub = instance.subscribe("sampleGroups");

  instance.sampleLabel = new ReactiveVar();
  instance.sampleGroupId = new ReactiveVar();
  instance.customSampleGroup = new ReactiveVar(false);
  instance.error = new ReactiveVar(); // { header: "Uh oh", message: "hi" }
  instance.waitingForResponse = new ReactiveVar(false);
});

Template.patientUpDownGenes.helpers({
  getSampleGroups: function () {
    return SampleGroups.find({});
  },
});

Template.patientUpDownGenes.onRendered(function () {
  let instance = this;

  instance.$(".ui.dropdown").dropdown();
});

Template.patientUpDownGenes.events({
  "click .choose-sample-label": function (event, instance) {
    instance.sampleLabel.set(this.valueOf());
  },
  "click .choose-custom-sample-group": function (event, instance) {
    instance.customSampleGroup.set(true);
    instance.sampleGroupId.set(null);
  },
  "click .choose-sample-group": function (event, instance) {
    instance.sampleGroupId.set(this._id);
    instance.customSampleGroup.set(false);
  },
  "click .close-error-message": function (event, instance) {
    instance.error.set(null);
  },
  "submit #create-up-down-genes": function (event, instance) {
    event.preventDefault();

    // reset the errors from last time
    instance.error.set(null);

    let sample_label = instance.sampleLabel.get();
    let sample_group_id = instance.sampleGroupId.get();

    if (!sample_label) {
      instance.error.set({
        header: "Uh oh!",
        message: "Please select a sample to continue."
      });
      return;
    }

    if (!sample_group_id) {
      instance.error.set({
        header: "What about the background?",
        message: "Please select a background sample group above to continue."
      });
      return;
    }

    // submit to the server for consideration
    instance.waitingForResponse.set(true);
    let args = _.pick(instance.data, "study_label", "patient_label");
    _.extend(args, { sample_label, sample_group_id });

    Meteor.call("createUpDownGenes", args, function (error, job_id) {
      instance.waitingForResponse.set(false);

      if (error) {
        console.log("error:", error);
        instance.error.set({
          header: "Internal error",
          message: "We had a problem processing your request... If this " +
              "messages persists, please " + contactTeoText,
        });
      } else {

        FlowRouter.go("upDownGenes", _.extend(args, { job_id }));
      }
    });

  },
});



// Template.patientUpDownGenesTable

Template.patientUpDownGenesTable.onCreated(function () {
  let instance = this;
  let { data } = instance;

  instance.subscribe("upDownGenes", data.study_label, data.patient_label);
});

Template.patientUpDownGenesTable.helpers({
  getJobs: function () {
    let { data } = Template.instance();
    return Jobs.find({
      name: "UpDownGenes",
      status: { $ne: "creating" },
    });
  },
});
