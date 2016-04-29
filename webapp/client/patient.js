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

  // show/hide popup about how long it's going to take to generate the
  // TumorMap bookmark
  instance.autorun((computation) => {
    if (instance.creatingBookmark.get()) {
      instance.$(".bookmark-popup").popup("show");
    } else {
      if (!computation.firstRun) {
        instance.$(".bookmark-popup").popup("destroy");
      }
    }
  });
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
  // whether they want to create a custom sample group
  instance.createCustomSampleGroup = new ReactiveVar(false);
  // the custom sample group data (initialized if needed in sub-template)
  instance.customSampleGroup = new ReactiveVar();
  instance.iqrMultiplier = new ReactiveVar(1.5); // error if null
  instance.error = new ReactiveVar(); // { header: "Uh oh", message: "hi" }
  instance.waitingForResponse = new ReactiveVar(false);
});

Template.patientUpDownGenes.onRendered(function () {
  let instance = this;

  instance.$(".ui.dropdown").dropdown();
});

Template.patientUpDownGenes.helpers({
  getSampleGroups: function () {
    return SampleGroups.find({});
  },
  getCustomSampleGroup: function () {
    return Template.instance().customSampleGroup; // return ReactiveVar
  },
  error: function () {
    return Template.instance().error; // return ReactiveVar
  },
});

Template.patientUpDownGenes.events({
  "click .choose-sample-label": function (event, instance) {
    instance.sampleLabel.set(this.valueOf());
  },
  "click .choose-custom-sample-group": function (event, instance) {
    instance.createCustomSampleGroup.set(true);
    instance.sampleGroupId.set(null);
  },
  "click .choose-sample-group": function (event, instance) {
    instance.sampleGroupId.set(this._id);
    instance.createCustomSampleGroup.set(false);
  },
  "keyup .set-iqr": function (event, instance) {
    let newString = event.target.value;
    let newNumber = NaN;
    if (!isNaN(newString)) {
      newNumber = parseFloat(newString);
    }
    instance.iqrMultiplier.set(parseFloat(newNumber));
  },
  "submit #create-up-down-genes": function (event, instance) {
    event.preventDefault();

    // reset the errors from last time
    instance.error.set(null);

    let sample_label = instance.sampleLabel.get();
    if (!sample_label) {
      instance.error.set({
        header: "Uh oh!",
        message: "Please select a sample to continue."
      });
      return;
    }

    let iqr_multiplier = instance.iqrMultiplier.get();
    if (isNaN(iqr_multiplier)) {
      instance.error.set({
        header: "Not a number",
        message: "Please input a number in the IQR multiplier field."
      });
      return;
    }

    // sometimes we have to make two trips to the server, so we need to be
    // able to call this from async code (after a Meteor method has been run)
    function createUpDownGenes (sample_group_id) {
      let args = _.pick(instance.data, "study_label", "patient_label");
      _.extend(args, { sample_label, sample_group_id, iqr_multiplier });

      // submit to the server for consideration
      Meteor.call("createUpDownGenes", args, function (error, job_id) {
        if (error) {
          instance.error.set({
            header: "Internal error",
            message: "We had a problem processing your request... If this " +
                "messages persists, please " + contactTeoText,
          });
        } else {
          FlowRouter.go("upDownGenes", _.extend(args, { job_id }));
        }

        instance.waitingForResponse.set(false);
      });
    }

    if (instance.createCustomSampleGroup.get()) {
      let customSampleGroup = instance.customSampleGroup.get();

      // sanity checks
      if (!customSampleGroup.name) {
        instance.error.set({
          header: "Whoops!",
          message: "Please name your sample group."
        });
        return;
      }
      if (customSampleGroup.studies.length === 0) {
        instance.error.set({
          header: "No studies?",
          message: "Please add at least one study to your sample group."
        });
        return;
      }

      instance.waitingForResponse.set(true);
      Meteor.call("createSampleGroup", customSampleGroup, (error, result) => {
        if (error) {
          instance.waitingForResponse.set(false);

          instance.error.set({
            header: "Internal error",
            message: "We had a problem creating a sample group... If this " +
                "messages persists, please " + contactTeoText,
          });
        } else {
          createUpDownGenes(result);
        }
      });
    } else {
      let sampleGroupId = instance.sampleGroupId.get();

      if (!sampleGroupId) {
        instance.error.set({
          header: "Did you forget something?",
          message: "Please select a background sample group to continue."
        });
        return;
      }

      instance.waitingForResponse.set(true);
      createUpDownGenes(sampleGroupId)
    }
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
