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
    let textareaSampleLabels = instance.$("textarea").val().split(/[\s,;]+/);
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
    instance.invalidSampleLabels.set(null);
  },
});
