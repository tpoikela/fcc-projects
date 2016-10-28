
/**
 * Force-directed graph using d3.js.
 * You need two arrays for the plot. The first array contains all nodes, and the
 * second array contains links (edges) between the nodes.
 */

var data_url = "https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json";
var SIMULATION = null;

var margin = {top: 20, left: 50, right: 50, bottom: 20};

var svgOffsetY = 100;

var halfFlag = 8;
var fullFlag = 16;

var width = 1200;
var height = 800;

var processCountryData = function(data) {
    var svg    = d3.select("svg");
    //svg.attr("width", width);
    svg.attr("height", height);

    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

	var mainDiv = d3.select(".node-container");

	var nodes = data.nodes;
	var links = data.links;

    //-------------------------------------------------
    // These values are for internal link locations
    //-------------------------------------------------
    var minLeftX = margin.left;
    var maxRightX = margin.left + innerWidth;
    var centerX = minLeftX + (maxRightX - minLeftX) / 2;

    var minTopY = margin.top;
    var maxBottomY = margin.top + innerHeight;
    var centerY = minTopY + (maxBottomY - minTopY) / 2;

    var forceMany = d3.forceManyBody();
    var forceLink = d3.forceLink(links);
    var forceCenter = d3.forceCenter(centerX, centerY);

    forceMany.strength(-10);
    forceLink.distance(10);

	// Taken from github page d3.js 3d.4
	SIMULATION = d3.forceSimulation(nodes)
		.force("charge", forceMany)
		.force("link", forceLink)
		.force("center", forceCenter);

    var g = svg.append("g");
    g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    g.append("rect")
        .attr("fill", "cyan")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

	var link = g
		.selectAll('line')
		.data(links).enter().append('line')
			.attr("class", "link")
			.attr("stroke-width", 3)
            .attr("fill", "black");

	var node = mainDiv.selectAll('.flag')
		.data(nodes)
		.enter().append('span')
            .attr("class", function(d) {
				return "flag flag-" + d.code;
			})
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended)
			);

	SIMULATION
		.nodes(nodes)
		.on("tick", ticked);


    /** This is called to update the position of links and nodes.*/
	function ticked() {

        /** Here we update CSS properties left/top as well as x- and
         * y-coordinates related to the node. */
		node
            .style("top", function(d) {
                var dataY = Math.max(minTopY, 
                    Math.min(maxBottomY - halfFlag, parseInt(d.y)));
                d.y = dataY - margin.top;
                var topMargin = dataY + svgOffsetY;
                return topMargin + "px";
            })
            .style("left", function(d) {
                var dataX = Math.max(minLeftX, 
                    Math.min(maxRightX - fullFlag, parseInt(d.x)));
                d.x = dataX - margin.left;
                var leftMargin = dataX;
                return leftMargin + "px";
            });

		link
			.attr("x1", function(d) { return d.source.x + 8; })
			.attr("y1", function(d) { return d.source.y + 8; })
			.attr("x2", function(d) { return d.target.x + 8; })
			.attr("y2", function(d) { return d.target.y + 8; });
	}

};

function countLinks(linkArr) {
    var num = 0;
    for (var i = 0; i < linkArr.length; i++) {
        ++num;
    }
    return num;
};

function dragstarted(d) {
  if (!d3.event.active) SIMULATION.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) SIMULATION.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

/** Gets the temperature data from the URL.*/
function getAndPlotCountryData() {
    var jqxhr = $.getJSON( data_url, processCountryData )
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
    getAndPlotCountryData();
});

