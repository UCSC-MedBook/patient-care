function removeSpaces(string) {
  // used to create html id from "Adeno vs nonAdeno"
  return string.split(' ').join('_')
}

Template.signaturesOfType.helpers({
  getSignaturesOfType: function (typeName) {
    //console.log("typeName: ", typeName);
    return CohortSignatures.find({"type": typeName});
  },
  upcaseFirst: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

});

Template.renderChart.helpers({
  removeSpaces: removeSpaces,
});

Session.setDefault("chartToRender", "boxAndWhisker");

Template.renderChart.rendered = function () {
  // must have the data ready to be called :)

  var data = this.data;

  // maybe split context into two variables:
  // one specific to that chart type, one specific to that chart
  var context = {
    "chart_type": Session.get("chartToRender"),
    "height": 60,
    "width": 200,
    "minimum_value": -10,
    "maximum_value": 10,
    "lower_threshold_value": -3,
    "higher_threshold_value": .6,
    "dom_selector": data.type + data.algorithm
        + removeSpaces(data.label),
    "highlighted_sample_labels":
        _.pluck(Template.parentData(3).samples, "sample_label"),

  };

  Charts.render(data['sample_values'], context);

};
