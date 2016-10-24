
/**
 * Force-directed graph using d3.js.
 * You need two arrays for the plot. The first array contains all nodes, and the
 * second array contains links (edges) between the nodes.
 */

var data_url = "https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json";

var margin = {top: 10, left: 10, right: 80, bottom: 30};

var nodeRadius = 25;

var processCountryData = function(data) {
    var svg    = d3.select("svg");
    var width  = parseInt(svg.attr("width"));
    var height = parseInt(svg.attr("height"));

	var nodes = data.nodes;
	var links = data.links;

	var force = d3.layout.force()
		.size([width, height])
		.nodes(nodes)
		.links(links);

	var link = svg.selectAll('.link')
		.data(links)
		.enter().append('line')
		.attr('class', 'link');

	var node = svg.selectAll('.node')
		.data(nodes)
		.enter().append('circle')
		.attr('class', 'node');

    force.on('end', function() {

        // Add the image for each flag here
        node.attr('r', nodeRadius)
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })
            .text(function(d) {return d.code;});

        link.attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

    });

	force.start();

};

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
