// Template.editRecords

Template.editRecords.onCreated(function () {
  let instance = this;

  instance.formsSub = instance.subscribe("forms");
  instance.dataSetsSub = instance.subscribe("dataSets");
  instance.recordsSub = new ReactiveVar(null);

  instance.form_id = new ReactiveVar("aWE55DDBdwsCWYmJD");
  instance.data_set_id = new ReactiveVar("54795e11b089fea9740779e4");

  instance.autorun(() => {
    let form_id = instance.form_id.get();
    let data_set_id = instance.data_set_id.get();

    if (form_id && data_set_id) {
      let sub = instance.subscribe("records", form_id, data_set_id);
      instance.recordsSub.set(sub);
    } else {
      instance.recordsSub.set(null);
    }
  });
});

Template.editRecords.onRendered(function () {
  let instance = this;

  instance.$(".data-set.dropdown").dropdown({
    onChange(value) { instance.data_set_id.set(value); },
  });
  instance.$(".forms.dropdown").dropdown({
    onChange(value) { instance.form_id.set(value); },
  });
});

Template.editRecords.helpers({
  formsLoaded() { return Template.instance().formsSub.ready(); },
  dataSetsLoaded() { return Template.instance().dataSetsSub.ready(); },
  recordsSub() { return Template.instance().recordsSub.get(); },
  getForms() { return Forms.find({}); },
  getDataSets() { return DataSets.find({}); },
  getDataSetId() { return Template.instance().data_set_id.get(); },
  getFormId() { return Template.instance().form_id.get(); },
});



// Template.handsOnTable

Template.handsOnTable.onRendered(function () {
  let instance = this;

  let form = Forms.findOne(instance.data.form_id);
  let records = Records.find().fetch();

  // always need patient
  let colHeaders = ["Patient"];
  let columns = [{ data: "patient_label", readOnly: true }];
  let dataSchema = { _id: null, patient_label: null, fields: {} };

  // sometimes need sample
  if (form.specificity === "sample") {
    colHeaders.push("Sample");
    columns.push({ data: "sample_label", readOnly: true });
    dataSchema.sample_label = null;
  }

  // add columns for each of the fields in the form
  _.each(form.fields, (field) => {
    colHeaders.push(field.label);
    columns.push({ data: "values." + field.label });
    dataSchema.fields[field.label] = null;
  });

  hot = new Handsontable(instance.$("#recordsHandsOnTable")[0], {
    data: records,
    dataSchema,
    startRows: 5,
    startCols: 4,
    colHeaders,
    columns,
    minSpareRows: 1
  });
  console.log("hot.getDataAtRowProp(0, '_id'):", hot.getDataAtRowProp(0, '_id'));
  console.log("hot:", hot);

  // listen to changes in the data and make updates as needed
  instance.changesObserve = Forms.find({}).observeChanges({
    changed(_id, fields) {
      console.log("_id, fields:", _id, fields);
    }
  });

  console.log("done");
});
