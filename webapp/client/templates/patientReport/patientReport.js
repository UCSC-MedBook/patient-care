function removeSpaces(string) {
  // used to create html id from "Adeno vs nonAdeno"
  return string.split(' ').join('_')
}

function signaturesOfType(typeName) {
  // NOTE: filtered by publication (metadata ones will show)
  return CohortSignatures.find({"type": typeName});
}

Template.signaturesOfType.helpers({
  hasSignaturesOfType: function (typeName) {
    return signaturesOfType(typeName).count() > 0;
  },
  getSignaturesOfType: signaturesOfType,
  upcaseFirst: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
});

Template.renderChart.helpers({
  removeSpaces: removeSpaces,
});

Session.setDefault("chartToRender", "waterfall");

Template.renderChart.rendered = function () {
  // must have the data ready to be called :)

  var data = this.data;

  // TODO: use update function instead of removing it using jQuery
  this.autorun(function (first) {
    // maybe split context into two variables:
    // one specific to that chart type, one specific to that chart
    var context = {
      "chart_type": Session.get("chartToRender"),
      "height": Session.get("chartToRender") === "waterfall" ? 100 : 50,
      "width": 150,
      "minimum_value": -10,
      "maximum_value": 10,
      //"lower_threshold_value": -1.5,//data.lower_threshold_value,
      //"upper_threshold_value": 1.5,//data.upper_threshold_value,
      "dom_selector": data.type + data.algorithm
          + removeSpaces(data.label),
      "highlighted_sample_labels":
          _.pluck(Template.parentData(3).samples, "sample_label"),
      "show_axis": true,
      "show_axis_labels": true,
    };

    // remove previous chart
    $("#" + context.dom_selector).empty();

    Charts.render(data['sample_values'], context);
  });
};

// who would ever put inline css in the database?

function saveTheText(offendingString, beginLength, endLength) {
  var firstCut = offendingString
      //.replace(/\n|\r/g, "")
      .slice(beginLength);
  return firstCut.substr(0, firstCut.length - endLength);
}

Template.showTreatment.helpers({
  trimTedsDomElementInMongo: function (theEvidence) {
    var firstPart;
    if (theEvidence.includes("Prior")) {
      firstPart = "<div style='width:300px;'><a href='/CRF/lists/SU2C_Prior_TX_V3/7snEyTx8m2hzSWzJn/'>";
    } else {
      firstPart = "<div style='width:300px;'><a href='/CRF/lists/SU2C_Subsequent_Treatment_V1/Toa2hxBxyZshCMtNS/'>";
    }
    var secondPart = "</a></div>";

    return saveTheText(theEvidence, firstPart.length, secondPart.length);
  },
});
