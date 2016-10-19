
/**
 * Short tutorial about scatter plots:
 * http://bl.ocks.org/d3noob/38744a17f9c0141bcd04
 */

var data_url = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/cyclist-data.json";

var bHeightMax = 0;
var bWidthMax = 0;

var textYOffset = 3;

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
    html += "Time: " + d.time;
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


var processCyclistData = function(data) {
    var items = data;
    var bestTime = "00:00";
    var NLast = items.length - 1;

    var places  = items.map(function(item) {return parseInt(item.Place);});
    var times   = items.map(function(item) {return item.Time;});
    var seconds = items.map(function(item) {return parseInt(item.Seconds);});
    var secDiffs = [];

    if (places[0] === 1) bestTime = seconds[0];

    var finalData = [];
    for (var i = 0; i < times.length; i++) {
        var diff = seconds[i] - bestTime;
        secDiffs[i] = diff;
        var d = {place: places[i], 
            time: times[i], name: items[i].Name, doping: items[i].Doping,
            seconds: seconds[i], diff: diff, nationality: items[i].Nationality, 
            year: items[i].Year};
        finalData.push(d);
    }

    var maxDiffSec = seconds[NLast] - bestTime;

    var svg = d3.select("svg");

    bWidthMax = parseInt(svg.attr("width")) - margin.left - margin.right;
    bHeightMax = parseInt(svg.attr("height")) - margin.top - margin.bottom;
    var highestPoint = bHeightMax - 20;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Creates scales for mapping data (domain) to pixels (range)
    var scaleX = d3.scaleLinear().range([0, bWidthMax]);
    scaleX.domain([maxDiffSec, 0]);

    var scaleY = d3.scaleLinear()
        .domain([0, d3.max(places) + 2])
        .range([0, highestPoint]);

    // Create X-axis
    g.append("g")
        .attr("class", "axis x--axis")
        .attr("transform", "translate(0, " + highestPoint + ")")
        .call(
            d3.axisBottom(scaleX)
                .tickValues(d3.range(d3.min(secDiffs), d3.max(secDiffs)+30, 30))
                .tickFormat(function(d) {
                    var min = Math.floor(d / 60);
                    var sec = d % 60;
                    if (min === 0) min = "00";
                    if (sec === 0) sec = "00";
                    return ""+min+":"+sec;
                })
        );

    // Create Y-axis
    g.append("g")
        .attr("class", "axis y-axis")
        .text("Place")
        .call(d3.axisLeft(scaleY).ticks(10));

    // Data is mapped to circle-elements here
    var node = g.selectAll("dot")
        .data(finalData).enter().append("g");

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
function getCyclistData() {
    var jqxhr = $.getJSON( data_url, processCyclistData )
        .done(function() {
            //console.log( "second success" );
        })
        .fail(function() {
            console.error("Failed to get the cyclist data.");
        })
        .always(function() {
            //console.log( "complete" );
        });

}


// MAIN
$(document).ready( function () {
    getCyclistData();
});
