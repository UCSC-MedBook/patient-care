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

Session.setDefault("chartToRender", "waterfall");

Template.renderChart.rendered = function () {
  // must have the data ready to be called :)

  var data = this.data;

  // maybe split context into two variables:
  // one specific to that chart type, one specific to that chart
  var context = {
    "chart_type": Session.get("chartToRender"),
    "height": 50,
    "width": 250,
    "minimum_value": -10,
    "maximum_value": 10,
    "lower_threshold_value": -2.5,//data.lower_threshold_value,
    "upper_threshold_value": 2,//data.upper_threshold_value,
    "dom_selector": data.type + data.algorithm
        + removeSpaces(data.label),
    "highlighted_sample_labels":
        _.pluck(Template.parentData(3).samples, "sample_label"),
    "show_axis": true,
    "show_axis_labels": true,
  };

  Charts.render(data['sample_values'], context);

};
