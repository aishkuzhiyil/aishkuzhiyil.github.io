let currentScene = 1;
let currentYear = 2000;
let data = [];
let yearlyData = {};

const tooltip = d3.select("#tooltip");


// color stuff !
const regionColors = { AFE: "#CC0605", AFW: "#332F2C", ARB: "#E4A010", CEB: "#D84B20", EAS: "#CF3476", EAP: "#8673A1", ECS: "#8F8F8F",
    LCN: "#BCBD22", NAC: "#AEC7E8", PSS: "#17BEDF", SAS: "#FFCC67",SSF: "#98DFFA", MEA: "#C5B590"
};
const colorScale = d3.scaleOrdinal().domain(Object.keys(regionColors)).range(Object.values(regionColors));


// plot stuff
const width = 800;
const height = 600;
const margin = { top: 50, right: 60, bottom: 50, left: 80 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

const xScale = d3.scaleLog().domain([10, 10000]).range([0, plotWidth]);
const yScale = d3.scaleLinear().domain([40, 90]).range([plotHeight, 0]);



let dotGroup = null;

function configureSlider(years, updateCallback) {
    d3.select("#slider").style("display", "block");

    d3.select("#slider input")
        .attr("min", d3.min(years))
        .attr("max", d3.max(years) - 1) // ignore 2023 ? (no data atm)
        .attr("value", currentYear)
        .on("input", function () {
            currentYear = +this.value;
            d3.select("#year-label").text(`Year: ${currentYear}`);
            updateCallback(currentYear);
        });
    d3.select("#year-label").text(`Year: ${currentYear}`);
}

d3.csv("data.csv").then(rawData => {
    data = rawData.map(d => ({
        year: +d["Year"],
        series: d["Series Name"],
        seriesCode: d["Series Code"],
        value: +d["Value"],
        regionCode: d["Region Code"],
        regionName: d["Region Name"]
    }));

    const healthSeriesCode = "SH.XPD.CHEX.PC.CD";
    const expectancySeriesCode = "SP.DYN.LE00.IN";
    const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);

    years.forEach(year => yearlyData[year] = {});
    console.log("years: " + years);
    data.forEach(d => {
        if (!yearlyData[d.year][d.regionCode]) {
            yearlyData[d.year][d.regionCode] = {
                regionCode: d.regionCode,
                regionName: d.regionName,
                life: null,
                spending: null
            };
        }
        if (d.seriesCode === expectancySeriesCode) yearlyData[d.year][d.regionCode].life = d.value;
        if (d.seriesCode === healthSeriesCode) yearlyData[d.year][d.regionCode].spending = d.value;
    });
    renderScene(currentScene);
    renderLegend();
});

function renderScene(sceneNum) {
    d3.select("#slider").style("display", "none");
    d3.select("#chart").html("");
    if (sceneNum === 1) {   
        renderScene1();
        renderAnnotation(sceneNum)
    } else if (sceneNum === 2) {
        renderScene2();
        renderAnnotation(sceneNum);

    } else if (sceneNum === 3) {
        renderScene3();
        renderAnnotation(sceneNum);
    }
}

