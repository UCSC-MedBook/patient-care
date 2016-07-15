// Template.editSampleGroup

Template.editSampleGroup.onCreated(function () {
  let instance = this;

  // load all available data sets
  instance.subscribe("dataSets");

  instance.sampleGroup = instance.data.sampleGroup;

  // make sure it's initialized
  if (!instance.sampleGroup.get()) {
    instance.sampleGroup.set({
      name: "",
      version: 1,
      collaborations: [ Meteor.user().collaborations.personal ],
      data_sets: []
    });
  }

  // store this seperately so that we don't look for a version every time
  // something that's not the name changes
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
  addableDataSets: function () {
    let addedDataSets = Template.instance().sampleGroup.get().data_sets;

    // only return data sets that haven't already been added
    return DataSets.find({
      _id: { $nin: _.pluck(addedDataSets, "data_set_id") },
    });
  },
  dataSetName: function () {
    let dataSet = DataSets.findOne(this.data_set_id);

    if (dataSet) {
      return dataSet.name;
    } else {
      return "You don't have access to this data set.";
    }
  },
});

Template.editSampleGroup.events({
  "keyup .sample-group-name": function (event, instance) {
    instance.name.set(event.target.value);
  },
  "click .remove-data-set": function (event, instance) {
    let sampleGroup = instance.sampleGroup.get();

    sampleGroup.data_sets = _.filter(sampleGroup.data_sets, (dataSet) => {
      return dataSet.data_set_id !== this.data_set_id
    });

    instance.sampleGroup.set(sampleGroup);
  },
});



// Template.addDataSetMenu

Template.addDataSetMenu.onRendered(function () {
  let instance = this;

  instance.$(".dropdown").popup({
    hoverable: true,
    on: "click",
  });
});

Template.addDataSetMenu.events({
  "click .add-data-set-to-sample-group": function (event, instance) {
    let sampleGroup = instance.data.sampleGroup.get();

    sampleGroup.data_sets.push({
      data_set_id: this._id,
      filters: [],
    });

    instance.data.sampleGroup.set(sampleGroup);
  },
});



// Template.addFilterButton

Template.addFilterButton.onCreated(function () {
  let instance = this;

  instance.addFilter = function(filterObject) {
    // the popup moves down weirdly, so hide it
    instance.$(".dropdown").popup("hide");

    // add the filter to the data set
    let sampleGroup = instance.data.sampleGroup.get();
    sampleGroup.data_sets[instance.data.dataSetIndex].filters.push(filterObject);
    instance.data.sampleGroup.set(sampleGroup);
  }
  // Only allow one form values filter
});

Template.addFilterButton.onRendered(function () {
  let instance = this;

  instance.$(".dropdown").popup({
    hoverable: true,
    on: "click",
  });
});

Template.addFilterButton.helpers({
  isAFormValuesFilterActive: function(){
    let sampleGroup = Template.instance().data.sampleGroup.get();
    let currentDataSet = sampleGroup.data_sets[Template.instance().data.dataSetIndex];
    // No data sets -> no form values filters
    if( typeof(currentDataSet) === "undefined"){ return false; }
    let allFilters = currentDataSet.filters ;
    let wasFilter = (_.pluck(allFilters, "type").indexOf("form_values") !== -1);
    return wasFilter;
  },
});

Template.addFilterButton.events({
  "click .add-form-values-filter": function (event, instance) {
    instance.addFilter({
      type: "form_values",
      options : {
        form_id: "",
        mongo_query: "",
      },
    });
  },
  "click .add-sample-label-list-filter": function (event, instance) {
    instance.addFilter({
      type: "include_sample_list",
      options: {
        sample_labels: []
      },
    });
  },
  "click .add-exclude-sample-label-list-filter": function (event, instance) {
    instance.addFilter({
      type: "exclude_sample_list",
      options: {
        sample_labels: []
      },
    });
  },
});



// Template.showFilter

