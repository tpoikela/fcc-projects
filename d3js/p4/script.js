
/**
 * Force-directed graph using d3.js.
 * You need two arrays for the plot. The first array contains all nodes, and the
 * second array contains links (edges) between the nodes.
 */

var data_url = "https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json";

var margin = {top: 10, left: 10, right: 80, bottom: 30};

var nodeRadius = 25;

var SIMULATION = null;

var processCountryData = function(data) {
    var svg    = d3.select("svg");
    var width  = parseInt(svg.attr("width"));
    var height = parseInt(svg.attr("height"));

	var  nodes = [
		{ "country": "East Timor", "code": "tl" },
		{ "country": "Canada", "code": "ca" },
		{ "country": "Turkmenistan", "code": "tm" },
		{ "country": "United States of America", "code": "us" }
	];

	var links = [
		{source: 0, target: 1},
		{source: 1, target: 2},
		{source: 1, target: 0},
		{source: 2, target: 3},
		{source: 2, target: 1},
		{source: 3, target: 1}
	];

	//var nodes = data.nodes;
	//var links = data.links;
	// Taken from github page of 3d.4
	SIMULATION = d3.forceSimulation(nodes)
		.force("charge", d3.forceManyBody())
		.force("link", d3.forceLink(links))
		.force("center", d3.forceCenter(width /2, height / 2));

/*
	var SIMULATION = d3.forceSimulation(nodes)
		.force("link", d3.forceLink().id(function(d) { return d.id; }))
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(width / 2, height / 2));
*/

	var link = svg.append("g")
		.selectAll('line')
		.data(links).enter().append('line')
			.attr("class", "link")
			.attr("stroke-width", 3);

	var node = svg.append("g")
		.selectAll('circle')
		.data(nodes)
		.enter().append('circle')
            .attr("class", function(d) {
                return "node flag flag-" + d.code;
            })
            //.attr("src", "")
            //.attr("alt", function(d) {return d.country;})
			.attr("r", 10)
			.attr("fill", "red")
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
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
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
