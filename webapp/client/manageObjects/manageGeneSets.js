// Template.createGeneSet

Template.createGeneSet.onCreated(function () {
  let instance = this;

  instance.computedColumns = new ReactiveVar([
    {
      header: "Genes",
      value_type: "String",
      values: [ "MYC", "P53", "BRCA1" ],
    },
    {
      header: "Rank",
      value_type: "Number",
      values: [ "1", "2", "3" ],
    },
    {
      header: "Description",
      value_type: "String",
      values: [
        "transcription factor",
        "tumor suppressor",
        "maintains genomic stability",
      ],
    },
  ]);

  instance.ignoringColumns = new ReactiveVar([]);
  instance.warnBlankNumbersZero = new ReactiveVar(false);
});

Template.createGeneSet.onRendered(function () {
  let instance = this;

  // get the div which we're going to attach the table to
  let container = instance.$("#handsOnTable")[0];

  // Pull the data from the computedColumns original data.
  // This will only happen once and after that computedColumns will
  // change according to what's in the Handsontable.
  // This is just so we can define some starting data in only one place
  // because I can't figure out a clean way of running the afterChange
  // after initializing the Handsontable.
  let computedColumns = instance.computedColumns.get();
  let valuesLength = computedColumns[0].values.length;

  // start with the header row
  let data = [ _.pluck(computedColumns, "header") ];

  // add the values
  _.each(computedColumns, (column, colIndex) => {
    _.each(column.values, (value, rowIndex) => {
      // add the row if it doesn't exist
      if (colIndex === 0) { data.push([]); }

      // the data array has an extra row for the headers
      data[rowIndex + 1].push(value);
    });
  });

  // create the table
  instance.handsOnTable = new Handsontable(container, {
    data,
    colHeaders: true,
    rowHeaders: true,
    minSpareCols: 1,
    minSpareRows: 1,
    minRows: 5,
    afterChange(changesArray, changeType) {
      // NOTE: This is run every time anything changes. This could be a
      // problem if the table is really big.

      // if it hasn't been initialized the first time, don't do anything
      if (!instance.handsOnTable) { return; }

      // calculate the columns that would be created
      let data = instance.handsOnTable.getData();

      // will be populated with objects like this: { header, values }
      let titlesAndData = [];

      // first, loop through row-wise
      _.each(data, (row, rowIndex) => {
        // if the whole row is empty, ignore it
        let isEmpty = _.every(row, (str) => { return !str; });
        if (isEmpty && rowIndex !== 0) { return; }

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
      // this will hold stuff like: { header, value_type, values }
      let computedColumns = [];

      // this holds the Handsontable columns: "A", "B"
      let ignoringColumns = [];

      // next, loop through column-wise
      _.each(titlesAndData, (singleColumn, index) => {
        let { header, values } = singleColumn;

        // if there's no header OR the column is empty: ignore it
        let emptyColumn = _.every(values, (str) => {
          return !str;
        });
        if (!singleColumn.header || emptyColumn) {
          // if there's something in one but not the other, show it
          // NOTE: ^ is the XOR operator
          if (!singleColumn.header ^ emptyColumn) {
            ignoringColumns.push(instance.handsOnTable.getColHeader(index));
          }

          return;
        }

        // figure out the value types
        let notNumeric = _.some(values, (cellValue) => {
          return cellValue && isNaN(cellValue);
        });

        // force the first "Genes" column to be String
        let value_type;
        if (notNumeric) {
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
});

Template.createGeneSet.helpers({
  nameAndDescription() {
    return GeneSets.simpleSchema().pick([
      "name",
      "description",
    ]);
  },
  geneLabeFieldSchema() {
    return GeneSets.simpleSchema().pick([
      "gene_label_field"
    ]);
  },
  possibleGeneLabelFields() {
    let computedColumns = Template.instance().computedColumns.get();
    let stringFields = _.filter(computedColumns, (column) => {
      if (column.value_type !== "String") { return false; }

      // make sure there's no whitespace or blank values
      let noWhitespaceOrBlank = !_.some(column.values, (value) => {
        return /\s/.test(value) || !value;
      });

      // make sure values are unique
      let uniqueValues = _.uniq(column.values).length === column.values.length;

      return noWhitespaceOrBlank && uniqueValues;
    });
    let labels = _.pluck(stringFields, "header");

    return labels.map((label) => {
      return { label, value: label };
    });
  },
  warnBlankNumbersZero() {
    return _.some(Template.instance().computedColumns.get(), (column) => {
      let falseyValues = _.some(column.values, (value) => { return !value });

      return column.value_type === "Number" && falseyValues;
    });
  },
  computedColumns() { return Template.instance().computedColumns.get(); },
  fieldNamesValid() {
    var computedColumns = Template.instance().computedColumns.get();

    var uniqueNames = _.uniq(_.pluck(computedColumns, "header"));

    return uniqueNames.length === computedColumns.length &&
        uniqueNames.indexOf("_id") === -1 &&
        uniqueNames.indexOf("associated_object") === -1;
  },
  genesFieldPopupOptions() {
    return {
      popup: $(".ui.popup.gene-set-field-rules"),
    };
  },
});

Template.createGeneSet.events({
  "submit #nameAndDescription"(event, instance) {
    // stop this form from refreshing the page if a user presses ENTER
    // while filling out one of the fields
    event.preventDefault();
  },
  "click .create.button"(event, instance) {
    // make sure the forms are valid
    let nameDescValid = AutoForm.validateForm("nameAndDescription");
    let geneLabelValid = AutoForm.validateForm("geneLabelField");
    if (!nameDescValid || !geneLabelValid) { return; }

    // calculate formValues: a combination of the two forms
    let nameAndDescValues = AutoForm.getFormValues("nameAndDescription");
    let geneLabelFieldValues = AutoForm.getFormValues("geneLabelField");
    let formValues = _.extend(nameAndDescValues.insertDoc, {
      gene_label_field: geneLabelFieldValues.insertDoc.gene_label_field
    });

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
  "click .clear.button"(event, instance) {
    instance.handsOnTable.clear();
  },
});

// Template.geneLabelFieldWithPopup

Template.geneLabelFieldWithPopup.onRendered(function () {
  let instance = this;

  instance.$("label.rules-popup").popup({
    popup: instance.$(".ui.popup.gene-set-field-rules"),
  });
});
