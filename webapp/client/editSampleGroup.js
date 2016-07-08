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
  instance.noActiveFormValuesFilter = new ReactiveVar(true);
});

Template.addFilterButton.onRendered(function () {
  let instance = this;

  instance.$(".dropdown").popup({
    hoverable: true,
    on: "click",
  });
});

Template.addFilterButton.helpers({
  getNoActiveFormValuesFilter: function(){
    return Template.instance().noActiveFormValuesFilter.get();
  },
});

Template.addFilterButton.events({
  "click .add-form-values-filter": function (event, instance) {
    instance.addFilter({
      type: "form_values",
      options : {
        sample_labels: []
      },
    });
    instance.noActiveFormValuesFilter.set(false)
    // TODO : if this filter is removed the only way to re-add is to
    // remove and re-add the data set.
  },
  "click .add-sample-label-list-filter": function (event, instance) {
    instance.addFilter({
      type: "sample_label_list",
      options: {
        sample_labels: []
      },
    });
  },
  "click .add-exclude-sample-label-list-filter": function (event, instance) {
    instance.addFilter({
      type: "exclude_sample_label_list",
      options: {
        sample_labels: []
      },
    });
  },
  "click .add-data-loaded-filter": function (event, instance) {
    instance.addFilter({
      type: "data_loaded",
      options: {
        gene_expression: false,
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
    return this.options.sample_labels.join("\n");
  },
  getInvalidSampleLabels: function () {
    console.log("Template.instance().invalidSampleLabels.get():", Template.instance().invalidSampleLabels.get());
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

    // let's gooo (split by whitespace characters, get rid of spaces)
    let textareaSampleLabels = instance.$("textarea").val().split(/[\s,;]+/);
    let sample_labels = _.chain(textareaSampleLabels)
      .filter((value) => { return value; }) // remove falsey
      .uniq() // uniques only
      .value();

    // make sure we don't have any bad values
    let dataSet = DataSets.findOne(instance.data.data_set_id);
    let badValues = _.difference(sample_labels, dataSet.sample_labels);

    if (badValues.length) {
      instance.invalidSampleLabels.set(badValues);
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



// Template.dataLoadedFilter

Template.dataLoadedFilter.onRendered(function () {
  let instance = this;

  $geneExpression = instance.$(".gene-expression.checkbox");

  $geneExpression.checkbox({
    onChecked: () => {
      instance.data.setOptions({ gene_expression: true });
    },
    onUnchecked: () => {
      instance.data.setOptions({ gene_expression: false });
    },
  });

  // check if it's checked
  if (instance.data.options.gene_expression) {
    $geneExpression.checkbox("check");
  }
});

Template.formValuesFilter.onCreated(function(){
  // Find forms that share samples with this data set
  // let them be options for which form to filter on
  let instance = this;

  instance.editing = new ReactiveVar(false);

  let dataset_id = instance.data.data_set_id ;
  instance.available_filter_forms = new ReactiveVar(); 
  instance.available_filter_forms.set([{name: 'Loading forms...', urlencodedId: 'Loadingforms...'}]);
  instance.filter_forms_options = new ReactiveVar();
  instance.filter_forms_options.set({});

  instance.active_querybuilder = new ReactiveVar("");
  instance.active_crf = new ReactiveVar("");

  Meteor.call("getFormsMatchingDataSet", dataset_id, function(err, res){
    if(err) {
      instance.available_filter_forms.set([{name:'Error loading forms!', urlencodedId: 'Errorloadingforms!'}]);
      console.log("Error getting forms for this data set", err);
      throw err; 
    } else {
      // put the res in the available forms so that we can get it later
      instance.filter_forms_options.set(res.formFields);
      instance.available_filter_forms.set(res.formIds);
    }
  });
});

Template.formValuesFilter.helpers({
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

    // then find it in filter_forms_options
    let formFields = instance.filter_forms_options.get()[whichFormId];

    // Then build the filters for the querybuilder
    let queryFilters = [];
    for(field in formFields){
      let fieldOptions = formFields[field];
      queryFilters.push(
        { id: field,
          label: field,
          type: "string",
          input: "select",
          values: fieldOptions,
          operators: ['equal', 'not_equal', 'is_null', 'is_not_null'],
        }
      );
    } 
  let queryBuilderDivId = "#" + whichFormId + "_querybuilder";
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
    let sampleCrfId = decodeURI(instance.active_crf.get());
     let dataset_id = instance.data.data_set_id;

    instance.editing.set(false);
    
    // Call a MeteorMethod to return the list of samples that match.
     Meteor.call("getSamplesFromFormFilter",  dataset_id, query, sampleCrfId, function(err, res){
      if(err){
        console.log("Error getting samples from form filter:", err);
        throw err;
      }else{ 
        console.log("got sample list", res);
      }
    });

   },
  "click .edit-filter": function(event, instance){
    event.preventDefault();
    instance.editing.set(true);
  },


});
