
/**
 * Force-directed graph using d3.js.
 * You need two arrays for the plot. The first array contains all nodes, and the
 * second array contains links (edges) between the nodes.
 */

/* NOTE: To include sprites in SVG, the following structure can be used:
	<defs>
        <clipPath id="c">
            <rect x="135" y="0" width="150" height="150"/>
        </clipPath>
    </defs>
        <image transform="translate(-135,0)" width="550" height="420" 
            xlink:href="static/img/iconSheet.png" clip-path="url(#c)"/>

*/

var data_url = "https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json";
var blankImageUrl = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/575121/blank.png";
var image_url = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/575121/flags.png';

var margin = {top: 10, left: 10, right: 80, bottom: 30};
var nodeRadius = 25;
var SIMULATION = null;

var processCountryData = function(data) {
    var svg    = d3.select("svg");
	var mainDiv = d3.select(".node-container");
    var width  = parseInt(svg.attr("width"));
    var height = parseInt(svg.attr("height"));

	var nodes = data.nodes;
	var links = data.links;

    var forceMany = d3.forceManyBody();
    var forceLink = d3.forceLink(links);
    var forceCenter = d3.forceCenter(width /2, height / 2);

	// Taken from github page d3.js 3d.4
	SIMULATION = d3.forceSimulation(nodes)
		.force("charge", forceMany)
		.force("link", forceLink)
		.force("center", forceCenter);

	var link = svg.append("g")
		.selectAll('line')
		.data(links).enter().append('line')
			.attr("class", "link")
			.attr("stroke-width", 3);

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

	SIMULATION.force("link").links(links);

	function ticked() {
		link
			.attr("x1", function(d) { return d.source.x + 8; })
			.attr("y1", function(d) { return d.source.y + 8; })
			.attr("x2", function(d) { return d.target.x + 8; })
			.attr("y2", function(d) { return d.target.y + 8; });

		node
			.style("top", function(d) { return parseInt(d.y) + "px"; })
			.style("left", function(d) { return parseInt(d.x) + "px"; });
	}

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

