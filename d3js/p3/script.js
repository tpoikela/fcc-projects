
/**
 * See an example of heatmap in http://bl.ocks.org/tjdecke/5558084.
 */

var data_url = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json";

var months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

var numMonths = d3.range(1, 13, 1);

var numToMonth = {};

for (var i = 0; i < months.length; i++) {
    numToMonth[numMonths[i]] = months[i];
}

var bHeightMax = 0;
var bWidthMax = 0;

var textYOffset = 3;

var legendXOffset = 0;
var legendYOffset = 0;
// Size of rectangles in the plot
var rectX = 4;
var rectY = 30;

var margin = {top: 20, left: 10, right: 80, bottom: 50};

var monthLabelX = margin.left;
var xAxisYOffset = margin.top + 12 * rectY + rectY/2;
var plotXOffset = 100;

var colorScaleX = monthLabelX + 100;
var colorScaleTranslater = "translate(" + colorScaleX + "," + (xAxisYOffset + 50) + ")";

var tooltip = d3.select("body")
    .append("div")
    .classed("my-tooltip", true)
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

/** Formats the HTML for tooltip based on the weather data.*/
var getTooltipHTML = function(d, baseTemp) {
    var html = '<p>';
    html += "Month: " + numToMonth[parseInt(d.month)] + '<br/>';
    html += "Year: " + d.year;
    html += " Temp: " + (baseTemp - parseFloat(d.variance));
    html += '</p>';
    return html;
};

var getMinTemp = function(baseTemp, monthly) {
    var minVar = 0.0;
    for (var i = 0; i < monthly.length; i++) {
        var d = parseFloat(monthly[i].variance);
        if (d < minVar) {
            minVar = d;

        }
    }
    return baseTemp + minVar;
};

var getMaxTemp = function(baseTemp, monthly) {
    var maxVar = 0.0;
    for (var i = 0; i < monthly.length; i++) {
        var d = parseFloat(monthly[i].variance);
        if (d > maxVar) {
            maxVar = d;
        }
    }
    return baseTemp + maxVar;
};

var processWeatherData = function(data) {
    var items = data;
    var baseTemp = parseFloat(data.baseTemperature);
    var monthly = data.monthlyVariance;
    var nEntries = monthly.length;
    var lastEntry = monthly[nEntries - 1];

    var firstYear = parseInt(monthly[0].year);
    var lastYear = parseInt(lastEntry.year);
    var maxYear = lastYear;
    var yearDiff = lastYear - firstYear;

    var minTemp = getMinTemp(baseTemp, monthly);
    var maxTemp = getMaxTemp(baseTemp, monthly);

    console.log("Min: " + minTemp + " Max: " + maxTemp);
    console.log("Years: " + firstYear + " - " + lastYear);

    var colorScale = d3.scaleLinear().domain(([minTemp, baseTemp, maxTemp]))
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#0000FF"), d3.rgb('#00FF00'), d3.rgb('#FF0000')]);

    var svg = d3.select("svg");
    bWidthMax = parseInt(svg.attr("width")) - margin.left - margin.right;
    bHeightMax = parseInt(svg.attr("height")) - margin.top - margin.bottom;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Creates the month labels
    g.selectAll(".monthLabel")
        .data(numMonths).enter().append("text")
        .attr("x", monthLabelX)
        .attr("y", function(d) {return d*rectY + 3;})
        .text(function(d) {return numToMonth[d];});


    // Creates the colorscale
    for (var i = minTemp; i <= maxTemp; i += 1.0) {
        var rect = g.append("rect")
            .attr("transform", colorScaleTranslater)
            .attr("fill", colorScale(i))
            .attr("x", i*42+legendXOffset)
            .attr("y", 20+legendYOffset)
            .attr("width", 40)
            .attr("height", 40);
    }

    // Creates scales for mapping data (domain) to pixels (range)
    var scaleX = d3.scaleLinear().range([0, bWidthMax]);
    scaleX.domain([firstYear, lastYear]);

    var plotHighestX = bHeightMax - 20;

    // Create X-axis
    g.append("g")
        .attr("class", "axis x--axis")
        .attr("transform", "translate(" + plotXOffset + "," + xAxisYOffset + ")")
        .call(
            d3.axisBottom(scaleX)
                .tickValues(d3.range(1750, 2015, 10))
        );

    var scaleY = d3.scaleLinear()
        .domain(numMonths)
        .range([0, plotHighestX]);

    // Data is mapped to circle-elements here
    var node = g.selectAll("rect")
        .data(monthly).enter().append("g");

    node.append("rect")
        .attr("transform", "translate(" + plotXOffset + ", 0)")
        .attr("fill", function(d) {
            return colorScale(baseTemp + parseFloat(d.variance));
        })
        .attr("height", rectY)
        .attr("width", rectX)
        //.attr("x", function(d) {return rectX * (yearDiff - (maxYear - parseInt(d.year)));})
        .attr("x", function(d) {return scaleX(parseInt(d.year));})
        .attr("y", function(d) {return rectY*parseInt(d.month);})

        // Needed for showing/hiding the tooltip
        .on("mouseover", function(d, i) {
            var tooltipHTML = getTooltipHTML(d, baseTemp);
            tooltip.html(tooltipHTML);
            return tooltip.style("visibility", "visible");
        })

        .on("mousemove", function(d, i) {
            return tooltip
                .style("top", (d3.event.pageY-10)+"px")
                .style("left",(d3.event.pageX+10)+"px");
        })

        .on("mouseout", function(){
            return tooltip.style("visibility", "hidden");
        });

    return 1;

    // Appends the biker name after each circle in the plot
    node.append("text")
        .attr("x", function(d) {return scaleX(d.diff) + 7;})
        .attr("y", function(d) {return scaleY(d.place) + textYOffset;})
        .attr("class", "biker-name")
        .text(function(d) {return d.name;});


    // Create label for x-axis
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (bWidthMax/2) + "," +
            (bHeightMax + margin.top + 10) + ")")
        .text("Minutes behind the fastest time");

    // Create label for y-axis
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (margin.left + 25) + "," +
            (bHeightMax/2) + ") rotate(-90)")
        .text("Position");

    // Create legend
    var legend = g.append("g")
        .attr("fill", "brown")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .text("No doping allegations");

    legend.append("circle")
        .attr("r", 5.0)
        .attr("cx", 500)
        .attr("cy", 400 )
        .attr("fill", "red");

    legend.append("text")
        .attr("x", 510)
        .attr("y", 400 + textYOffset)
        .text("Doping allegations");

    legend.append("circle")
        .attr("r", 5.0)
        .attr("cx", 500)
        .attr("cy", 430)
        .attr("fill", "blue");

    legend.append("text")
        .attr("x", 510)
        .attr("y", 430 + textYOffset)
        .text("NO doping allegations");

    g.append("text")
        .attr("x", 100)
        .attr("y", 100)
        .atrr("class", "fastest-times")
        .text("35 fastest times up Alpe d'Huez");


};

/** Gets the cyclist data from the URL.*/
function getAndPlotWeatherData() {
    var jqxhr = $.getJSON( data_url, processWeatherData )
        .done(function() {
            //console.log( "second success" );
        })
        .fail(function() {
            console.error("Failed to get the weather data.");
        })
        .always(function() {
            //console.log( "complete" );
        });

}


// MAIN
$(document).ready( function () {
    getAndPlotWeatherData();
});
