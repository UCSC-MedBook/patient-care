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
  "click .close-error-message": function (event, instance) {
    instance.error.set(null);
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



// Template.editSampleGroup

Template.editSampleGroup.onCreated(function () {
  let instance = this;

  // load all available studies
  instance.subscribe("studies");

  instance.sampleGroup = instance.data.sampleGroup;
  if (!instance.sampleGroup.get()) { // make sure it's initialized
    let samples = Studies.findOne({id: "prad_wcdt"}).gene_expression;
    let filtered = samples.slice(0, 10);

    instance.sampleGroup.set({
      name: "",
      version: 1,
      collaborations: [ Meteor.user().collaborations.personal ],
      studies: [
        // {
        //   study_label: "prad_wcdt",
        //   filters: [
        //     {
        //       type: "sample_label_list",
        //       options: {
        //         sample_labels: [ "DTB-001", "DTB-002" ]
        //       }
        //     }
        //   ]
        // }
      ]
    });
  }

  // store this seperately so that we don't look for a version every time
  instance.name = new ReactiveVar("");

  // look up the name in the sample groups this person has access to
  // and figure out what version this one should be
  let updateVersion = _.debounce((name) => {
    Meteor.call("getSampleGroupVersion", name, (error, result) => {
      let sampleGroup = instance.sampleGroup.get();
      sampleGroup.version = result;
      instance.sampleGroup.set(sampleGroup);
    });
  }, 250);
  instance.autorun(() => {
    updateVersion(instance.name.get());
  });

  // update the sample group with the name
  instance.autorun(() => {
    // don't rerun when sample group changes
    let sampleGroup = Tracker.nonreactive(() => {
      return instance.sampleGroup.get();
    });
    sampleGroup.name = instance.name.get();
    instance.sampleGroup.set(sampleGroup);
  });
});

Template.editSampleGroup.onRendered(function () {
  let instance = this;

  instance.$(".sample-group-version").popup({
    position : "top right",
  });
});

Template.editSampleGroup.helpers({
  sampleGroup: function () {
    return Template.instance().sampleGroup; // returns ReactiveVar
  },
  getSampleGroup: function () {
    return Template.instance().sampleGroup.get();
  },
  addableStudies: function () {
    let existingStudies = Template.instance().sampleGroup.get().studies;

    // only return studies that haven't already been added
    return Studies.find({
      id: { $nin: _.pluck(existingStudies, "study_label") },
    });
  },
  getStudyName: function (study_label) {
    let study = Studies.findOne({id: study_label});
    if (study) {
      return study.name;
    } else {
      return "You don't have access to this study.";
    }
  },
});

Template.editSampleGroup.events({
  "keyup .sample-group-name": function (event, instance) {
    instance.name.set(event.target.value);
  },
  "click .remove-study": function (event, instance) {
    let sampleGroup = instance.sampleGroup.get();

    sampleGroup.studies = _.filter(sampleGroup.studies, (study) => {
      return study.study_label !== this.study_label
    });

    instance.sampleGroup.set(sampleGroup);
  },
});



// Template.addStudyMenu

Template.addStudyMenu.onRendered(function () {
  let instance = this;

  instance.$(".dropdown").popup({
    hoverable: true,
    on: "click",
  });
});

Template.addStudyMenu.events({
  "click .add-study-to-sample-group": function (event, instance) {
    let sampleGroup = instance.data.sampleGroup.get();

    sampleGroup.studies.push({
      study_label: this.id,
      filters: [],
    });

    instance.data.sampleGroup.set(sampleGroup);
  },
});



// Template.addFilterButton

Template.addFilterButton.onRendered(function () {
  let instance = this;

  instance.$(".dropdown").popup({
    hoverable: true,
    on: "click",
  });
});

Template.addFilterButton.events({
  "click .add-sample-label-list-filter": function (event, instance) {
    // the popup moves down weirdly, so hide it
    instance.$(".dropdown").popup("hide");

    let sampleGroup = instance.data.sampleGroup.get();

    sampleGroup.studies[instance.data.studyIndex].filters.push({
      type: "sample_label_list",
      options: {
        sample_labels: []
      },
    });

    instance.data.sampleGroup.set(sampleGroup);
  },
});




// Template.showFilter

Template.showFilter.onCreated(function () {
  let instance = this;

  instance.sampleGroup = instance.data.sampleGroup;
  instance.editing = new ReactiveVar(false);

  instance.setOptions = function (newOptions) {
    let sampleGroup = instance.sampleGroup.get();

    let { filterIndex, studyIndex } = instance.data;
    sampleGroup.studies[studyIndex].filters[filterIndex].options = newOptions;

    instance.sampleGroup.set(sampleGroup);
  };
});

Template.showFilter.helpers({
  getFilter: function () {
    let { sampleGroup, data } = Template.instance();

    let study = sampleGroup.get().studies[data.studyIndex];
    if (study) { // remove error on remove study
      return study.filters[data.filterIndex];
    }
  },
  setOptions: function () {
    return Template.instance().setOptions;
  },
  editing: function () {
    return Template.instance().editing; // returns ReactiveVar
  },
  getEditing: function () {
    return Template.instance().editing.get();
  },
  study_label: function () {
    let instance = Template.instance();
    return instance.sampleGroup.get()
        .studies[instance.data.studyIndex].study_label;
  },
});

Template.showFilter.events({
  "click .edit-filter-toggle": function (event, instance) {
    instance.editing.set(!instance.editing.get());
  },
  "click .remove-filter": function (event, instance) {
    let sampleGroup = instance.sampleGroup.get();

    let { filterIndex, studyIndex } = instance.data;
    sampleGroup.studies[studyIndex].filters.splice(filterIndex, 1);

    instance.sampleGroup.set(sampleGroup);
  },
});



// Template.sampleLabelListFilter

Template.sampleLabelListFilter.onCreated(function () {
  let instance = this;

  instance.invalidSampleLabels = new ReactiveVar(null);
});

Template.sampleLabelListFilter.helpers({
  sampleLabelsToText: function () {
    return this.options.sample_labels.join("\n");
  },
  getInvalidSampleLabels: function () {
    return Template.instance().invalidSampleLabels.get();
  },
});

Template.sampleLabelListFilter.events({
  "click .done-editing": function (event, instance) {
    // clear errors
    instance.invalidSampleLabels.set(null);

    // let's gooo (split by whitespace characters, get rid of spaces)
    let textareaSampleLabels = instance.$("textarea").val().split(/[\s,]+/);
    let sample_labels = _.filter(textareaSampleLabels, (value) => {
      return value; // remove falsey
    });

    // make sure we don't have any bad values
    let study = Studies.findOne({id: instance.data.study_label});
    let studySampleLabelMap = _.reduce(study.Sample_IDs, (memo, label) => {
      memo[label] = true;
      return memo;
    }, {});

    let badValues = _.filter(sample_labels, (label) => {
      return !studySampleLabelMap[label];
    });

    if (badValues.length) {
      instance.invalidSampleLabels.set(badValues);
      return;
    }

    // nicely done! set the options and return to non-editing
    instance.data.setOptions({
      sample_labels
    });
    instance.data.editing.set(false);
  },
  "click .close-sample-error-message": function (event, instance) {
    console.log("click");
    instance.invalidSampleLabels.set(null);
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
