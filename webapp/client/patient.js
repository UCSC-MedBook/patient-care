// Template.patient

Template.patient.onCreated(function () {
  const instance = this;

  instance.subscribe("patient", instance.data.patient_id);
});

Template.patient.helpers({
  getPatient: function () {
    return Patients.findOne(this.patient_id);
  },
});



// Template.sampleLoadedData

Template.sampleLoadedData.onCreated(function() {
  let instance = this;

  instance.subscribe("sampleLoadedData", instance.data.patient._id,
      instance.data.sample.sample_label);
});

Template.sampleLoadedData.helpers({
  dataExistsClasses: function(attribute) {
    let dataSet = DataSets.findOne(this.sample.data_set_id);

    if (dataSet &&
        dataSet[attribute][this.sample.sample_label] !== undefined) {
      return "green checkmark";
    } else {
      return "red remove";
    }
  },
});



// Template.tumorMapButton

Template.tumorMapButton.onCreated(function() {
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
  // bookmarkExists() {
  //   _.findWhere(this.tumor_map_bookmarks, {
  //     map: "mRNA",
  //     layout: "",
  //   });
  //
  //   if (this.tumor_map_bookmarks &&
  //   console.log("yop:", yop);
  //   console.log("this:", this);
  //   // let sample = Samples.findOne({sample_label: this.sample_label});
  //
  //   // return !!sample.tumor_map_bookmarks &&
  //   //     sample.tumor_map_bookmarks[this.mapLabel.toString()];
  // },
  // creatingBookmark: function () {
  //   return Template.instance().creatingBookmark.get();
  // },
  // getBookmark: function () {
  //   let sample = Samples.findOne({sample_label: this.sample_label});
  //   return sample.tumor_map_bookmarks[this.mapLabel.toString()];
  // },
});

Template.tumorMapButton.events({
  "click .generate-bookmark": function (event, instance) {
    instance.creatingBookmark.set(true);

    const { data_set_id } = instance.parent(3).data;
    const { sample_label, mapLabel } = instance.data;
    Meteor.call("createTumorMapBookmark", data_set_id, sample_label, mapLabel,
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

  instance.$(".dropdown.sample-label").dropdown({
    onChange: (value, text, $selectedItem) => {
      instance.sampleLabel.set(value);
    }
  });

  instance.$(".dropdown.sample-group").dropdown({
    onChange: (value, text, $selectedItem) => {
      if (value === "create-new-sample-group") {
        instance.createCustomSampleGroup.set(true);
        instance.sampleGroupId.set(null);
      } else {
        instance.sampleGroupId.set(value);
        instance.createCustomSampleGroup.set(false);
      }
    }
  });
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
  "keyup .set-iqr": function(event, instance) {
    let newString = event.target.value;
    let newNumber = NaN;
    if (!isNaN(newString)) {
      newNumber = parseFloat(newString);
    }
    instance.iqrMultiplier.set(parseFloat(newNumber));
  },
  "submit #create-up-down-genes": function(event, instance) {
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



    if (instance.createCustomSampleGroup.get()) {

    } else {
      let sampleGroupId = instance.sampleGroupId.get();

      if (!sampleGroupId) {
        instance.error.set({
          header: "No background selected",
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

  instance.subscribe("upDownGenes", data.data_set_id, data.patient_label);
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
