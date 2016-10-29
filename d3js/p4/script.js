
/**
 * Force-directed graph using d3.js.
 * You need two arrays for the plot. The first array contains all nodes, and the
 * second array contains links (edges) between the nodes.
 */

var data_url = "https://raw.githubusercontent.com/DealPete/forceDirected/master/countries.json";

var SIMULATION = null;
var forceCenter = null;
var forceLink = null;
var forceMany = null;

var margin = {top: 0, left: 0, right: 0, bottom: 0};

var svgOffsetY = 60;

var halfFlag = 8;
var fullFlag = 16;

var width = 1200;
var height = 600;

var numSource = {};

var tooltip = d3.select("body")
    .append("div")
    .classed("my-tooltip", true)
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

/** Formats the HTML for tooltip based on the cyclist data.*/
var getTooltipHTML = function(d) {
    var html = '<p>';
    var index = d.index;
    html += d.country + '<br/>';
    html += "Neighbours: " + numSource[index] + '<br/>';
    html += '</p>';
    return html;
};

var processCountryData = function(data) {
    var i = 0;
    var svg    = d3.select("svg");
    var g = svg.append("g");

    var svgElem = svg.node();
    var bBox  = svgElem.getBoundingClientRect();
    width = bBox.width;
    margin.left = bBox.left;

    //svg.attr("width", width);
    svg.attr("height", height);

    var innerWidth = width;// - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

	var mainDiv = d3.select(".node-container");

	var nodes = data.nodes;
	var links = data.links;


    for (i = 0; i < links.length; i++) {
        if (numSource.hasOwnProperty[links[i].source]) {
            numSource[links[i].source] += 1;
        }
        else {
            numSource[links[i].source] = 1;
        }
    }

    //-------------------------------------------------
    // These values are for internal link locations
    //-------------------------------------------------
    var minLeftX = margin.left;
    var maxRightX = margin.left + innerWidth;
    var centerX = minLeftX + (maxRightX - minLeftX) / 2;

    var minTopY = margin.top;
    var maxBottomY = margin.top + innerHeight;
    var centerY = minTopY + (maxBottomY - minTopY) / 2;

    forceMany = d3.forceManyBody();
    forceLink = d3.forceLink(links);
    forceCenter = d3.forceCenter(centerX, centerY);

    var linkDistance = 30;
    var linkStrength = 0.7;

    $("#gravity-x").val(centerX);
    $("#gravity-y").val(centerY);
    $("#link-dist").val(linkDistance);
    $("#link-str").val(linkStrength);
    $("#many-body").val("*");

    forceMany.distanceMax(200);
    forceLink.distance(linkDistance);
    forceLink.strength(linkStrength);

    forceMany.strength(function(d) {
        return -100;
    });

	// Taken from github page d3.js 3d.4
	SIMULATION = d3.forceSimulation(nodes)
		.force("charge", forceMany)
		.force("link", forceLink)
		.force("center", forceCenter);

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

    $("#gravity-x").change(function() {
        centerX = $(this).val();
        if (forceCenter !== null) {
            forceCenter.x(parseInt(centerX));
            SIMULATION.restart();
        }
    });

    $("#gravity-y").change(function() {
        var centerY = $(this).val();
        if (forceCenter !== null) {
            forceCenter.y(parseInt(centerY));
            SIMULATION.restart();
        }
    });

    $("#link-str").change(function() {
        var str = parseFloat($(this).val());
        if (forceLink !== null) {
            console.log("Setting link strength to " + str);
            forceLink.strength(str);
            SIMULATION.restart();
        }
    });

    $("#link-dist").change(function() {
        var dist = parseInt($(this).val());
        if (forceLink !== null) {
            forceLink.distance(dist);
            SIMULATION.restart();
        }
    });

    $("#many-body").change(function() {
        var str = parseInt($(this).val());
        if (forceMany !== null) {
            forceMany.strength(str);
            SIMULATION.restart();
        }
    });

    getAndPlotCountryData();
});

