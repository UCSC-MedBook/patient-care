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
});



// Template.outlierGenesTable

Template.outlierGenesTable.onCreated(function () {
  const instance = this;

  // subscribe to the gene set that was generated
  instance.associatedObj = {
    collection_name: "Jobs",
    mongo_id: FlowRouter.getParam("job_id"),
  };
  instance.subscribe("associatedObjectGeneSet", instance.associatedObj, {
    outlier_type: instance.data.outlierType
  });

  // a bunch of instance variables for the table
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

  // search with Fuse.js
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

  // set up the clipboard copy button
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
  "click .run-gsea"(event, instance) {
    let { mongo_id, collection_name } = instance.associatedObj;

    // find the gene set;
    let geneSet = GeneSets.findOne({
      "associated_object.mongo_id": mongo_id,
      "associated_object.collection_name": collection_name,
      "metadata.outlier_type": instance.data.outlierType,
    });

    // pass the gene set to the modal via a query
    FlowRouter.setQueryParams({
      "geneSetIdForGsea": geneSet._id
    });
  },
});

// Template.geneWithInfo

Template.geneWithInfo.onRendered(function(){
  this.$(".geneInfoIcon.icon").popup({
    position: "bottom left",
    hoverable: true,
  });
});

// Template.gseaFromGeneSetModal

// This modal depends on the geneSetIdForGsea query parameter.

Template.gseaFromGeneSetModal.onRendered(function () {
  let instance = this;

  instance.$(".gsea-from-gene-set.modal").modal({
    // remove geneSetIdForGsea from the query parameters when it is closed
    onHide() {
      // Defer setting the query parameters. When a user navigates away from
      // the page with the modal open (viewing a job, for example), the
      // query parameter is cleared before the route changes. This means
      // that when the user hits the back button, the query parameter won't
      // exist and the modal won't open automatically. Deferring waits
      // to clear the query param until the route has changed, which solves
      // this bug.
      Meteor.defer(() => {
        FlowRouter.setQueryParams({
          geneSetIdForGsea: null
        });
      });
    },
    observeChanges: true,
  });

  // show the modal when the query param is set
  instance.autorun(() => {
    let geneSetId = FlowRouter.getQueryParam("geneSetIdForGsea");

    if (geneSetId) {
      $(".gsea-from-gene-set.modal").modal("show");
    } else {
      $(".gsea-from-gene-set.modal").modal("hide");
    }
  });
});

Template.gseaFromGeneSetModal.helpers({
  query() {
    let geneSetId = FlowRouter.getQueryParam("geneSetIdForGsea");

    return {
      "args.gene_set_id": geneSetId,
      "args.gene_set_name": GeneSets.findOne(geneSetId).name,
    };
  },
  getGeneSet() {
    let geneSetId = FlowRouter.getQueryParam("geneSetIdForGsea");

    if (geneSetId) {
      return GeneSets.findOne(geneSetId);
    }
  },
});
