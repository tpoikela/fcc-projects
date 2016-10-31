
/**
 * D3.js Exercise for FreeCodeCamp. The solution uses "world Map Template With
 * D3.js". See http://techslides.com/demos/d3/worldmap-template.html.
 */


d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 9])
    .on("zoom", move);

// Tooltip showing extra meteorite information
var tooltip = d3.select("body")
    .append("div")
    .classed("meteor-tooltip", true)
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

/** Formats the HTML for tooltip based on the meteorite data.*/
var getTooltipHTML = function(d) {
    var html = '<p>';
    var name = d.name;
    var mass = d.getMass();
    html += name + '<br/>';
    html += "Mass: " + mass + '<br/>';
    html += '</p>';
    return html;
};

var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;

var graticule = d3.geo.graticule();

setup(width,height);

var meteoriteURL = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json";

var propNames = ["reclat", "reclong", "name", "mass", "year", "id"];

/** Creates a new meteorite data object.*/
var MeteorData = function(feature) {

    var props = feature.properties;
    var i;
    for (i = 0; i < propNames.length; i++) {
        if (props.hasOwnProperty(propNames[i])) {
            this[propNames[i]] = props[propNames[i]];
            if (props[propNames[i]] === null) {
                console.log("Null attr " + propNames[i]);
            }
        }
        else {
            console.log("Property " + propNames[i] + " doesn't exist.");
        }
    }

};

MeteorData.prototype.getYear = function() {
    return this.year;
};

MeteorData.prototype.getMass = function() {
    if (this.mass === null) return 0;
    return parseFloat(this.mass);
};

MeteorData.prototype.getName = function() {
    return this.name;
};

MeteorData.prototype.getLong = function() {
    if (this.reclong === null) return null;
    return parseFloat(this.reclong);
};

MeteorData.prototype.getLat = function() {
    if (this.reclat === null) return null;
    return parseFloat(this.reclat);
};


// Stores a list of all meteorite data
var meteorDataList = [];

function setup(width,height){
    projection = d3.geo.mercator()
        .translate([(width/2), (height/2)])
        .scale( width / 2 / Math.PI);

    path = d3.geo.path().projection(projection);

    svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom)
        .on("click", click)
        .append("g");

    g = svg.append("g");

}

/** Reads the JSON file containing data for drawing the countries.*/
d3.json("data/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;
    topo = countries;
    draw(topo);

});

/** Draws each country on the world map.*/
function draw(topo) {

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);


    g.append("path")
        .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
        .attr("class", "equator")
        .attr("d", path);

    var country = g.selectAll(".country").data(topo);

    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d,i) { return d.properties.name; })
        .style("fill", function(d, i) { return d.properties.color; });

    //---------------------------------------------------------------------------
    // The code to draw the meteorite information is put here
    //---------------------------------------------------------------------------

    d3.json(meteoriteURL, function(err, data) {
        var i = 0;
        var largestMass = 0;
        console.log("Finding now meteorite data...");
        if (err) {
            console.log("ERROR happened: " + err);
        }
        else {
            for (i = 0; i < data.features.length; i++) {
                if (i < 10) {
                    console.log(JSON.stringify(data.features[i]));
                    console.log("Coords: " + data.features[i].geometry.coordinates);
                }

                var meteor = new MeteorData(data.features[i]);
                meteorDataList.push(meteor);

                var mass = meteor.getMass();
                if (mass > largestMass) {
                    largestMass = mass;
                }

            }

            console.log("Largest found mass is " + largestMass);

            // TODO create mapping mass -> r

            console.log("Found " + meteorDataList.length + " meteorites.");

            /*
            var meteors = g.selectAll(".meteorite")
                .data(meteorDataList).enter()
                .append("circle")
                .attr("class", "meteorite")
                .attr("cx", function(d) {
                    var latLon = [d.getLat(), d.getLong()];
                    return projection(latLon)[1];
                })
                .attr("cy", function(d) {
                    var latLon = [d.getLat(), d.getLong()];
                    return projection(latLon)[0];
                })
                .attr("r", function(d) {return 5;});
                //.attr("r", function(d) {return d.getMass();});
            */
            meteorDataList.forEach(function(i) {
                addMeteorite(i);
            });

        }



    });

}


function redraw() {
    width = document.getElementById('container').offsetWidth;
    height = width / 2;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}


function move() {

    var t = d3.event.translate;
    var s = d3.event.scale; 
    zscale = s;
    var h = height/4;


    t[0] = Math.min(
        (width/height)  * (s - 1), 
        Math.max( width * (1 - s), t[0] )
    );

    t[1] = Math.min(
        h * (s - 1) + h * s, 
        Math.max(height  * (1 - s) - h * s, t[1])
    );

    zoom.translate(t);
    g.attr("transform", "translate(" + t + ")scale(" + s + ")");

    //adjust the country hover stroke width based on zoom level
    d3.selectAll(".country").style("stroke-width", 1.5 / s);

}



var throttleTimer;
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}


//geo translation on mouse click in map
function click() {
    var latlon = projection.invert(d3.mouse(this));
    console.log(latlon);
}


// Converts a meteorite mass into radius
function massToRadius(mass) {
    var scale = 2;
    if (mass < 5000) return 1*scale;
    if (mass < 50000) return 2*scale;
    if (mass < 500000) return 3*scale;
    if (mass < 5000000) return 4*scale;
    if (mass < 50000000) return 5*scale;
    if (mass < 500000000) return 6*scale;
    return 9*scale;
};

//function to add points and text to the map (Used for adding each meteorite
//landing)
function addMeteorite(d) {

    var lat = d.getLong();
    var lon = d.getLat();
    var text = "";
    var mass = d.getMass();
    var radius = massToRadius(mass);

    if (lat === null) return;
    if (lon === null) return;

    var gpoint = g.append("g").attr("class", "gpoint");
    var x = projection([lat,lon])[0];
    var y = projection([lat,lon])[1];

    gpoint.append("svg:circle")
        .datum(d)
        .attr("cx", x)
        .attr("cy", y)
        .attr("class","meteorite")
        .attr("r", radius)

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

    //conditional in case a point has no associated text
    if(text.length>0){

        gpoint.append("text")
            .attr("x", x+2)
            .attr("y", y+2)
            .attr("class","text")
            .text(text);
    }

}
