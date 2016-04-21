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
  instance.subscribe("upDownGenes", data.study_label, data.patient_label);
});

Template.patientUpDownGenes.helpers({
  getJobs: function () {
    let { data } = Template.instance();
    return Jobs.find({
      name: "UpDownGenes",
      "args.sample_label": { $in: data.sample_labels },
      "args.study_label": data.study_label,
    });
  },
});

Template.patientUpDownGenes.events({
  "click #create-up-down-genes": function (event, instance) {
    let options = _.pick(instance.data, "study_label", "patient_label");

    Meteor.call("createUpDownGenes", options, function (error, job_id) {
      if (error) {
        console.log("error:", error);
      } else {
        FlowRouter.go("upDownGenes", _.extend(options, { job_id }));
      }
    });
  },
});
