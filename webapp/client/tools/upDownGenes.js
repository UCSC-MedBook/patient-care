// Template.outlierAnalysis

Template.outlierAnalysis.onCreated(function () {
  const instance = this;

  // subscribe to job blobs
  instance.autorun(function () {
    instance.subscribe("blob", Jobs.findOne().output.up_blob_id);
    instance.subscribe("blob", Jobs.findOne().output.down_blob_id);
    instance.subscribe("sampleGroups");
  });
});

Template.outlierAnalysis.helpers({
  getBlobUrl: function (blobId, blobFileName) {
    // polyfill for blobs or blobs2
    // since existing outlier results might be using either
    // If it's an original blob, ignore the filename; otherwise
    // use it and the job ID to get the blob2 route.
    let isItABlob = Blobs.findOne(blobId);
    if(isItABlob){
      return isItABlob.url();
    }else {
      let userId = Meteor.userId();
      let loginToken = Accounts._storedLoginToken();
      let jobId = FlowRouter.getParam("job_id");
      return `/download/${userId}/${loginToken}/job-blob/${jobId}/${blobFileName}`;
    }
  },
  // Get version of a sample group visible to this user
  getSampleGroupVersion(sampleGroupId){
    let sg = SampleGroups.findOne(sampleGroupId);
    let version = "";
    if(sg){ version = sg.version; }
    return version;
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
  instance.geneInfos = new ReactiveVar([]);
  instance.gotGeneInfosVar = new ReactiveVar(false);

  // Get the lists of genes which have icons/tooltips
  // so they can be added to the gene names column
  // The result of the call may correctly be an empty array, so don't i
  // rely on that; instead separately note when it's been completed.
  Meteor.call("getGeneInfos", (error, result) => {
    if(error) {
      console.log("Couldn't get geneInfos:", error);
      // Show the genelist, just omitting stain info.
      instance.gotGeneInfosVar.set(true);
    }
    if (result){
      instance.geneInfos.set(result) ;
      instance.gotGeneInfosVar.set(true);
    };
  });

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
      duration: 400,
    });
  });
});

Template.outlierGenesTable.helpers({

  // Tracking the meteor method for gene icon info completion
  gotGeneInfos: function(){
    return Template.instance().gotGeneInfosVar.get();
  },

  // given a gene label, return all icons that should be applied to it
  getInfoForGene: function(gene){
    return _.filter(Template.instance().geneInfos.get(), function(info){
      return (info.genes.indexOf(gene) !== -1);
    });
  },
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


Template.geneWithInfo.onRendered(function(){
  this.$(".geneInfoIcon.icon").popup({
    position: "bottom left",
    hoverable: true,
  });
});
