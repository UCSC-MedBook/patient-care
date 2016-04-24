// Tempalte.upDownGenesJob

Template.upDownGenesJob.onCreated(function () {
  const instance = this;

  // subscribe and keep up to date
  instance.autorun(function () {
    let { study_label, job_id } = Template.currentData();

    instance.subscribe("study", study_label);
    instance.subscribe("upDownGenesJob", job_id);
  });

  // combine study and patient within study
  instance.patient = new ReactiveVar(); // from the study's `patients` list
  instance.autorun(function () {
    let { study_label, patient_label } = Template.currentData();
    let study = Studies.findOne({ id: study_label });

    let patient;
    if (study) {
      patient = _.findWhere(study.patients, { patient_label });

      if (patient) {
        _.extend(patient, { study_label });
      }
    }
    instance.patient.set(patient);
  });
});

Template.upDownGenesJob.helpers({
  getJob: function () {
    return Jobs.findOne(Template.instance().data.job_id);
  },
  getPatient: function () {
    return Template.instance().patient.get();
  },
});



// Template.setOutlierAnalysisOptions

Template.setOutlierAnalysisOptions.onCreated(function () {
  const instance = this;

  instance.selectedSample = new ReactiveVar();
});

Template.setOutlierAnalysisOptions.onRendered(function () {
  const instance = this;

  instance.$('select.dropdown').dropdown();
});

Template.setOutlierAnalysisOptions.helpers({
  getStudy: function () {
    return Studies.findOne();
  },
  disabledIfNotReady: function () {
    if (!Template.instance().selectedSample.get()) {
      return "disabled";
    }
  },
});

Template.setOutlierAnalysisOptions.events({
  "change .select-sample": function (event, instance) {
    instance.selectedSample.set(event.target.value);
  },
  "click .submit-job": function (event, instance) {
    event.preventDefault();

    let options = _.pick(instance.data.patient, "study_label", "patient_label");
    _.extend(options, {
      sample_label: instance.selectedSample.get()
    });

    Meteor.call("startUpDownGenes", instance.data.job._id, options,
        (err, result) => {
      if (result) {
        FlowRouter.go("upDownGenes", {
          study_label: options.study_label,
          patient_label: options.patient_label,
          job_id: result,
        });
      }
    });
  },
});



// Template.outlierAnalysis

Template.outlierAnalysis.onCreated(function () {
  const instance = this;

  // subscribe to job blobs
  instance.autorun(function () {
    instance.subscribe("blob", Jobs.findOne().output.up_blob_id);
    instance.subscribe("blob", Jobs.findOne().output.down_blob_id);
  });
});

Template.outlierAnalysis.helpers({
  getBlobUrl: function (blobId) {
    return Blobs.findOne(blobId).url();
  },
});



// Template.outlierGenesTable

Template.outlierGenesTable.onCreated(function () {
  const instance = this;

  instance.filterText = new ReactiveVar("");
  instance.filteredData = new ReactiveVar([]);
  instance.pageIndex = new ReactiveVar(0);
  instance.maxPageIndex = new ReactiveVar(0);
  instance.currentPageData = new ReactiveVar([]);
  instance.rowsPerPage = new ReactiveVar(5);

  let unfilteredData = instance.data.data;
  let f = new Fuse(unfilteredData, {
    keys: [ "gene_label" ],
    threshold: 0.3
  });

  // filter data when filterText changes
  instance.autorun(function () {
    let filterText = Template.instance().filterText.get();

    let filtered = unfilteredData;
    if (filterText) {
      filtered = f.search(filterText);
    }

    instance.filteredData.set(filtered);
    instance.pageIndex.set(0); // reset to first page
  });

  // keep current page data up to date
  instance.autorun(function () {
    let pageIndex = instance.pageIndex.get();
    let rowCount = instance.rowsPerPage.get();

    let startData = rowCount * pageIndex;
    let pageData = instance.filteredData.get().slice(startData, startData + rowCount);

    instance.currentPageData.set(pageData);
  });

  // keep max page index up to date
  instance.autorun(function () {
    let filteredData = instance.filteredData.get();
    let rowsPerPage = instance.rowsPerPage.get();

    instance.maxPageIndex.set(Math.floor(filteredData.length / rowsPerPage));
  });
});

Template.outlierGenesTable.onRendered(function () {
  let instance = this;

  let clipboard = new Clipboard(instance.$('.copy-genes-to-clipboard')[0], {
    text: () => {
      return _.pluck(instance.data.data, "gene_label").join("\n");
    }
  });
  clipboard.on("success", (e) => {
    // TODO: switch to a tooltip
    instance.$(e.trigger).transition("jiggle", {
      duration: 250,
    });
  });
});

Template.outlierGenesTable.helpers({
  currentPageData: function () {
    return Template.instance().currentPageData.get();
  },
  pageNumber: function () { // not pageIndex
    return Template.instance().pageIndex.get() + 1;
  },
  maxPageNumber: function () { // not pageIndex
    return Template.instance().maxPageIndex.get() + 1;
  },
  totalRows: function () {
    return Template.instance().filteredData.get().length;
  },
  pagesToShow: function () {
    let instance = Template.instance();
    let pageIndex = instance.pageIndex.get();
    let maxPageIndex = instance.maxPageIndex.get();

    // hash so as not to have dupes
    let pages = {
      1: true,
      // 2: true,
      // [maxPageIndex]: true,
      [maxPageIndex + 1]: true,
      [pageIndex]: true,
      [pageIndex + 1]: true,
      [pageIndex + 2]: true,
    };
    let pageNumbers = _.map(Object.keys(pages), (numString) => {
      return parseInt(numString, 10);
    });
    pageNumbers.sort((a, b) => { return a - b }); // don't sort lexically

    // filter them...
    let filteredNumbers = _.filter(pageNumbers, (num) => {
      return num > 0 && num <= maxPageIndex + 1;
    });

    // add the "..."s in between
    let withEllipsis = [
      filteredNumbers[0]
    ];
    for (let i = 1; i < filteredNumbers.length; i++) { // starts at one
      let currentNumber = filteredNumbers[i];
      let previousNumber = filteredNumbers[i - 1];

      if (previousNumber + 1 !== currentNumber) {
        // if it goes 2 ... 4, just show the number
        if (previousNumber + 2 === currentNumber) {
          withEllipsis.push(currentNumber - 1);
        } else {
          withEllipsis.push("...");
        }
      }
      withEllipsis.push(currentNumber);
    }

    return withEllipsis;
  },
  fewDecimals: function (number) {
    return number.toFixed(2);
  },
});

Template.outlierGenesTable.events({
  "keyup .filter-text": function (event, instance) {
    instance.filterText.set(event.target.value);
  },
  "click .next-page": function (event, instance) {
    instance.pageIndex.set(instance.pageIndex.get() + 1);
  },
  "click .previous-page": function (event, instance) {
    instance.pageIndex.set(instance.pageIndex.get() - 1);
  },
  "click .go-to-page": function (event, instance) {
    if (this.valueOf() !== "...") {
      instance.pageIndex.set(this - 1);
    }
  },
  "change .results-per-page": function (event, instance) {
    let newValue = parseInt(event.target.value, 10);

    if (newValue) {
      instance.rowsPerPage.set(newValue);
    }
  },
});
