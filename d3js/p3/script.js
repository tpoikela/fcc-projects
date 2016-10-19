
/**
 * See an example of heatmap in http://bl.ocks.org/tjdecke/5558084.
 */

var data_url = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json";

var months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

var numMonths = d3.range(1, 12, 1);

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
var rectX = 3;
var rectY = 6;

var margin = {top: 20, left: 50, right: 80, bottom: 50};

var tooltip = d3.select("body")
    .append("div")
    .classed("my-tooltip", true)
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

/** Formats the HTML for tooltip based on the cyclist data.*/
var getTooltipHTML = function(d) {
    var html = '<p>';
    html += d.name + ': ' + d.nationality + '<br/>';
    html += "Place: " + d.place + '<br/>';
    html += "Year: " + d.year;
    html += " Time: " + d.time;
    if (d.place === 1) html += " <span class='text-warning'>Fastest</span><br/>";
    html += '</p>';
    if (d.doping.length > 0) {
        html += "<p class='text-danger doping'>Doping: " + d.doping + '</p>';
    }
    else {
        html += "<p class='text-success'>No doping allegiations" + '</p>';
    }
    return html;
};


var processWeatherData = function(data) {
    var items = data;
    var baseTemp = data.baseTemperature;
    var monthly = data.monthlyVariance;
    var nEntries = monthly.length;
    var lastEntry = monthly[nEntries - 1];

    var firstYear = monthly[0].year;
    var lastYear = lastEntry.year;

    console.log("Years: " + firstYear + " - " + lastYear);

    var minTemp = 5;
    var maxTemp = 16;

    var colorScale = d3.scaleLinear().domain([minTemp, maxTemp])
        .range([d3.rgb("#0000FF"), d3.rgb('#FF0000')]);

    var svg = d3.select("svg");
    bWidthMax = parseInt(svg.attr("width")) - margin.left - margin.right;
    bHeightMax = parseInt(svg.attr("height")) - margin.top - margin.bottom;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    for (var i = minTemp; i <= maxTemp; i++) {
        var rect = g.append("rect")
            .attr("fill", colorScale(i))
            .attr("x", i*50+legendXOffset)
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
        .attr("transform", "translate(0, " + plotHighestX + ")")
        .call(
            d3.axisBottom(scaleX)
                .tickValues(d3.range(firstYear, lastYear, 10))
                /*.tickFormat(function(d) {
                    var min = Math.floor(d / 60);
                    var sec = d % 60;
                    if (min === 0) min = "00";
                    if (sec === 0) sec = "00";
                    return ""+min+":"+sec;
                })*/
        );

    var scaleY = d3.scaleLinear()
        .domain(numMonths)
        .range([0, plotHighestX]);

    // Create Y-axis
    g.append("g")
        .attr("class", "axis y-axis")
        .text("Month")
        .call(
            d3.axisLeft(scaleY)
                .tickValues(d3.range(1, 12, 1))
                .tickFormat(function(d) {return numToMonth[d];})
        );

    return 1;


    // Data is mapped to circle-elements here
    var node = g.selectAll("dot")
        .data(monthly).enter().append("g");

    node.append("circle")
        .attr("fill", function(d) {
            if (d.doping.length === 0) return "blue";
            else return "red";
        })
        .attr("r", 5.0)
        .attr("cx", function(d) {
            var res = scaleX(d.diff);
            return scaleX(d.diff);
        })
        .attr("cy", function(d) {return scaleY(d.place);})

        // Needed for showing/hiding the tooltip
        .on("mouseover", function(d, i) {
            var tooltipHTML = getTooltipHTML(d);
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