function renderScene1() {
    const years = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);
    configureSlider(years, updateChart);
    const svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    dotGroup = g.append("g").attr("class", "dots");

    g.append("g").attr("class", "x-axis")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(xScale).tickValues([10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]).tickFormat(d3.format("~s")))
        .selectAll("text")
        .style("text-anchor", "end");

    g.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale));
    g.append("text").attr("x", plotWidth / 2).attr("y", plotHeight + 45).attr("text-anchor", "middle").text("Health Spending per Capita (USD)");
    g.append("text").attr("transform", "rotate(-90)").attr("x", -plotHeight / 2).attr("y", -50).text("Life Expectancy at Birth (years)");
    updateChart(currentYear);
    function updateChart(year) {
        const yearData = Object.values(yearlyData[year]).filter(d => d.spending && d.life);
    
        const circles = dotGroup.selectAll("circle").data(yearData, d => d.regionCode);
    
        circles.enter().append("circle").attr("r", 5)
            .attr("fill", d => colorScale(d.regionCode))
            .merge(circles)
            .attr("cx", d => xScale(d.spending))
            .attr("cy", d => yScale(d.life))
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>${d.regionName}</strong><br>
                        Life Expectancy: ${d.life.toFixed(1)}<br>
                        Spending: $${d.spending.toFixed(2)}
                    `).style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
        circles.exit().remove();
    }
}



function renderScene3() {
    const svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const dotGroup = g.append("g").attr("class", "dot-group");
    const electricityCode = "EG.ELC.ACCS.ZS";
    const lifeCode = "SP.DYN.LE00.IN";

    const yearlyElectricity = {};
    const yearlyLife = {};

    data.forEach(d => {
        if (d.seriesCode === electricityCode) {
            if (!yearlyElectricity[d.year]) yearlyElectricity[d.year] = {};
            yearlyElectricity[d.year][d.regionCode] = d.value;
        }
        if (d.seriesCode === lifeCode) {
            if (!yearlyLife[d.year]) yearlyLife[d.year] = {};
            yearlyLife[d.year][d.regionCode] = d.value;
        }
    });

    const x = d3.scaleLinear().domain([0, 100]).range([0, plotWidth]);
    const y = d3.scaleLinear().domain([40, 90]).range([plotHeight, 0]);

    g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${plotHeight})`).call(d3.axisBottom(x));

    g.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

    g.append("text").attr("x", plotWidth / 2).attr("y", plotHeight + 40).attr("text-anchor", "middle").text("Access to Electricity (% of Population)");
    g.append("text").attr("transform", "rotate(-90)")
        .attr("x", -plotHeight / 2)
        .attr("y", -50).attr("text-anchor", "middle")
        .text("Life Expectancy at Birth (years)");

    const years = Object.keys(yearlyElectricity).filter(y => yearlyLife[y]).map(Number).sort();
    configureSlider(years, updateScene3);

    updateScene3(currentYear);

    function updateScene3(year) {
        const electricity = yearlyElectricity[year];
        const life = yearlyLife[year];

        const points = Object.keys(electricity).filter(region => life[region] != null)
            .map(region => ({
                regionCode: region,
                regionName: data.find(d => d.regionCode === region)?.regionName,
                electricity: electricity[region],
                life: life[region]
            }));

        const circles = dotGroup.selectAll("circle").data(points, d => d.regionCode);

        circles.enter()
            .append("circle")
            .attr("r", 5)
            .attr("fill", d => colorScale(d.regionCode) || "steelblue")
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>${d.regionName}</strong><br>
                        Electricity Access: ${d.electricity.toFixed(1)}%<br>
                        Life Expectancy: ${d.life.toFixed(1)} years
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0))
            .merge(circles)
            .attr("cx", d => x(d.electricity)).attr("cy", d => y(d.life));

        circles.exit().remove();
    }

    renderLegend();
}
function renderScene2() {
    const svg = d3.select("#chart").append("svg")
        .attr("width", width).attr("height", height);

        d3.select("#annotation").text("working");
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const mortalitySeriesCode = "SH.DYN.MORT";
    const mortalityData = {};

    data.filter(d => d.seriesCode === mortalitySeriesCode)
        .forEach(d => {
            const year = +d.year;
            if (!mortalityData[d.regionCode]) {
                mortalityData[d.regionCode] = {
                    regionName: d.regionName,
                    values: []
                };
            }
            mortalityData[d.regionCode].values.push({ year, value: d.value });
        });
    Object.values(mortalityData).forEach(region => {
        region.values.sort((a, b) => a.year - b.year);
        const start = region.values[0];
        const end = region.values[region.values.length - 2]; // 2 for 2022 
        const years = end.year - start.year;
        region.trend = {
            startYear: start.year,
            startValue: start.value,
            endYear: end.year,
            endValue: end.value,
            percentChange: ((end.value - start.value) / start.value) * 100,
            absoluteChange: end.value - start.value,
            annualChange: (end.value - start.value) / years
        };
    });

    // Setup scales
    const allPoints = Object.values(mortalityData).flatMap(d => d.values);
    const x = d3.scaleLinear().domain(d3.extent(allPoints, d => d.year))
        .range([0, plotWidth]);
    const y = d3.scaleLinear().domain([0, d3.max(allPoints, d => d.value)])
        .range([plotHeight, 0]);

    g.append("g").attr("class", "x-axis")
.attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    g.append("g").attr("class", "y-axis").call(d3.axisLeft(y));
    g.append("text").attr("x", plotWidth / 2).attr("y", plotHeight + 40)
        .attr("text-anchor", "middle").text("Year");

    g.append("text").attr("transform", "rotate(-90)")
        .attr("x", -plotHeight / 2).attr("y", -50)
        .attr("text-anchor", "middle").text("Infant Mortality Rate (per 1,000 live births)");

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));
    // console.log("test!!!!!!!!!!!")
    Object.entries(mortalityData).forEach(([code, region]) => {
        g.append("path")
            .datum(region.values)
            .attr("class", "mortality-line")
            .attr("fill", "none")
            .attr("stroke", regionColors[code] || "#ccc")
            .attr("stroke-width", 3)
            .style("pointer-events", "all")
            .style("cursor", "pointer")
            .attr("d", line)
            .on("mouseover", (event) => {
                tooltip.style("opacity", 1)
                    .html(`
                        <strong>${region.regionName}</strong><br>
                        2000 -> 2022<br>
                        Mortality: ${region.trend.startValue.toFixed(1)} -> ${region.trend.endValue.toFixed(1)}<br>
                        Change: ${region.trend.absoluteChange.toFixed(1)} (${region.trend.percentChange.toFixed(1)}%)<br>
                        Avg annual change: ${region.trend.annualChange.toFixed(2)}
                    `);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 40) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);});
    });
}
function renderLegend() {
    const legendContainer = d3.select("#legend").html("");
    Object.entries(regionColors).forEach(([code, color]) => {
        const name = data.find(d => d.regionCode === code)?.regionName;
        console.log("LEGEND TEST");
        console.log("name: " + name);
        if (name) {
            console.log("in the if!");
            const item = legendContainer.append("div").attr("class", "legend-item");
            item.append("span").attr("class", "legend-color").style("background-color", color);
            item.append("span").text(name);
        }
    });
}

d3.selectAll(".scene-btn").on("click", function () {
    currentScene = +d3.select(this).attr("data-scene");
    console.log("in on click. going to render " + currentScene);
    renderScene(currentScene);
});

function renderAnnotation(sceneNum) {
    console.log("rendering annoatation for scene " + sceneNum)
    switch (sceneNum) {
        case 1:
            d3.select("#annotation").text("On this chart, we can see that increased spending per capita increases life expectancy. Additionally, as time passes, regions have invested more money into health spending. Drag the slider to see the changes over time and hover over the data points for more information.")
            break;
        case 2:
            d3.select("#annotation").text("On this chart, we can see that as time passes, the infant mortality rate has dropped. Hover over the line to see the exact change over time. This decrease in infant mortality rate correlates with the increased spending and life expectancy from the previous chart. With more money invested into the livelihood of a region's inhabitants, the mortality rate decreases.")
            break;
        case 3:
            d3.select("#annotation").text("On this final chart, we can see that as regions gain more access to electricity, their life expectancy increases. This expands on the previous charts as increased access to resources like money and electricity increase a region's life expectancy. Hover over the data points to see exact percentages and life expectancies and drag the slider to see changes over time.")
            break;
        default:
            break;
    };
}
