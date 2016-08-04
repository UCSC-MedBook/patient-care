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
      duration: 400,
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

// Template.geneWithInfo helper functions
// displays extra info next to a gene name

Template.geneWithInfo.helpers({
// return all info items where the gene is on that info's genes list.
  foundGeneInfos(gene){
    return _.filter(Template.instance().geneInfos, function(info){
      return (info.genes.indexOf(gene) !== -1);
    });
  },
});
Template.geneWithInfo.onRendered(function(){
  this.$(".tree.icon").popup({
    position: "bottom left",
    hoverable: true,
  });
});

// List of gene names with stanford pathology stains
// TODO : Don't hardcode this, but use a geneSet and add a 
// user.profile variable to control which geneSets genes are annotated
// by for each user.

// Current list -- August 4 - olena's edits
// still not the final version
// removed N/A and blank entries
Template.geneWithInfo.onCreated(function(){
  let stainGenesString = `
SERPINA1
POMC
AFP
KATNB1
SAA1
ANXA1
AR
ARG1
BAP1
CCND1
BCL6
EPCAM
APP
CTNNB1
POU2AF1
T
BRAF
PIP
C3
C4B
CA9
CALCA
CALD1
CNN1
CALB2
CD1A
CD2
CD4
CD5
CD7
CD8A
MME
CD14
FUT4
MS4A1
CR2
FCER2
IL2RA
TNFRSF8
PECAM1
CD33
CD34
CD34
CD38
SPN
PTPRC
CLTA
UCHL1
NCAM1
B3GAT1
ITGB3
CD68
CD79A
CD99
KIT
KIT
IL3RA
SDC1
CD163
CDX2
CEACAM5
CEACAM5
CHGA
CTRC
KRT5
KRT6
KRT7
KRT19
KRT20
KRT8
MYC
CXCL13
CCND2
CCND3
PDPN
TINP1
HCLG1
HUSSY-29
HUSSY29
CDK105
HCL-G1
DES
ANO1
CDH1
EGFR
MUC1
MUC1
GPER1
ERG
VWF
F13A1
FOXP1
FSHB
LGALS3
GAST
GATA3
GFAP
GH1
GCG
SLC2A1
GLUL
GPC3
GYPC
GZMB
CGB5
ERBB2
GCSAM
PMEL
IDH1
CD79A
IGHD
FCGBP
FCMR
INHA
SMARCB1
INS
MKI67
CD207
LAT
LEF1
LHB
LMO2
LYZ
MAP2
SLC16A1
MLANA
MITF
MLH1
MNDA
EPCAM
MPO
MSH2
MSH6
MUC2
MUC4
MUC5AC
MUM1
MYOD1
MYOG
NAPSA
RBFOX3
CD63
NKX3-1
NMP1
NUTM1
POU2F2
POU5F1
OLIG2
OXT
CDKN2A
TP53
CDKNIC
TP63
PAX2
PAX5
PAX8
PDCD1
PRF1
PHLDA1
PIN4
LNPEP
PMS2
PGR
PRAP1
PRL
PROX1
KLK3
S100P
SALL4
SDHB
SF1
SMN1
MYH11
SST
SOX10
SOX11
STAT6
SYP
UMOD
TCL1A
TRB
TRG
TDT
TDT
TG
TIA1
ACP5
TTR
TSHB
NKX2-1
TYR
VIM
WT1
WT1
ZAP70
`;

let geneFamilyString=`
ACTA1
ACTA2
ACTB
ACT1
ACTG1
ACTG2
BCL2
BCL2L1
BCL2L2
MCL1
BAX
BCL2A1
BAK1
BOK
BCL2L10
BCL2L12
BCL2L13
BCL2L14
BCL2L15
BNIP2
CD3D
CD3E
CD4G
KRT1
KRT5
KRT10
KRT14
KRT1
KRT2
KRT3
KRT4
KRT5
KRT6
KRT7
KRT8
KRT10
KRT14
KRT16
KRT19
FCGR1A
FCGR1B
FCGR1CP
FCGR2A
FCGR2B
FCGR3A
FCGR3B
NEFH
NEFL
NEFM
ENO1
ENO2
ENO3
S100A1
S100A2
S100A3
`;

  // prepare the lists - remove blank entries
  // This would be replaced by fetching the appropriate GeneSets
  let stainGenes = _.filter(stainGenesString.split("\n"), function(x){return x !== ""});
  let geneFamily = _.filter(geneFamilyString.split("\n"), function(x){return x !== ""});

  // set up the available lists with icons and descriptions

  this.geneInfos = [
    {
      genes: stainGenes,
      description: "Stanford pathology stain available",
      color: "black",
    },
    {
      genes: geneFamily,
      description: "Stanford pathology stain available for this gene family",
      color: "grey",
    },
  ] 
});