Template.showFilter.onCreated(function () {
  let instance = this;

  instance.sampleGroup = instance.data.sampleGroup;

  instance.setOptions = function (newOptions) {
    let sampleGroup = instance.sampleGroup.get();

    let { filterIndex, dataSetIndex } = instance.data;
    sampleGroup.data_sets[dataSetIndex].filters[filterIndex].options = newOptions;

    instance.sampleGroup.set(sampleGroup);
  };
});

Template.showFilter.helpers({
  getFilter: function () {
    let { sampleGroup, data } = Template.instance();

    let dataSet = sampleGroup.get().data_sets[data.dataSetIndex];
    if (dataSet) { // remove error on remove dataSet
      return dataSet.filters[data.filterIndex];
    }
  },
  setOptions: function () {
    return Template.instance().setOptions;
  },
  data_set_id: function () {
    let instance = Template.instance();
    return instance.sampleGroup.get()
        .data_sets[instance.data.dataSetIndex].data_set_id;
  },
});

Template.showFilter.events({
  "click .remove-filter": function (event, instance) {
    // define a button with this class in a sub-template to make it work
    let sampleGroup = instance.sampleGroup.get();

    let { filterIndex, dataSetIndex } = instance.data;
    sampleGroup.data_sets[dataSetIndex].filters.splice(filterIndex, 1);

    instance.sampleGroup.set(sampleGroup);
  },
});



// Template.sampleLabelListFilter

Template.sampleLabelListFilter.onCreated(function () {
  let instance = this;

  instance.editing = new ReactiveVar(false);
  instance.invalidSampleLabels = new ReactiveVar(null);
});

Template.sampleLabelListFilter.helpers({
  sampleLabelsToText: function () {
    let sampleObjs =
        MedBook.utility.sampleArrStrToObj(this.options.sample_labels);

    return _.pluck(sampleObjs, "uq_sample_label").join("\n");
  },
  getInvalidSampleLabels: function () {
    return Template.instance().invalidSampleLabels.get();
  },
  getEditing: function () {
    return Template.instance().editing.get();
  },
});

Template.sampleLabelListFilter.events({
  "click .done-editing": function (event, instance) {
    event.preventDefault();

    // clear errors
    instance.invalidSampleLabels.set(null);

    // TODO: for now only allow data sets that have one study
    let dataSet = DataSets.findOne(instance.data.data_set_id);
    let sampleStudyObjs =
        MedBook.utility.sampleArrStrToObj(dataSet.sample_labels);
    let uniqueStudyLabels = _.uniq(_.pluck(sampleStudyObjs, "study_label"));

    if (uniqueStudyLabels.length !== 1) {
      alert("multiple study data sets not supported... yet!");
      instance.editing.set(false);
      return;
    }

    let study_label = uniqueStudyLabels[0];

    // let's gooo (split by whitespace characters, get rid of spaces)
    let textareaSampleLabels = instance.$("textarea").val().split(/[\s,;]+/);
    let sample_labels = _.chain(textareaSampleLabels)
      .filter((value) => { return value; }) // remove falsey
      .uniq() // uniques only
      .map((uq_sample_label) => {
        // convert into sample_labels
        return study_label + "/" + uq_sample_label;
      })
      .value();

    // make sure we don't have any bad values
    let badValues = _.filter(sample_labels, function (sample_label) {
      return dataSet.sample_label_index[sample_label] === undefined;
    });

    // if we do, display them to the user
    if (badValues.length) {
      let sampleObjs = MedBook.utility.sampleArrStrToObj(badValues);

      instance.invalidSampleLabels.set(_.pluck(sampleObjs, "uq_sample_label"));
      return;
    }

    // nicely done! set the options and return to non-editing
    instance.data.setOptions({
      sample_labels
    });
    instance.editing.set(false);
  },
  "click .edit-filter": function (event, instance) {
    // unclear why we need this, but otherwise it submits the form
    event.preventDefault();

    instance.editing.set(true);
  },
  "click .close-sample-error-message": function (event, instance) {
    instance.invalidSampleLabels.set(null);
  },
});

