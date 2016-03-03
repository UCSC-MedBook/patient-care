// who would ever put inline css in the database?

function saveTheText(offendingString, beginLength, endLength) {
  var firstCut = offendingString
      //.replace(/\n|\r/g, "")
      .slice(beginLength);
  return firstCut.substr(0, firstCut.length - endLength);
}

Template.drugSensitivity.helpers({
	geneLabelAndVariant: function () {
		return this.gene_label + "/" + this.variant;
	},
	isDrug: function() {
		if (this.drug == "N/A" || this.drug === undefined) {
			return false
		};
		return true;
	}
});

Template.showTreatment.helpers({
  trimTedsDomElementInMongo: function (theEvidence) {
    var firstPart;
    if (theEvidence.includes("Prior")) {
      firstPart = "<div style='width:300px;'><a href='/CRF/prad_wcdt/SU2C_Prior_TX_V3/?q=DTB-055'>";
    } else {
      firstPart = "<div style='width:300px;'><a href='/CRF/prad_wcdt/SU2C_Subsequent_Treatment_V1/?q=DTB-055'>";
    }
    var secondPart = "</a></div>";

    return saveTheText(theEvidence, firstPart.length, secondPart.length);
  },
});

Template.cohortSignatures.onCreated(function () {
  var instance = this;
  instance.chartType = new ReactiveVar("waterfall");
});

Template.cohortSignatures.events({
  "click #change-chart-type": function (event, instance) {
    console.log("instance: ", instance);
    if (instance.chartType.get() === "waterfall") {
      instance.chartType.set("boxAndWhisker");
    } else {
      instance.chartType.set("waterfall");
    }
  }
});

// Template.mutations

Template.mutations.onCreated(function () {
  var instance = this;

  var samples = _.pluck(instance.data.samples, "sample_label");
  instance.subscribe("mutations", samples);
});

Template.mutations.helpers({
  getMutations: function () {
    return Mutations.find({});
  },
});
