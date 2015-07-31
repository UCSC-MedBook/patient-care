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

Template.renderBoxAndWhisker.helpers({
  removeSpaces: removeSpaces,
});

Template.renderBoxAndWhisker.rendered = function () {
  // must have the data ready to be called :)

  var data = this.data;

  initChart(data['sample_values'], {
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
  });
};

function initChart(theData, context) {
  // console.log('initChart function');

  //
  // set up variables, default values
  //

  var margin;
  if (context.margin === undefined) {
    margin = {};
  } else {
    margin = context.margin;
  }
  _.defaults(margin, {top: 0, right: 8, bottom: 0, left: 8});

  // note: context must have height and width
  var width = context.width - margin.left - margin.right;
  var height = context.height - margin.top - margin.bottom;

  // make sure the data are sorted (for pulling min/max values)
  theData = theData.sort(function (a, b) {
    return a.value - b.value;
  });

  // pull min/max from context if possible
  var minimumValue = context.minimum_value
      || theData[theData.length - 1].value;
  var maximumValue = context.maximum_value
      || theData[0].value;

  var xScale = d3.scale.linear() // converts data values to pixel values
      .domain([minimumValue, maximumValue])
      .range([0, width]);

  //console.log("context.dom_selector: ", context.dom_selector);
  var svg = d3.select("#" + context.dom_selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //
  // helper and drawing helper functions
  //

  function attachAxis(axisHeight) {
    // console.log("attachAxis function");

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("top") // the data is below
        .ticks(width / 35); // how many ticks there are

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + axisHeight + ")")
        .call(xAxis)
      .selectAll("text")
        .attr("y", -12.5) // where the text is in relation to the tick
        .attr("x", 0);
        //.style("text-anchor", "middle");
  }

  function valueAtPercent(array, percent) {
    // percent = [0, 1]
    // valueAtPercent([1, 2, 3, 4, 5], .25) ==> 2
    // valueAtPercent([1, 2, 3, 4, 5], .20) ==> 1.8
    var index = (array.length - 1) * percent;
    if (index === Math.floor(index)) { // return immidiately if int
      return array[index].value;
    }

    var lowerIndex = Math.floor(index);
    var higherIndex = Math.ceil(index);
    var distanceToLower = index - lowerIndex;
    var distanceToHigher = higherIndex - index;

    return array[lowerIndex].value * distanceToHigher
        + array[higherIndex].value * distanceToLower;
  }

  function getSurroundingIndexes(array, needleValue) {
    // https://github.com/Olical/binary-search/blob/master/src/binarySearch.js
    var min = 0;
    var max = array.length - 1;
    var guess;

    while (min <= max) {
      guess = Math.floor((min + max) / 2);

      if (array[guess].value === needleValue) {
        return [guess, guess];
      } else {
        if (array[guess].value < needleValue) {
          min = guess + 1;
        } else {
          max = guess - 1;
        }
      }
    }

    if (min === 0) {
      return [min, min];
    }
    if (max === array.length - 1) {
      return [max, max];
    }

    // there are outliers
    if (array[min].value < needleValue) {
      return [min, min + 1];
    } else {
      return [min - 1, min];
    }
  }

  // what it looks like
  var axisHeight = 20;
  var boxHeight = 10;
  var boxMiddle = 10; // line drawn here

  //
  // start drawing things
  //

  attachAxis(axisHeight);

  var boxplot = svg.append("g")
      .attr("class", "boxplot")
      .attr("transform", "translate(0," + axisHeight + ")")
      .selectAll("bleh") // doesn't work without this (no selection)

  var firstQuartile = valueAtPercent(theData, .25);
  var secondQuartile = valueAtPercent(theData, .5);
  var thirdQuartile = valueAtPercent(theData, .75);
  var interquartileRange = thirdQuartile - firstQuartile;

  var leftWhiskerValue = theData[
        getSurroundingIndexes(theData , firstQuartile
            - 1.5 * interquartileRange)[1]
      ].value;
  var rightWhiskerValue = theData[
        getSurroundingIndexes(theData , thirdQuartile
            + 1.5 * interquartileRange)[0]
      ].value;

  function significanceClass(firstValue, secondValue) {
    var value = (firstValue + secondValue) / 2;

    if (value < context.lower_threshold_value
        || value > context.higher_threshold_value) {
      return "outside-threshold";
    }
    return "inside-threshold";
  }

  function positionVerticalLine(selection) {
    selection
        .attr("y1", boxMiddle - boxHeight / 2)
        .attr("y2", boxMiddle + boxHeight / 2);
  }

  // vertical whisker lines
  boxplot.data([leftWhiskerValue, rightWhiskerValue])
      .enter()
      .append("line")
      .attr("x1", xScale)
      .attr("x2", xScale)
      .call(positionVerticalLine)
      .attr("class", function (value, index) {
        return significanceClass(value, value);
      });

  // horizontal lines
  function drawLine(firstValue, secondValue) {
    if (firstValue < secondValue) {
      boxplot.data([0]).enter()
          .append("line")
          .attr("x1", xScale(firstValue))
          .attr("x2", xScale(secondValue))
          .attr("y1", boxMiddle)
          .attr("y2", boxMiddle)
          .attr("class", significanceClass(firstValue, secondValue));
    }
  }
  drawLine(leftWhiskerValue, context.lower_threshold_value); // left
  drawLine(Math.max(context.lower_threshold_value, leftWhiskerValue)
      , Math.min(context.higher_threshold_value, rightWhiskerValue)); // middle
  drawLine(context.higher_threshold_value, rightWhiskerValue); // right

  // boxes
  function drawBox(firstValue, secondValue) {
    if (firstValue < secondValue) {
      boxplot.data([0]).enter()
          .append("rect")
          .attr("x", xScale(firstValue))
          .attr("y", boxMiddle - boxHeight / 2)
          .attr("height", boxHeight)
          .attr("width", xScale(secondValue) - xScale(firstValue))
          .attr("class", significanceClass(firstValue, secondValue));
    }
  }
  drawBox(firstQuartile, context.lower_threshold_value); // left blue
  drawBox(Math.max(context.lower_threshold_value, firstQuartile)
      , Math.min(context.higher_threshold_value, thirdQuartile)); // grey
  drawBox(context.higher_threshold_value, thirdQuartile); // right blue

  // outliers
  boxplot.data(_.filter(theData, function (current) {
        return current.value < leftWhiskerValue
            || current.value > rightWhiskerValue;
      }))
      .enter()
      .append("circle")
      .attr("cx", function (object, index) {
        return xScale(object.value);
      })
      .attr("cy", boxMiddle)
      .attr("r", 2)
      .attr("class", function (object, index) {
        return significanceClass(object.value, object.value);
      });

  // label samples
  var highlightedSamples = boxplot.data(_.filter(theData, function (current) {
        return context.highlighted_sample_labels.indexOf(current.sample_label) > -1;
      }))
      .enter()
      .append("g")
      .attr("transform", function (object, index) {
        return "translate(" + xScale(object.value) + ", 0)";
      })
      .attr("class", "highlighted-sample");

  highlightedSamples.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .call(positionVerticalLine);

  highlightedSamples.append("text")
      .text(function (object, index) {
        var label = object.sample_label
        // ECMAScript 2015!!!
        if (label.includes("Pro") && label.length === "DTB-001Pro".length) {
          return "Pro";
        } else if (label.length === "DTB-001".length) {
          return "BL";
        }
        return object.sample_label;
      })
      .attr("y", boxHeight + 15);
}
