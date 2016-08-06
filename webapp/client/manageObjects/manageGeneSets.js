// Template.createGeneSet

Template.createGeneSet.onCreated(function () {
  let instance = this;

  instance.computedColumns = new ReactiveVar([
    {
      header: "Genes",
      value_type: "String",

      // NOTE: I probably shouldn't hardcode this, but it works for now.
      // These values will only be used if they immediately click the
      // create button without making any changes.
      values: [ "MYC", "P53", "BRCA1" ],
    }
  ]);
  instance.ignoringColumns = new ReactiveVar([]);
  instance.warnBlankNumbersZero = new ReactiveVar(false);
});

Template.createGeneSet.onRendered(function () {
  let instance = this;

  // get the div which we're going to attach the table to
  let container = instance.$("#createGeneSetData")[0];

  // define this here so we can use it in the afterChange callback
  let handsOnTable;

  // create the table
  handsOnTable = new Handsontable(container, {
    data: [ [ "Genes" ], [ "MYC" ], [ "P53" ], [ "BRCA1" ] ],
    colHeaders: true,
    rowHeaders: true,
    minSpareCols: 1,
    minSpareRows: 1,
    minRows: 5,
    afterChange(changesArray, changeType) {
      // NOTE: This is run every time anything changes. This could be a
      // problem if the table is really big.

      // if it hasn't been initialized the first time, don't do anything
      if (!handsOnTable) { return; }

      // calculate the columns that would be created
      let data = handsOnTable.getData();
      let titlesAndData = [];

      // fill up titlesAndData like this: { header, values }
      _.each(data, (row, rowIndex) => {
        // if the whole row is empty, ignore it
        let isEmpty = _.every(row, (str) => { return !str; });
        if (isEmpty) { return; }

        _.each(row, (cellValue, colIndex) => {
          if (rowIndex === 0) {
            // fill in the header if it's the first row
            titlesAndData.push({
              header: cellValue,
              values: []
            });
          } else {
            // add to the values array if it's not the first row
            titlesAndData[colIndex].values.push(cellValue);
          }
        });
      });

      // figure out the value_type for each column and remove ignored columns
      let computedColumns = [];
      let ignoringColumns = [];

      _.each(titlesAndData, (singleColumn, index) => {
        let { header, values } = singleColumn;

        // if there's no header or the column is empty, ignore it
        let emptyColumn = _.every(values, (str) => {
          return !str;
        });
        if (!singleColumn.header || emptyColumn) {
          // if there's something in one but not the other, show it
          // NOTE: ^ is the XOR operator

          if (!singleColumn.header ^ emptyColumn) {
            ignoringColumns.push(handsOnTable.getColHeader(index));
          }

          return;
        }

        // figure out the value types
        let notNumeric = _.some(values, (cellValue) => {
          return cellValue && isNaN(cellValue);
        });

        // force the first "Genes" column to be String
        let value_type;
        if (notNumeric || index === 0) {
          value_type = "String";
        } else {
          value_type = "Number";
        }

        computedColumns.push({ header, value_type, values });
      });

      instance.computedColumns.set(computedColumns);
      instance.ignoringColumns.set(ignoringColumns);
    },
  });

  // make the "Genes" title in the first column readonly
  handsOnTable.updateSettings({
    cells: function (row, col, prop) {
      if (row === 0 && col === 0) {
        return { readOnly: true };
      }

      return {};
    }
  });
});

Template.createGeneSet.helpers({
  nameAndDescription() {
    return GeneSets.simpleSchema().pick([
      "name",
      "description",
    ]);
  },
  warnBlankNumbersZero() {
    return _.some(Template.instance().computedColumns.get(), (column) => {
      let falseyValues = _.some(column.values, (value) => { return !value });

      return column.value_type === "Number" && falseyValues;
    });
  },
  computedColumns() { return Template.instance().computedColumns.get(); }
});

Template.createGeneSet.events({
  "click .create.button"(event, instance) {
    let isValid = AutoForm.validateForm("createGeneSet");
    if (!isValid) { return; }

    let formValues = AutoForm.getFormValues("createGeneSet").insertDoc;
    let computedColumns = instance.computedColumns.get();

    Meteor.call("insertGeneSet", formValues, computedColumns,
        (error, selected) => {
      if (error) {
        throw error;
      } else {
        FlowRouter.setParams({ selected });
      }
    });
  },
});
