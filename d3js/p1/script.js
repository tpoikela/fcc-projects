

/**
 * Tooltip for showing year/USD figure based on the following tip:
 * https://stackoverflow.com/questions/10805184/d3-show-data-on-mouseover-of-circle
 */

var gdp_url = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/GDP-data.json";

var bHeightMax = 700; // Equal to 20,000 BUSD
var bWidthMax = 960;
var barWidth  = 20;

$(document).ready( function () {
    getGDPData();
});

var margin = {top: 20, left: 50, right: 40, bottom: 50};

var yearToDate = {};

var dataPair = [];

var dateToYM = function(date) {
    var ymd = date.split("-");
    var year = ymd[0];
    var mon = ymd[1];
    if (mon === "01") mon = "Q1 - January";
    if (mon === "04") mon = "Q2 - April";
    if (mon === "07") mon = "Q3 - July";
    if (mon === "10") mon = "Q4 - October";
    return year + " - " + mon;
};

var tooltip = d3.select("body")
    .append("div")
    .classed("my-tooltip", true)
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

var comparisonBox = d3.select("body")
    .append("div")
    .classed("comparison-box", true)
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

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
        yearToDate[year] = date;
        return year;
    });

    var finalData = [];
    for (var i = 0; i < dates.length; i++) {
        var d = {year: dates[i], val: values[i], date: datesStr[i]};
        finalData.push(d);
    }

    var firstYear = dates[0];
    var lastYear = dates[dates.length-1];

    var svg = d3.select("svg");

    bWidthMax = parseInt(svg.attr("width")) - margin.left - margin.right;
    bHeightMax = parseInt(svg.attr("height")) - margin.top - margin.bottom;
    var barHeight = bHeightMax - 20;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Creates scales for mapping data (domain) to pixels (range)
    var scaleX = d3.scaleBand().rangeRound([0, bWidthMax]).padding(0.1);
    scaleX.domain(dates.map(function(d, i) {
        return d;
    }));

    var scaleY = d3.scaleLinear()
        .domain([ d3.max(values), 0])
        .range([0, barHeight]);
    barWidth = bWidthMax / values.length;

    // Create X-axis
    g.append("g")
        .attr("class", "axis x--axis")
        .attr("transform", "translate(0, " + barHeight + ")")
        .call(
            d3.axisBottom(scaleX)
                .tickValues(d3.range(1950, 2016, 5))
        );

    // Create Y-axis
    g.append("g")
        .attr("class", "axis y-axis")
        .text("Billion USD")
        .call(d3.axisLeft(scaleY).ticks(10)
        );

    // Data is mapped to rect-elements here
    g.selectAll(".bar")
        .data(finalData)
        .enter().append("rect")
            .attr("height", function(d) {return scaleY(0) - scaleY(d.val);})
            .attr("width", scaleX.bandwidth())
            .attr("x", function(d, i) {return scaleX(d.year)})
            .attr("y", function(d, i) {return scaleY(d.val);})

            .on("mousedown", function(d, i) {
                var x = d3.event.pageX;
                var y = d3.event.pageY;

                d.x = x;
                d.y = y;

                if (dataPair.length === 2) {
                    dataPair = [];
                }
                dataPair.unshift(d);

                if (dataPair.length === 2) {
                    var d1 = dataPair[0];
                    var d2 = dataPair[1];

                    var x1 = d1.x;
                    var y1 = d1.y;
                    var x2 = d2.x;
                    var y2 = d2.y;
                    var ym1 = dateToYM(d1.date);
                    var ym2 = dateToYM(d2.date);

                    var timeSpan = "";
                    var percent = 0;

                    if (d1.year < d2.year) {
                        var years = d2.year - d1.year;
                        var diff = d2.val - d1.val;
                        var perYear = diff / years;
                        timeSpan = "<p>From: " + ym1 + "</p><p>To: " + ym2 + "</p>";
                        percent = Math.log2(d2.val/d1.val) / years;
                    }
                    else {
                        var years = d1.year - d2.year;
                        var diff = d1.val - d2.val;
                        var perYear = diff / years;
                        timeSpan = "<p>From: " + ym2 + "<br/>To: " + ym1 + "</p>";
                        percent = Math.log2(d1.val/d2.val) / years;
                    }

                    percent *= 100;

                    var boxHTML = timeSpan + "<p>Diff: " + diff + " billion USD<br/>" +
                        "Yearly: " + perYear.toFixed(2) + 
                        "(" + percent.toFixed(2) + "%) billion USD</p>";

                    comparisonBox.style("top", bHeightMax/2 +"px")
                        .style("left", bWidthMax-50 +"px");
                    comparisonBox.html(boxHTML);
                    return comparisonBox.style("visibility", "visible");
                }
                else if (dataPair.length === 1) {
                    var ym = dateToYM(d.date);
                    var boxHTML = "<p>" + ym + "</p>";
                    comparisonBox.style("top", bHeightMax/2 +"px")
                        .style("left", bWidthMax-50 +"px");
                    comparisonBox.html(boxHTML);
                    return comparisonBox.style("visibility", "visible");
                }
                else {
                    return comparisonBox.style("visibility", "hidden");
                }
            })

            .on("mouseover", function(d, i) {
                var yearMonth = dateToYM(d.date);
                tooltip.html('<p>' + yearMonth +
                    "</p><p class='dollars'>$" + d.val + " billion</p>");
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

    // Create label for y-axis
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (margin.right + 25) + "," +
            (bHeightMax/2) + ") rotate(-90)")
        .text("Gross Domestic Product, billion USD");

};

/** Gets the GDP data from the URL.*/
function getGDPData() {
    var jqxhr = $.getJSON( gdp_url, processGDPData)
        .done(function() {
            //console.log( "second success" );
        })
        .fail(function() {
            //console.log( "error" );
        })
        .always(function() {
            //console.log( "complete" );
        });

};
