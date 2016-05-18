// Template.editRecords

Template.editRecords.onCreated(function () {
  let instance = this;

  instance.formsSub = instance.subscribe("forms");
  instance.dataSetsSub = instance.subscribe("dataSets");
  instance.recordsSub = new ReactiveVar(null);

  instance.form_id = new ReactiveVar("zFu5qhFxzsMzWeWLH");
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

  var hotElement = instance.$("#recordsHandsOnTable")[0];

  // let form = Forms.findOne(instance.data.form_id);

  // let dataObject = Records.find().fetch();



  // let columns = [];
  // let colHeaders = [];
  // // let addColumn = (header, columnDefinition) => {
  // //   colHeaders.push(header);
  // //   columns.push(columnDefinition);
  // // };
  //
  // addColumn("Patient", { data: "patient_label", type: "text", readOnly: true });
  // if (form.specificity === "sample") {
  //   addColumn("Sample", { data: "sample_label", type: "text", readOnly: true });
  // }
  //
  // // now for the rest of the columns...
  // _.each(form.fields, (field) => {
  //   // set up default...
  //   let colDef = {
  //     data: "values." + field.label,
  //     type: "text",
  //   };
  //
  //   if (field.type === "Date") {
  //     _.extend(colDef, {
  //       type: "date",
  //       dateFormat: "MM/DD/YYYY",
  //     });
  //   }
  //   if (field.type === "Select") {
  //     _.extend(colDef, {
  //       type: "autocomplete",
  //       source: field.allowedValues,
  //       strict: true,
  //     });
  //   }
  //
  //   // console.log("field, colDef:", field, colDef);
  //   addColumn(field.label, colDef);
  // });

  // var hotElementContainer = hotElement.parentNode;
  // var hotSettings = {
  //   data: dataObject,
  //   columns,
  //   colHeaders,
  //   stretchH: 'all',
  //   width: 700,
  //   height: 441,
  //   manualColumnResize: true,
  //   afterChange(change, source) {
  //     // do nothing on data load
  //     if (source === "loadData") return;
  //     console.log("change, source:", change, source);
  //   },
  // };
  //
  // var hot = new Handsontable(hotElement, hotSettings);
  //


//   var dataObject = [
//     {id: 1, flag: 'EUR', currencyCode: 'EUR', currency: 'Euro',	level: 0.9033, units: 'EUR / USD', asOf: '08/19/2015', onedChng: 0.0026},
//     {id: 2, flag: 'JPY', currencyCode: 'JPY', currency: 'Japanese Yen', level: 124.3870, units: 'JPY / USD', asOf: '08/19/2015', onedChng: 0.0001},
//     {id: 3, flag: 'GBP', currencyCode: 'GBP', currency: 'Pound Sterling', level: 0.6396, units: 'GBP / USD', asOf: '08/19/2015', onedChng: 0.00},
//     {id: 4, flag: 'CHF', currencyCode: 'CHF', currency: 'Swiss Franc',	level: 0.9775, units: 'CHF / USD', asOf: '08/19/2015', onedChng: 0.0008},
//     {id: 5, flag: 'CAD', currencyCode: 'CAD', currency: 'Canadian Dollar',	level: 1.3097, units: 'CAD / USD', asOf: '08/19/2015', onedChng: -0.0005},
//     {id: 6, flag: 'AUD', currencyCode: 'AUD', currency: 'Australian Dollar',	level: 1.3589, units: 'AUD / USD', asOf: '08/19/2015', onedChng: 0.0020},
//     {id: 7, flag: 'NZD', currencyCode: 'NZD', currency: 'New Zealand Dollar',	level: 1.5218, units: 'NZD / USD', asOf: '08/19/2015', onedChng: -0.0036},
//     {id: 8, flag: 'SEK', currencyCode: 'SEK', currency: 'Swedish Krona',	level: 8.5280, units: 'SEK / USD', asOf: '08/19/2015', onedChng: 0.0016},
//     {id: 9, flag: 'NOK', currencyCode: 'NOK', currency: 'Norwegian Krone',	level: 8.2433, units: 'NOK / USD', asOf: '08/19/2015', onedChng: 0.0008},
//     {id: 10, flag: 'BRL', currencyCode: 'BRL', currency: 'Brazilian Real',	level: 3.4806, units: 'BRL / USD', asOf: '08/19/2015', onedChng: -0.0009},
//     {id: 11, flag: 'CNY', currencyCode: 'CNY', currency: 'Chinese Yuan',	level: 6.3961, units: 'CNY / USD', asOf: '08/19/2015', onedChng: 0.0004},
//     {id: 12, flag: 'RUB', currencyCode: 'RUB', currency: 'Russian Rouble',	level: 65.5980, units: 'RUB / USD', asOf: '08/19/2015', onedChng: 0.0059},
//     {id: 13, flag: 'INR', currencyCode: 'INR', currency: 'Indian Rupee',	level: 65.3724, units: 'INR / USD', asOf: '08/19/2015', onedChng: 0.0026},
//     {id: 14, flag: 'TRY', currencyCode: 'TRY', currency: 'New Turkish Lira',	level: 2.8689, units: 'TRY / USD', asOf: '08/19/2015', onedChng: 0.0092},
//     {id: 15, flag: 'THB', currencyCode: 'THB', currency: 'Thai Baht',	level: 35.5029, units: 'THB / USD', asOf: '08/19/2015', onedChng: 0.0044},
//     {id: 16, flag: 'IDR', currencyCode: 'IDR', currency: 'Indonesian Rupiah',	level: 13.83, units: 'IDR / USD', asOf: '08/19/2015', onedChng: -0.0009},
//     {id: 17, flag: 'MYR', currencyCode: 'MYR', currency: 'Malaysian Ringgit',	level: 4.0949, units: 'MYR / USD', asOf: '08/19/2015', onedChng: 0.0010},
//     {id: 18, flag: 'MXN', currencyCode: 'MXN', currency: 'Mexican New Peso',	level: 16.4309, units: 'MXN / USD', asOf: '08/19/2015', onedChng: 0.0017},
//     {id: 19, flag: 'ARS', currencyCode: 'ARS', currency: 'Argentinian Peso',	level: 9.2534, units: 'ARS / USD', asOf: '08/19/2015', onedChng: 0.0011},
//     {id: 20, flag: 'DKK', currencyCode: 'DKK', currency: 'Danish Krone',	level: 6.7417, units: 'DKK / USD', asOf: '08/19/2015', onedChng: 0.0025},
//     {id: 21, flag: 'ILS', currencyCode: 'ILS', currency: 'Israeli New Sheqel',	level: 3.8262, units: 'ILS / USD', asOf: '08/19/2015', onedChng: 0.0084},
//     {id: 22, flag: 'PHP', currencyCode: 'PHP', currency: 'Philippine Peso',	level: 46.3108, units: 'PHP / USD', asOf: '08/19/2015', onedChng: 0.0012}
//   ];
//   var currencyCodes = ['EUR', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'BRL', 'CNY', 'RUB', 'INR', 'TRY', 'THB', 'IDR', 'MYR', 'MXN', 'ARS', 'DKK', 'ILS', 'PHP'];
//   var flagRenderer = function(instance, td, row, col, prop, value, cellProperties) {
//     var currencyCode = value;
//
//     while (td.firstChild) {
//       td.removeChild(td.firstChild);
//     }
//
//     if (currencyCodes.indexOf(currencyCode) > -1) {
//       var flagElement = document.createElement('DIV');
//       flagElement.className = 'flag ' + currencyCode.toLowerCase();
//       td.appendChild(flagElement);
//
//     } else {
//       var textNode = document.createTextNode(value === null ? '' : value);
//       td.appendChild(textNode);
//     }
//   };
//
//   var hotElement = document.querySelector('#recordsHandsOnTable');
//   var hotElementContainer = hotElement.parentNode;
//   var hotSettings = {
//     data: [
//       model({id: 1, name: 'Ted Right', address: ''}),
//       model({id: 2, name: 'Frank Honest', address: ''}),
//       model({id: 3, name: 'Joan Well', address: ''}),
//       model({id: 4, name: 'Gail Polite', address: ''}),
//       model({id: 5, name: 'Michael Fair', address: ''})
//     ],
//     dataSchema: model,
//     colHeaders: ['ID', 'Name', 'Address'],
//     columns: [
//       {data: property('id'), type: "numeric"},
//       {data: property('name')},
//       {data: property('address')}
//     ],
//     minSpareRows: 1,
//     stretchH: 'all',
//     width: 806,
//     autoWrapRow: true,
//     height: 441,
//     maxRows: 22,
//     rowHeaders: true,
//     filters: true,
//     // dropdownMenu: true,
//     dropdownMenu: [
//       "undo", "redo", "clear_column",
//       'filter_by_condition',
//       'filter_action_bar',
//     ],
// };
//
//   function model(opts) {
//     var
//       _pub = {},
//       _priv = {
//         "id": undefined,
//         "name": undefined,
//         "address": undefined
//       };
//
//     for (var i in opts) {
//       if (opts.hasOwnProperty(i)) {
//         _priv[i] = opts[i];
//       }
//     }
//
//     _pub.attr = function (attr, val) {
//       if (typeof val === 'undefined') {
//         // window.console && console.log("\t\tGET the", attr, "value of", _pub);
//         return _priv[attr];
//       }
//       // window.console && console.log("SET the", attr, "value of", _pub);
//       console.log("_priv, attr, val:", _priv, attr, val);
//       _priv[attr] = val;
//
//       return _pub;
//     };
//
//     return _pub;
//   }
//
//   function property(attr) {
//     return function (row, value) {
//       return row.attr(attr, value);
//     }
//   }

  var
    hiddenData = [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
      ['2012', 10, 11, 12, 13, 15, 16],
      ['2013', 10, 11, 12, 13, 15, 16],
      ['2014', 10, 11, 12, 13, 15, 16],
      ['2015', 10, 11, 12, 13, 15, 16],
      ['2016', 10, 11, 12, 13, 15, 16]
    ],
    container = document.getElementById('example2'),
    hot2;

  hot = new Handsontable(hotElement, {
    data: hiddenData,
    colHeaders: true,
    minSpareRows: 1,
    columns: [
      {data: 0},
      {data: 2},
      {data: 3},
      {data: 4},
      {data: 5},
      {data: 6}
    ]
  });

  // var hot = new Handsontable(hotElement, hotSettings);

  // hot.updateSettings({
  //   cells: function (row, col, prop) {
  //     // console.log("row, col, prop:", row, col, prop);
  //     var cellProperties = {};
  //
  //     if (hot.getData()[row][prop] === 'Nissan') {
  //       cellProperties.readOnly = true;
  //     }
  //
  //     return cellProperties;
  //   }
  // });
  console.log("hot:", hot);







  // listen to changes in the data and make updates as needed
  instance.changesObserve = Forms.find({}).observeChanges({
    changed(_id, fields) {
      console.log("id, fields:", id, fields);
    }
  });



  console.log("done");
});
