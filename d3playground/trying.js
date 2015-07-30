document.onreadystatechange = function () { // make sure DOM is there
  if (document.readyState == "complete") {

    // global
    theData = [
      { "value" : -1.7744098012610501 },
      { "value" : -1.6705581809928001 },
      { "value" : 2.6623082962344098 },
      { "value" : -1.6476762671330401 },
      { "value" : 1.0114257009251200 },
      { "value" : 1.0678517027376200 },
      { "value" : 1.2650415112903100 },
      { "value" : 1.2743693865129699 },
      { "value" : 1.5871087763828600 },
      { "value" : -1.7505284002926800 },
      { "value" : 1.4577334612151900 },
      { "value" : 1.6050278636699999 },
      { "value" : -2.8913726630471301 },
      { "value" : -1.6233030617667801 },
      { "value" : -0.1528211442994340 },
      { "value" : -0.5235682379853520 },
      { "value" : 2.2062445021918200 },
      { "value" : -1.7278073739486499 },
      { "value" : 0.9139695141176710 },
      { "value" : 1.1563566743741800 },
      { "value" : -0.1795374840136470 },
      { "value" : 1.4035756548655700 },
      { "value" : -0.7072126003137350 },
      { "value" : -1.1051198364307699 },
      { "value" : 1.1050058861587300 },
      { "value" : 0.8582584867733281 },
      { "value" : 1.4583681286347800 },
      { "value" : -1.5333506652788300 },
      { "value" : -0.4183321502461840 },
      { "value" : -0.4109940248811030 },
      { "value" : -0.5100077592230940 },
      { "value" : 1.4641444991154100 },
      { "value" : -2.5645405105842900 },
      { "value" : 0.6558117702446830 },
      { "value" : -0.7230604497771190 },
      { "value" : 0.6963312535882250 },
      { "value" : 0.5843530670292920 },
      { "value" : -2.8235471105289398 },
      { "value" : 1.9812505761924499 },
      { "value" : 1.5917811625286900 },
      { "value" : 2.5276651359715498 },
      { "value" : -2.5425697040367501 },
      { "value" : 0.1585427967965980 },
      { "value" : -1.4053394291923300 },
      { "value" : 1.5546428759201101 },
      { "value" : 1.8621734001728900 },
      { "value" : -0.1792437155070750 },
      { "value" : 0.8860802881148350 },
      { "value" : -1.6400219953537600 },
      { "value" : -2.1896467439921299 },
      { "value" : 0.7688794601192210 },
      { "value" : 0.6416002682141340 },

      { "value" : -9 },
      { "value" : 9 },

      { "value" : -6.1 },
      { "value" : -6.2 },

      //{ "value" : 6},
      { "value" : 6.1},
    ];

    var theContext = {
      "height": 60,
      "width": 200,
      "minimum_value": -10,
      "maximum_value": 10,
      "lower_threshold_value": -3,
      "higher_threshold_value": .6,
    }

    initChart(theData, theContext);
  }
};

function initChart(theData, context) {
  console.log('initChart function');

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

  var svg = d3.select("#the-chart-id")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //
  // helper and drawing helper functions
  //

  function attachAxis(axisHeight) {
    console.log("attachAxis function");

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("top") // the data is below
        .ticks(width / 35); // how many ticks there are

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + axisHeight + ")")
        .call(xAxis)
      .selectAll("text")
        .attr("y", -10) // where the text is in relation to the tick
        .attr("x", 0)
        .style("text-anchor", "middle");
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
  var boxHeight = 20;
  var boxMiddle = 20; // line drawn here

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

  console.log("firstQuartile - 1.5 * interquartileRange: ", firstQuartile - 1.5 * interquartileRange);
  console.log("thirdQuartile + 1.5 * interquartileRange: ", thirdQuartile + 1.5 * interquartileRange);

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

  // vertical whisker lines
  boxplot.data([leftWhiskerValue, rightWhiskerValue])
      .enter()
      .append("line")
      .attr("x1", xScale)
      .attr("x2", xScale)
      .attr("y1", boxMiddle - boxHeight / 2)
      .attr("y2", boxMiddle + boxHeight / 2)
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
}
