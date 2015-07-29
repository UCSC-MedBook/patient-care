
var theData = [
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
  { "value" : 0.6416002682141340 }
];

theContext = {
  "height": 20,
  "width": 200,
  "minimum_value": -3,
  "maximum_value": 3,
}

document.onreadystatechange = function () { // make sure DOM is there
  if (document.readyState == "complete") {
    initChart();
  }
};

function initChart() {
  console.log("initChart function");

  // make sure context has height, width
  if (!theContext) {
    console.log("Cannot render boxplot: context missing");
  } else if (!theContext.height || !theContext.width) {
    console.log("Cannot render boxplot: context missing height and/or width");
  }

  // make sure the data are sorted
  theData = theData.sort(function (a, b) {
    return b.value - a.value;
  })

  // also assume
  var minimumValue = theContext.minimum_value
                      || theData[theData.length - 1].value;
  var maximumValue = theContext.maximum_value
                      || theData[0].value;

  // getting started
  var svg = d3.select("#the-axis-id")
      .append("svg")
      .attr("width", theContext.width)
      .attr("height", theContext.height)
      .selectAll("bleh"); // I have to do this to get it to work

  var xScale = d3.scale.linear() // x-axis scale
                        .domain([maximumValue, minimumValue])
                        .range([1, theContext.width - 1]);

  // numbers on the axis
  var axisNumbers = xScale.ticks(5); // mind blown

  console.log("axisNumbers ::");
  console.log(axisNumbers);

  svg.data([0]).enter() // is there a better way to do this...
      .append("line")
      .attr("class", "axis")
      .attr("x1", xScale(minimumValue))
      .attr("x2", xScale(maximumValue))
      .attr("y1", theContext.height - 1)
      .attr("y2", theContext.height - 1);

  svg.data(axisNumbers).enter()
      .append("line")
      .attr("class", "axis")
      .attr("y1", theContext.height - 6).attr("y2", theContext.height - 1)
      .attr("x1", xScale)
      .attr("x2", xScale);

  svg.data(leftAxisNumbers).enter()
      .append("text")
      .text(function (dataValue) { return dataValue })
      .attr("class", "anchor-middle")
      .attr("dominant-baseline", "central") // centered vertically around (x, y)
      .attr("x", LEFT_AXIS_WIDTH - 15)
      .attr("y", valuesToPixel);


}
