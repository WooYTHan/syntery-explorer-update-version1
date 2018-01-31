var firstNode, secondNode, firstNodeName, secondNodeName,nodeName,str;
var outerRadius = null, innerRadius = null
var w = 1770, h = 1361;
var zoomValue, zoom;
var selected = 0;
var wiki= {}, sName = {};
var display = "linear";
var miniCanvas, rootDists, timeLineScale, xAxis, frameTranslate, dragTransform = null, scale2 = 1;
var overview = "open";

$(".button").hide(); 
$(".button").click(function(){
  window.open("genome.html?" + str, 'genome view');
});

$("#overview").click(function(){
  if(overview == "open"){
    $(".contextTree").css("display","none");
    $("#overview").css("float","left");
    overview = "closed";
}else{
    $(".contextTree").css("display","");
    $("#overview").css("float","right");
    overview = "open";
}

});


d3.queue()
.defer(d3.text, "treetime.txt")
.defer(d3.csv, "info.csv")
.await(function(error, life, info) {

    if (error) throw error;
    info.forEach(function(d) {
        var name = d.Id;
        if(d.Wiki != ""){
            wiki[name] = d.Wiki;
        }
        else{
            wiki[name] = "Description not avaliable.";
        }
        
        sName[name] = d.Name;
    });

    var canvas = d3.demo.canvas(life, info).width(w).height(h);
    d3.select("#tree").call(canvas);
    canvas.addLinearTree();
    $("#radial").click(function() {
        d3.selectAll('.panCanvas g').remove();
        d3.selectAll('.miniCanvas g').remove();

        canvas.addRadialTree();
        display = "radial";
        addMiniMap(life, info)
    });
    $("#linear").click(function() {
        d3.selectAll('.panCanvas g').remove();
        d3.selectAll('.miniCanvas g').remove();
        canvas.addLinearTree();
        display = "linear";
        addMiniMap(life, info)
    });

    var chart = $(".canvas"),
    rect = document.getElementById("canvas").getBoundingClientRect(),
    aspect = rect.width/rect.height;

    $(window).on("resize", function() {
        var targetHeight = $(window).height();
        var targetWidth = $(window).width();
        
        chart.attr("width", targetHeight * aspect);
        chart.attr("height", targetHeight);
        
    }).trigger("resize");
});

// Compute the maximum cumulative length of any node in the tree.
function maxLength(d) {
    return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
}
// Set the radius of each node by recursively summing and scaling the distance from the root.
function setRadius(d, y0, k) {
    d.radius = (y0 += d.data.length) * k;
    if (d.children) d.children.forEach(function(d) {
        setRadius(d, y0, k);
    });
}

function linkVariable(d) {
    return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);
}

function linkConstant(d) {
    return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
}
// Like d3.svg.diagonal.radial, but with square corners.
function linkStep(startAngle, startRadius, endAngle, endRadius) {
    var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI),
    s0 = Math.sin(startAngle),
    c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI),
    s1 = Math.sin(endAngle);
    return "M" + startRadius * c0 + "," + startRadius * s0 +
    (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1) +
    "L" + endRadius * c1 + "," + endRadius * s1;
}

function getDiagonal() {
    var projection = function(d) {
        return [d.y, d.x];
    }
    var path = function(pathData) {
        return "M" + pathData[0] + ' ' + pathData[1] + " " + pathData[2];
    }

    function diagonal(diagonalPath, i) {
        var source = diagonalPath.source,
        target = diagonalPath.target,
        midpointX = (source.x + target.x) / 2,
        midpointY = (source.y + target.y) / 2,
        pathData = [source, {
            x: target.x,
            y: source.y
        }, target];
        pathData = pathData.map(projection);
        return path(pathData)
    }

    diagonal.projection = function(x) {
        if (!arguments.length) return projection;
        projection = x;
        return diagonal;
    };

    diagonal.path = function(x) {
        if (!arguments.length) return path;
        path = x;
        return diagonal;
    };

    return diagonal;
}

function scaleBranchLengths(nodes, w) {
    // Visit all nodes and adjust y pos width distance metric
    var visitPreOrder = function(root, callback) {
        callback(root)
        if (root.children) {
            for (var i = 0; i < root.children.length; i++) {
                visitPreOrder(root.children[i], callback)
            };
        }
    }

    visitPreOrder(nodes[0], function(node) {
        node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.data.length || 0)
    })
    var rootDists = nodes.map(function(n) {
        return n.rootDist;
    });
    var yscale = d3.scaleLinear()
    .domain([0, d3.max(rootDists)])
    .range([0, w]);
    visitPreOrder(nodes[0], function(node) {
        node.y = yscale(node.rootDist);
    })
}

function reset() {
    return d3.transition().duration(350).tween("zoom", function() {
        var iTranslate = d3.interpolate(zoom.translate(), translate),
        iScale = d3.interpolate(zoom.scale(), scale);
        return function(t) {
            zoom
            .scale(iScale(t))
            .translate(iTranslate(t));
            zoomed();
        };
    });
}

function project(x, y) {
    var angle = (x - 90) / 180 * Math.PI,
    radius = y + 20;
    return [radius * Math.cos(angle) - 30, radius * Math.sin(angle) - 25];
}

function getTranslation(transform) {
    var g = document.ElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttributeNS(null, "transform", transform);
    var matrix = g.transform.baseVal.consolidate().matrix;
    return [matrix.e, matrix.f];
}

