
var gdp_url = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/GDP-data.json";

var bHeightMax = 700; // Equal to 20,000 BUSD
var bWidthMax = 960;
var barWidth  = 20;

$(document).ready( function () {
    getGDPData();
});

var margin = {top: 20, left: 50, right: 20, bottom: 50};

var processGDPData = function(data) {
    console.log( "success" );
    console.log("Data is " + data);
    var items = data.data;

    var datesStr = items.map(function(item) {return item[0];});
    var values = items.map(function(item) {return parseInt(item[1]);});

    var dates = datesStr.map(function(date, i) {
        var ymd = date.split("-");
        var year = parseInt(ymd[0]);
        if (i % 4 == 1) year += 0.25;
        if (i % 4 == 2) year += 0.50;
        if (i % 4 == 3) year += 0.75;
        return year;
    });

    var finalData = [];
    for (var i = 0; i < dates.length; i++) {
        var d = {year: dates[i], val: values[i]};
        finalData.push(d);
    }

    var firstYear = dates[0];
    var lastYear = dates[dates.length-1];

    console.log("Values length: " + values.length);

    var svg = d3.select("svg");

    bWidthMax = parseInt(svg.attr("width")) - margin.left - margin.right;
    bHeightMax = parseInt(svg.attr("height")) - margin.top - margin.bottom;
    var barHeight = bHeightMax - 20;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var scaleX = d3.scaleBand().rangeRound([0, bWidthMax]).padding(0.1);
    scaleX.domain(dates.map(function(d, i) {
        return d;
    }));

    var scaleY = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .range([0, barHeight]);
    barWidth = bWidthMax / values.length;

    console.log("x bandwidth: " + scaleX.bandwidth());

    g.append("g")
        .attr("class", "axis x-axis").text("Date")
        .attr("transform", "translate(0, " + bHeightMax + ")")
        .call(d3.axisBottom(scaleX).ticks(10));

    g.append("g")
        .attr("class", "axis y-axis")
        .text("Billion USD")
        .call(d3.axisLeft(scaleY).ticks(10));

    g.selectAll(".bar")
        .data(finalData)
        .enter().append("rect")
            .attr("height", function(d) {return scaleY(d.val);})
            .attr("width", scaleX.bandwidth())
            .attr("x", function(d, i) {return scaleX(d.year)})
            .attr("y", function(d, i) {return barHeight - scaleY(d.val);});

};


function getGDPData() {
    var jqxhr = $.getJSON( gdp_url, processGDPData)
        .done(function() {
            console.log( "second success" );
        })
        .fail(function() {
            console.log( "error" );
        })
        .always(function() {
            console.log( "complete" );
        });

};
