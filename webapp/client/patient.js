// Template.patient

Template.patient.onCreated(function () {
  const instance = this;
  const { study_label, patient_label } = instance.data;

  instance.autorun(function () {
    Meteor.userId(); // resubscribe when this changes
    instance.subscribe("study", study_label);
    instance.subscribe("patientSamples", study_label, patient_label);
  });

  instance.study = new ReactiveVar();
  instance.patient = new ReactiveVar(); // from the study's `patients` list
  instance.autorun(function () {
    const study = Studies.findOne({ id: study_label });
    instance.study.set(study);

    let patient;
    if (study) {
      patient = _.findWhere(study.patients, { patient_label });
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
    const study = Template.instance().parent(2).study.get();

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



// Template.upDownGenes

Template.upDownGenes.onCreated(function () {
  const instance = this;

  console.log("instance.data:", instance.data);
  let { study_label } = instance.parent(2).data;
  console.log("study_label:", study_label);
  instance.subscribe("upDownGenes", study_label, instance.data.sample_label);
  // instance.
});

Template.upDownGenes.helpers({

});
