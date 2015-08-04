// all of the charts with the same type will have the same scale
var typeChartLimits = {};
var typeChartLimitsDep = new Deps.Dependency;
var getTypeChartMinimum = function (typeName) {
  typeChartLimitsDep.depend();
  return typeChartLimits[typeName].minimum;
};
var getTypeChartMaximum = function (typeName) {
  typeChartLimitsDep.depend();
  return typeChartLimits[typeName].maximum;
};
var setTypeChartLimits = function (typeName, cohortSignatures) {
  var minimum;
  var maximum;

  for (var i = 0; i < cohortSignatures.length; i++) {
    var sample_values = cohortSignatures[i].sample_values;

    if (minimum === undefined || sample_values[0].value < minimum) {
      minimum = sample_values[0].value;
    }
    if (maximum === undefined
        || sample_values[sample_values.length - 1].value > maximum) {
      maximum = sample_values[sample_values.length - 1].value;
    }
  }

  if (typeChartLimits[typeName] === undefined) {
    typeChartLimits[typeName] = {};
  }
  typeChartLimits[typeName].minimum = minimum;
  typeChartLimits[typeName].maximum = maximum;

  typeChartLimitsDep.changed();
};

Template.cohortSignaturesTypeBox.helpers({
  hasSignaturesOfType: function (typeName) {
    return cohortSignaturesOfType(typeName).count() > 0;
  },
  getSignaturesOfType: function (typeName) {
    var array = topCohortSignaturesOfType(typeName);
    setTypeChartLimits(typeName, array);
    return array;
  },
  upcaseFirst: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
});

function removeSpaces(string) {
  // used to create html id from "Adeno vs nonAdeno"
  return string.split(' ').join('_');
}

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
      "minimum_value": getTypeChartMinimum(data.type),
      "maximum_value": getTypeChartMaximum(data.type),
      //"lower_threshold_value": -1.5,//data.lower_threshold_value,
      //"upper_threshold_value": 1.5,//data.upper_threshold_value,
      "dom_selector": data.type + data.algorithm +
          removeSpaces(data.label),
      "highlighted_sample_labels": getPatientSampleLabels(),
      "show_axis": true,
      "show_axis_labels": true,
    };

    // remove previous chart
    $("#" + context.dom_selector).empty();

    Charts.render(data.sample_values, context);
  });
};
