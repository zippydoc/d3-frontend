// https://observablehq.com/@d3/stacked-bar-chart@840
import define1 from "./a33468b95d0b15b0@808.js";
import define2 from "./7a9e12f9fb3d8e06@459.js";

function _1(md){return(
md`# Stacked Bar Chart

This chart shows the estimated population by age and U.S. state. Compare to [horizontal stacked bars](/@d3/stacked-horizontal-bar-chart), [normalized stacked bars](/@d3/stacked-normalized-horizontal-bar), [grouped bars](https://observablehq.com/@d3/grouped-bar-chart) and a [dot plot](/@d3/dot-plot). Data: [American Community Survey](/@mbostock/working-with-the-census-api)`
)}

function _key(Legend,chart){return(
Legend(chart.scales.color, {title: "Age (years)"})
)}

function _chart(StackedBarChart,stateages,d3,ages,width){return(
StackedBarChart(stateages, {
  x: d => d.state,
  y: d => d.population / 1e6,
  z: d => d.age,
  xDomain: d3.groupSort(stateages, D => d3.sum(D, d => -d.population), d => d.state),
  yLabel: "Y axis",
  zDomain: ages,
  colors: d3.schemeSpectral[ages.length],
  width,
  height: 500
})
)}

function _states(FileAttachment){return(
FileAttachment("us-population-state-age.csv").csv({typed: true})
)}

// function _ages(states){return(
// states.columns.slice(1)
// )}
function _ages(states){return(
  Object.keys(states[0])
  )}

function _stateages(ages,states){return(
ages.flatMap(age => states.map(d => ({state: d.name, age, population: d[age]})))
)}

function _7(howto){return(
howto("StackedBarChart")
)}

function _8(altplot){return(
altplot(`Plot.plot({
  width,
  y: {tickFormat: "s"},
  color: {scheme: "spectral", domain: ages},
  marks: [
    Plot.barY(stateages, {
      x: "state",
      y: "population",
      fill: "age",
      sort: {x: "y", reverse: true}
    }),
    Plot.ruleY([0])
  ]
})`)
)}

function _StackedBarChart(d3){return(
function StackedBarChart(data, {
  x = (d, i) => i, // given d in data, returns the (ordinal) x-value
  y = d => d, // given d in data, returns the (quantitative) y-value
  z = () => 1, // given d in data, returns the (categorical) z-value
  title, // given d in data, returns the title text
  marginTop = 30, // top margin, in pixels
  marginRight = 0, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  xDomain, // array of x-values
  xRange = [marginLeft, width - marginRight], // [left, right]
  xPadding = 0.1, // amount of x-range to reserve to separate bars
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom, marginTop], // [bottom, top]
  zDomain, // array of z-values
  offset = d3.stackOffsetDiverging, // stack offset method
  order = d3.stackOrderNone, // stack order method
  yFormat, // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
  colors = d3.schemeTableau10, // array of colors
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const Z = d3.map(data, z);

  // Compute default x- and z-domains, and unique them.
  if (xDomain === undefined) xDomain = X;
  if (zDomain === undefined) zDomain = Z;
  xDomain = new d3.InternSet(xDomain);
  zDomain = new d3.InternSet(zDomain);

  // Omit any data not present in the x- and z-domains.
  const I = d3.range(X.length).filter(i => xDomain.has(X[i]) && zDomain.has(Z[i]));

  // Compute a nested array of series where each series is [[y1, y2], [y1, y2],
  // [y1, y2], …] representing the y-extent of each stacked rect. In addition,
  // each tuple has an i (index) property so that we can refer back to the
  // original data point (data[i]). This code assumes that there is only one
  // data point for a given unique x- and z-value.
  const series = d3.stack()
      .keys(zDomain)
      .value(([x, I], z) => Y[I.get(z)])
      .order(order)
      .offset(offset)
    (d3.rollup(I, ([i]) => i, i => X[i], i => Z[i]))
    .map(s => s.map(d => Object.assign(d, {i: d.data[1].get(s.key)})));

  // Compute the default y-domain. Note: diverging stacks can be negative.
  if (yDomain === undefined) yDomain = d3.extent(series.flat(2));

  // Construct scales, axes, and formats.
  const xScale = d3.scaleBand(xDomain, xRange).paddingInner(xPadding);
  const yScale = yType(yDomain, yRange);
  const color = d3.scaleOrdinal(zDomain, colors);
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);

  // Compute titles.
  if (title === undefined) {
    const formatValue = yScale.tickFormat(100, yFormat);
    title = i => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
  } else {
    const O = d3.map(data, d => d);
    const T = title;
    title = i => T(O[i], i, data);
  }

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(yLabel));

  const bar = svg.append("g")
    .selectAll("g")
    .data(series)
    .join("g")
      .attr("fill", ([{i}]) => color(Z[i]))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
      .attr("x", ({i}) => xScale(X[i]))
      .attr("y", ([y1, y2]) => Math.min(yScale(y1), yScale(y2)))
      .attr("height", ([y1, y2]) => Math.abs(yScale(y1) - yScale(y2)))
      .attr("width", xScale.bandwidth());

  if (title) bar.append("title")
      .text(({i}) => title(i));

  svg.append("g")
      .attr("transform", `translate(0,${yScale(0)})`)
      .call(xAxis);

  return Object.assign(svg.node(), {scales: {color}});
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  // function toString() { return this.url; }
  // const fileAttachments = new Map([
  //   ["us-population-state-age.csv", {url: new URL("./files/cacf3b872e296fd3cf25b9b8762dc0c3aa1863857ecba3f23e8da269c584a4cea9db2b5d390b103c7b386586a1104ce33e17eee81b5cc04ee86929f1ee599bfe", import.meta.url), mimeType: null, toString}]
  // ]);
  // main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("key")).define("key", ["Legend","chart"], _key);
  main.variable(observer("chart")).define("chart", ["StackedBarChart","stateages","d3","ages","width"], _chart);
  // main.variable(observer("states")).define("states", ["FileAttachment"], _states);
  main.variable(observer("ages")).define("ages", ["data"], _ages);
  main.variable(observer("stateages")).define("stateages", ["ages","data"], _stateages);
  main.variable(observer()).define(["howto"], _7);
  main.variable(observer()).define(["altplot"], _8);
  main.variable(observer("StackedBarChart")).define("StackedBarChart", ["d3"], _StackedBarChart);
  const child1 = runtime.module(define1);
  main.import("Legend", child1);
  main.import("Swatches", child1);
  const child2 = runtime.module(define2);
  main.import("howto", child2);
  main.import("altplot", child2);
  return main;
}
