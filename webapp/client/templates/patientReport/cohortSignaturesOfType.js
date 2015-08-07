Template.cohortSignaturesTypeBox.onCreated(function () {

  var instance = this;
  var typeName = instance.data;

  instance.loaded = new ReactiveVar(0);
  instance.limit = new ReactiveVar(5);
  instance.chartMaximum = new ReactiveVar(10);
  instance.chartMinimum = new ReactiveVar(-10);
  instance.sampleLabels = new ReactiveVar(
      _.pluck(Template.parentData(1).samples, "sample_label")
  );

  instance.getCohortSignatures = function() {
    return CohortSignatures.find({
          "type": typeName,
          "samples": {
            $elemMatch: {
              sample_label: {
                $in: instance.sampleLabels.get()
              }
            }
          }
        }, {
      "sort": { "rank": -1 }
        });
  };

  instance.autorun(function () {
    var limit = instance.limit.get();

    instance.subscribe('topCohortSignatures',
        typeName, limit, instance.sampleLabels.get(),
        function () { // callback
          // set chart min/max
          var minimum;
          var maximum;

          var list = instance.getCohortSignatures().fetch();
          for (var index in list) {
            var samples = list[index].samples;

            if (minimum === undefined || samples[0].value < minimum) {
              minimum = samples[0].value;
            }
            if (maximum === undefined ||
                samples[samples.length - 1].value > maximum) {
              maximum = samples[samples.length - 1].value;
            }
          }

          instance.chartMaximum.set(maximum);
          instance.chartMinimum.set(minimum);

          instance.loaded.set(limit);
        }
    );
  });
});

Template.cohortSignaturesTypeBox.helpers({
  getCohortSignatures: function () {
    return Template.instance().getCohortSignatures();
  },
  upcaseFirst: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  hasMoreSignatures: function () {
    var instance = Template.instance();
    return instance.getCohortSignatures().count() >= instance.limit.get();
  },
  hasAnySignatures: function() {
    return Template.instance().getCohortSignatures().count() > 0;
  },
});

Template.cohortSignaturesTypeBox.events({
  'click .load-more': function (event, instance) {
    event.preventDefault();
    instance.limit.set(instance.limit.get() + 5);
  }
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
  var instance = this;

  // reactive variables for drawing chart
  cohortSignatureInstance = instance.parentTemplate(2);
  var chartMaximum = cohortSignatureInstance.chartMaximum;
  var chartMinimum = cohortSignatureInstance.chartMinimum;
  var sampleLabels = cohortSignatureInstance.sampleLabels;

  // TODO: use update function instead of removing it using jQuery
  this.autorun(function (first) {
    // maybe split context into two variables:
    // one specific to that chart type, one specific to that chart
    var context = {
      "chart_type": Session.get("chartToRender"),
      "height": Session.get("chartToRender") === "waterfall" ? 100 : 50,
      "width": 150,
      "minimum_value": chartMinimum.get(),
      "maximum_value": chartMaximum.get(),
      //"lower_threshold_value": -1.5,//data.lower_threshold_value,
      //"upper_threshold_value": 1.5,//data.upper_threshold_value,
      "dom_selector": data.type + data.algorithm +
          removeSpaces(data.label),
      "highlighted_sample_labels": sampleLabels.get(),
      "show_axis": true,
      "show_axis_labels": true,
    };

    // remove previous chart
    $("#" + context.dom_selector).empty();

    Charts.render(data.samples, context);
  });
};
