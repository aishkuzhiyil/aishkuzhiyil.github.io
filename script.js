// Dimensions
const width = 750;
const height = 400;
const margin = { top: 40, right: 40, bottom: 50, left: 70 };

const svg = d3
  .select("#visualization")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const annotationDiv = d3.select("#annotation");

let data;
let currentScene = 0;

// Load data
d3.csv("data.csv").then(rawData => {
  rawData.forEach(d => {
    d.Year = +d.Year;
    d.Value = +d.Value;
  });

  // Filter data to a few countries for clarity
  const countriesOfInterest = ["USA", "CHN", "IND", "BRA", "ZAF"];
  data = rawData.filter(
    d => countriesOfInterest.includes(d["Country Code"]) && d["Indicator Code"] === "SP.DYN.LE00.IN"
  );

  // Nest data by country for easier plotting
  dataByCountry = d3.group(data, d => d["Country Code"]);

  // Sort years
  years = Array.from(new Set(data.map(d => d.Year))).sort();

  setupButtons();
  renderScene();
});

function setupButtons() {
  d3.select("#prev").on("click", () => {
    if (currentScene > 0) {
      currentScene--;
      renderScene();
    }
  });

  d3.select("#next").on("click", () => {
    if (currentScene < 2) {
      currentScene++;
      renderScene();
    }
  });
}

function renderScene() {
  svg.selectAll("*").remove(); // Clear svg
  annotationDiv.text(""); // Clear annotation

  // Update buttons enabled/disabled
  d3.select("#prev").attr("disabled", currentScene === 0 ? true : null);
  d3.select("#next").attr("disabled", currentScene === 2 ? true : null);

  switch (currentScene) {
    case 0:
      sceneOverview();
      break;
    case 1:
      sceneHighlightCountry("USA");
      break;
    case 2:
      sceneCompareCountries(["USA", "IND", "BRA"]);
      break;
  }
}

// Scene 0: Overview all countries
function sceneOverview() {
  annotationDiv.text(
    "Overview: Life expectancy trends over years for 5 countries: USA, China, India, Brazil, South Africa."
  );

  // Scales
  const x = d3
    .scaleLinear()
    .domain(d3.extent(years))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([50, d3.max(data, d => d.Value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  // Line generator
  const line = d3
    .line()
    .x(d => x(d.Year))
    .y(d => y(d.Value));

  // Draw lines for each country
  dataByCountry.forEach((values, key) => {
    svg
      .append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", countryColor(key))
      .attr("stroke-width", 2)
      .attr("d", line);

    // Label the last point of each line
    const last = values[values.length - 1];
    svg
      .append("text")
      .attr("x", x(last.Year) + 5)
      .attr("y", y(last.Value))
      .attr("fill", countryColor(key))
      .attr("font-size", "12px")
      .text(key);
  });

  // Axis labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Year");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Life Expectancy (years)");
}

// Scene 1: Highlight USA
function sceneHighlightCountry(countryCode) {
  annotationDiv.text(
    `Highlight: Life expectancy in the USA steadily increased from about 69 years in 1970 to over 78 years in 2020.`
  );

  const countryData = dataByCountry.get(countryCode);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(years))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([d3.min(countryData, d => d.Value) - 2, d3.max(countryData, d => d.Value) + 2])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  const line = d3
    .line()
    .x(d => x(d.Year))
    .y(d => y(d.Value));

  svg
    .append("path")
    .datum(countryData)
    .attr("fill", "none")
    .attr("stroke", countryColor(countryCode))
    .attr("stroke-width", 3)
    .attr("d", line);

  // Add points with tooltip info
  svg
    .selectAll("circle")
    .data(countryData)
    .join("circle")
    .attr("cx", d => x(d.Year))
    .attr("cy", d => y(d.Value))
    .attr("r", 4)
    .attr("fill", countryColor(countryCode))
    .append("title")
    .text(d => `${d.Year}: ${d.Value.toFixed(2)} years`);

  // Axis labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Year");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-weight");
}
