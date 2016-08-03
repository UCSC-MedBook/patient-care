// Template.viewFormRecords

Template.viewFormRecords.onCreated(function () {
  let instance = this;

  let formId = FlowRouter.getParam("form_id");
  instance.subscribe("objectFromCollection", "Forms", formId);

  instance.gettingRecordsData = new ReactiveVar(true);
  instance.recordsData = [];
  Meteor.call("getFormRecords", formId, (error, result) => {
    if (error) { throw error; }
    else {
      instance.recordsData = result;
      instance.gettingRecordsData.set(false);
    }
  });
});

Template.viewFormRecords.helpers({
  getForm() {
    return Forms.findOne(FlowRouter.getParam("form_id"));
  },
  gettingRecordsData() {
    return Template.instance().gettingRecordsData.get();
  },
  recordsData() {
    return Template.instance().recordsData;
  },
});

// Template.recordsHandsOnTable

Template.recordsHandsOnTable.onRendered(function () {
  let instance = this;
  let { form, recordsData } = instance.data;

  // calculate the spreadsheet columns
  // always have the sample label field be first
  let columns = [ { data: form.sample_label_field } ];
  let colHeaders = [ form.sample_label_field ];

  _.each(form.fields, (field) => {
    if (field.name !== form.sample_label_field) {
      columns.push({ data: field.name });
      colHeaders.push(field.name);
    }
  });

  var container = document.getElementById('recordsHOT');
  var hot = new Handsontable(container, {
    data: recordsData,
    startRows: form.fields.length,
    startCols: recordsData.length,
    columns,
    colHeaders,
  });
});
