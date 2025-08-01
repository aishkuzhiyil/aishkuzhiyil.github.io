let currentScene = 0;
let data;

// Chart dimensions
const width = 700, height = 400, margin = {top: 40, right: 40, bottom: 40, left: 60};

// Load data
d3.csv("data.csv", d3.autoType).then(csvData => {
    data = csvData;
    setupScenes();
    renderScene();
});

// Scenes text
const sceneTexts = [
    "Scene 1: Global average life expectancy from 1960 to 2020.",
    "Scene 2: Life expectancy trend in Aruba from 1960 to 2020.",
    "Scene 3: Choose any country to view its life expectancy trend."
];

// Scene buttons
d3.select("#prevBtn").on("click", () => {
    if (currentScene > 0) currentScene--;
    renderScene();
});
d3.select("#nextBtn").on("click", () => {
    if (currentScene < 2) currentScene++;
    renderScene();
});

// Setup dropdown
function setupScenes() {
    const uniqueCountries = Array.from(new Set(data.map(d => d["Country Names"])));
    const select = d3.select("#countrySelect");
    uniqueCountries.forEach(c => {
        select.append("option").text(c).attr("value", c);
    });
    select.on("change", renderScene);
}

function renderScene() {
    d3.select("#scene-text").text(sceneTexts[currentScene]);
    d3.select("#country-select-container").style("display", currentScene === 2 ? "block" : "none");

    let filteredData;

    if (currentScene === 0) {
        // Compute global average
        const grouped = d3.rollups(
            data,
            v => d3.mean(v, d => d.Value),
            d => d.Year
        );
        filteredData = grouped.map(([year, value]) => ({Year: year, Value: value}));
    }
    else if (currentScene === 1) {
        filteredData = data.filter(d => d["Country Names"] === "Aruba");
    }
    else {
        const country = d3.select("#countrySelect").property("value");
        filteredData = data.filter(d => d["Country Names"] === country);
    }

    drawLineChart(filteredData);
}

function drawLineChart(filteredData) {
    d3.select("#chart").html("");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([d3.min(filteredData, d => d.Value) - 2, d3.max(filteredData, d => d.Value) + 2])
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Value));

    svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Annotation (last value)
    const last = filteredData[filteredData.length - 1];
    svg.append("text")
        .attr("x", x(last.Year) + 5)
        .attr("y", y(last.Value))
        .attr("fill", "black")
        .text(`Latest: ${last.Value.toFixed(1)} years`);
}