Template.formValuesFilter.onCreated(function(){
  // Find forms that share samples with this data set
  // let them be options for which form to filter on
  let instance = this;

  instance.editing = new ReactiveVar(false);

  let dataset_id = instance.data.data_set_id ;
  instance.available_filter_forms = new ReactiveVar(); 
  instance.available_filter_forms.set([{name: "Loading forms...", urlencodedId: "placeholder_loadingforms"}]);
  instance.filter_forms_options = new ReactiveVar();
  instance.filter_forms_options.set({});

  instance.active_querybuilder = new ReactiveVar("");
  instance.active_crf = new ReactiveVar("");

  Meteor.call("getFormsMatchingDataSet", dataset_id, function(err, res){
    console.log("got matching forms...");
    if(err) {
      instance.available_filter_forms.set([{name:'Error loading forms!', urlencodedId: 'Errorloadingforms'}]);
      console.log("Error getting forms for this data set", err);
      throw err; 
    } else {
      console.log("got forms!", res);
      // put the res in the available forms so that we can get it later
      instance.filter_forms_options.set(res.formFields);
      instance.available_filter_forms.set(res);
    }
  });
});


Template.formValuesFilterMenu.onRendered(function(){
  let instance = this;
  instance.$(".ui.dropdown").dropdown();
});

Template.formValuesFilter.helpers({
  getFilterFormsOptions: function() {

  },
  getAvailableFilterForms: function() {
    return Template.instance().available_filter_forms.get();
  },
  getEditing: function(){
    return Template.instance().editing.get();
  },
});

Template.formValuesFilter.events({
  "click .chosen-form-filter": function(event, instance) {
    
    let whichFormId = event.target.id;
    console.log("looking for ", whichFormId); // XXX

    // then find it in filter_forms_options
    let forms = instance.available_filter_forms.get();
    console.log("got available forms", forms); // XXX
    let chosenForm = _.find(forms, function(form){ return form.urlencodedId === whichFormId});

    console.log("we chose you,", chosenForm); // XXX

    let formFields = chosenForm.fields ;
    
    // Then build the filters for the querybuilder
    let queryFilters = [];
    for(let field of formFields){
      console.log("adding to querybuilder", field); // XXX 
      // field will be object with keys
      // name, value_type, values
      queryFilters.push(
        { id: field.name,
          label: field.name,
          type: "string", // TODO use value_type
          input: "select",
          values: field.values,
          operators: ['equal', 'not_equal', 'is_null', 'is_not_null'],
        }
      );
    } 

  // Only show one querybuilder div at a time
  $(".querybuilder").hide()

  let queryBuilderDivId = "#" + whichFormId + "_querybuilder";
  $(queryBuilderDivId).show()
  $(queryBuilderDivId).queryBuilder({
    filters: queryFilters,
    });

  // And set it as active so we can find it later
  instance.active_querybuilder.set(queryBuilderDivId);
  instance.active_crf.set(whichFormId);
  },

  "click .done-editing": function(event, instance){
    event.preventDefault();

    let queryBuilderDivId = instance.active_querybuilder.get();

    let query = $(queryBuilderDivId).queryBuilder('getMongo');
    let serialized_query = JSON.stringify(query);
    let sampleCrfId = decodeURI(instance.active_crf.get());
     let dataset_id = instance.data.data_set_id;

    instance.editing.set(false);
   
    // Populate the filter info
    // TODO: refactor to use the ID from metadata of the overall CRF
    // rather than, as here, the id of a random sample record within the CRF
    instance.data.setOptions({
      form_id: sampleCrfId,
      mongo_query: serialized_query,
    });
   },
  "click .edit-filter": function(event, instance){
    event.preventDefault();
    instance.editing.set(true);
  },
});
