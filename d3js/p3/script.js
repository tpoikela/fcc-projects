
/**
 * See an example of heatmap in http://bl.ocks.org/tjdecke/5558084.
 */

var data_url = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json";

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var fontSize = 8; //px
var numMonths = d3.range(1, 13, 1);

// Maps number to month abbreviation
var numToMonth = {};

for (var i = 0; i < months.length; i++) {
    numToMonth[numMonths[i]] = months[i];
}

var dataMonthly = [];

var bHeightMax = 0;
var bWidthMax = 0;

var textYOffset = 3;

var legendXOffset = 0;
var legendYOffset = 0;

// Size of rectangles in the plot
var rectX = 4;
var rectY = 30;

var margin = {top: 10, left: 10, right: 80, bottom: 30};

var monthLabelX = margin.left;
var xAxisYOffset = margin.top + 12 * rectY + rectY/2;
var plotXOffset = 50;

var colorScaleX = plotXOffset;
var colorScaleTranslater = "translate(" + colorScaleX + "," + (xAxisYOffset + 20) + ")";

var tooltip = d3.select("body")
    .append("div")
    .classed("temp-tooltip", true)
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

/** Formats the HTML for tooltip based on the weather data.*/
var getTooltipHTML = function(d, baseTemp) {
    var html = '<p>';
    html += "Month: " + numToMonth[parseInt(d.month)] + '<br/>';
    html += "Year: " + d.year + '<br/>';
    html += " Temp: " + (baseTemp + parseFloat(d.variance)).toFixed(2);
    html += '</p>';
    return html;
};

var getMinTemp = function(baseTemp, dataMonthly) {
    var i = 0;
    var minVar = 0.0;
    for (i = 0; i < dataMonthly.length; i++) {
        var d = parseFloat(dataMonthly[i].variance);
        if (d < minVar) {
            minVar = d;

        }
    }
    return baseTemp + minVar;
};

var getMaxTemp = function(baseTemp, dataMonthly) {
    var i = 0;
    var maxVar = 0.0;
    for (i = 0; i < dataMonthly.length; i++) {
        var d = parseFloat(dataMonthly[i].variance);
        if (d > maxVar) {
            maxVar = d;
        }
    }
    return baseTemp + maxVar;
};

var processWeatherData = function(data) {
    var i = 0;
    var items = data;
    var baseTemp = parseFloat(data.baseTemperature);
    dataMonthly = data.monthlyVariance.slice(0);
    var nEntries = dataMonthly.length;
    var lastEntry = dataMonthly[nEntries - 1];

    var firstYear = parseInt(dataMonthly[0].year);
    var lastYear = parseInt(lastEntry.year);
    var maxYear = lastYear;
    var yearDiff = lastYear - firstYear;

    var minTemp = getMinTemp(baseTemp, dataMonthly);
    var maxTemp = getMaxTemp(baseTemp, dataMonthly);

    var temp1 = (minTemp + baseTemp) / 2;
    var temp2 = (maxTemp + baseTemp) / 2;
    var tempMid = (temp1 + temp2) / 2;

    var colorScaleT = d3.scaleLinear()
        .domain(([minTemp, temp1, tempMid, temp2, maxTemp]))
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#0000FF"), d3.rgb('#00FFFF'), 
            d3.rgb('#00FF00'), d3.rgb('#FFFF00'), d3.rgb('#FF0000')]);

    var svg = d3.select("svg");
    bWidthMax = parseInt(svg.attr("width")) - margin.left - margin.right;
    bHeightMax = parseInt(svg.attr("height")) - margin.top - margin.bottom;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Creates the month labels
    g.selectAll(".monthLabel")
        .data(numMonths).enter().append("text")
        .attr("class", "svg-text")
        .attr("x", monthLabelX)
        .attr("y", function(d) {return d*rectY + rectY/2;})
        .text(function(d) {return numToMonth[d];});


    var boxY = 20+legendYOffset;
    var textY = boxY + 55;
    // Creates the colorscale legend below the plot
    for (i = minTemp; i <= maxTemp; i += 1.0) {
        var boxX = i*42+legendXOffset+15;

        var rect = g.append("rect")
            .attr("transform", colorScaleTranslater)
            .attr("fill", colorScaleT(i))
            .attr("x", boxX)
            .attr("y", boxY)
            .attr("width", 40)
            .attr("height", 40);

        g.append("text")
            .attr("class", "svg-text")
            .attr("transform", colorScaleTranslater)
            .attr("x", boxX + 5)
            .attr("y", textY)
            .text(i.toFixed(2));


    }

    g.append("text")
        .attr("class", "svg-text")
        .attr("transform", colorScaleTranslater)
        .attr("x", legendXOffset)
        .attr("y", boxY + 20 + fontSize)
        .text("Temperature");

    // Creates scales for mapping data (domain) to pixels (range)
    var scaleX = d3.scaleLinear().range([0, bWidthMax]);
    scaleX.domain([1753, 2015]);

    var plotHighestX = bHeightMax - 20;

    // Create X-axis
    g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(" + plotXOffset + "," + xAxisYOffset + ")")
        .call(
            d3.axisBottom(scaleX)
                .tickValues(d3.range(1753, 2015, 10))
                .tickFormat(function(d) {return ""+d;})
        );

    // Data is mapped to data-rect-elements here
    var node = g.selectAll(".data-rect")
        .data(dataMonthly).enter();

    node.append("rect")
        .attr("class", "data-rect")
        .attr("transform", "translate(" + plotXOffset + ", 0)")
        .attr("fill", function(d) {
            return colorScaleT(baseTemp + parseFloat(d.variance));
        })
        .attr("height", rectY)
        .attr("width", rectX)
        .attr("x", function(d) {return scaleX(parseInt(d.year));})
        .attr("y", function(d) {return rectY*parseInt(d.month);})

        // Needed for showing/hiding the tooltip
        .on("mouseover", function(d, i) {
            var tooltipHTML = getTooltipHTML(d, baseTemp);
            tooltip.html(tooltipHTML);
            return tooltip.style("visibility", "visible");
        })

        .on("mousemove", function(d, i) {
            var x = d3.event.pageX;
            var y = d3.event.pageY;
            if (d.year < 1990) {
                return tooltip
                    .style("top", (y-10)+"px")
                    .style("left",(x+10)+"px");
            }
            else {
                return tooltip
                    .style("top", (y-10)+"px")
                    .style("left",(x-120)+"px");
            }
        })

        .on("mouseout", function(){
            return tooltip.style("visibility", "hidden");
        });

};

/** Gets the temperature data from the URL.*/
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
