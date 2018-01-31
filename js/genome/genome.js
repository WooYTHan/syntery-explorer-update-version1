//get filename from previous page.
var url = new URL(window.location.href),
p = getParameterByName("p"),
c1 = getParameterByName("c1"),
c2 = getParameterByName("c2");

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var firstArray = localStorage.getItem("firstArray").split(","),
secondArray = localStorage.getItem("secondArray").split(",");


var filenames = [],
parents = [],
childrens

if(firstArray[0] != "" && secondArray[0] != ""){
    childrens = firstArray.concat(secondArray);
    getFileName(firstArray);
    getFileName(secondArray);
}
else if(firstArray[0] != ""){
    childrens = firstArray;
    getFileName(firstArray);
}
else if(secondArray[0] != ""){
    childrens = secondArray;
    getFileName(secondArray);

}

filenames.push("info.csv");

//default mode is Morpthenslide forward
var mode = "forward";
$("#morphthenslide").css("color", "#d23600");
$("#forward").css("color", "#d23600");

var wiki = {},
sName = {};

var margin = {
    top: -10,
    right: 20,
    bottom: 30,
    left: 150
},
width = 550 - margin.left - margin.right,
height = 1050 - margin.top - margin.bottom;

var svg = d3.select("#chromosomes")
.append("svg")
.attr("width", 1800 + margin.left + margin.right)
.attr("id", "chrSvg")
.attr("height", 1400 + margin.top + margin.bottom)
.attr("preserveAspectRatio", "xMinYMin meet")
.attr("viewBox", "0 0 1800 1550")
.append("g")
.attr("id", "tree")
.attr("transform", "translate(" + margin.left + "," + (-130) + ")");
//make svg responsive 
var chart = $("#chrSvg"),
originalWidth = chart.width(),
aspect = originalWidth / $(window).width();

$(window).on("resize", function() {
    var targetHeight = $(window).height();
    var targetWidth = $(window).width();
    chart.attr("width", Math.round(targetWidth * aspect));
    chart.attr("height", targetHeight);
}).trigger("resize");

//colorScale of the chromosome
var colorScale = d3.scaleOrdinal()
.range(["#6B4600", "#666810", "#910000", 
    "#B40000", "#B38E8E", "#FFFF00", "#FF9A00",
    "#4567B3", "#B40090", "#0D4600", "#345E2C",
    "#8DB400", "#FFCD00", "#0000D3", "#00B300", 
    "#345E2C", "#698DB4", "#8DB2B2", "#00B2B3", 
    "#8E16B3", "#909165", "#6A0092", "#A24107", 
    "#5E8C93", "#6A0092", "#1B1E47", "#16B2B2", 
    "#82812C", "#B34943"]);

//var color = [];
var x = d3.scaleBand()
.rangeRound([0, width])
.padding(0.6)
.align(0.1);

var y = d3.scaleLinear()
.rangeRound([0, 130]);

//read files
var queue = d3.queue();
filenames.forEach(function(filename) {
    queue.defer(d3.csv, filename);
});

queue.awaitAll(function(error, csvDataSets) {
    if (error) throw error;
    var info = csvDataSets[csvDataSets.length - 1];
    var data = [];
    var a;
    for (a = 0; a < csvDataSets.length - 1; a++) {
        var speciesData = [];
        var parentData = csvDataSets[a];
        var speParentColor = [];
        parentData.forEach(function(d, i) {
            var colorMatching = {};
            d.start = +d.start;
            d.end = +d.end;
            d.direction = directionToStr(d.direction);
            if (i >= 0 && i % 2 == 0) {
                i = i + 1;
                d.matchChr = csvDataSets[a][i].chr;
                d.matchName = csvDataSets[a][i].name;
                d.matchStart = csvDataSets[a][i].start;
                d.matchEnd = csvDataSets[a][i].end;
                d.matchDirection = directionToStr(csvDataSets[a][i].direction);
                d.color = d.matchName + "_" + d.matchChr;
            }
        });
        var speChildColor = [];
        var childrenData = csvDataSets[a];
        childrenData.forEach(function(d, i) {
            var colorMatching = {};
            d.start = +d.start;
            d.end = +d.end;
            d.direction = directionToStr(d.direction);
            if (i > 0 && i % 2 == 1) {
                i = i - 1;
                d.matchChr = csvDataSets[a][i].chr;
                d.matchName = csvDataSets[a][i].name;
                d.matchStart = csvDataSets[a][i].start;
                d.matchEnd = csvDataSets[a][i].end;
                d.matchDirection = csvDataSets[a][i].direction;
                d.color = d.matchName + "_" + d.matchChr;
            }
        });
        //sort parentdata by matchchr for colorMapping
        speciesData.push(childrenData.filter(function(d) {
            return d.name == childrens[a];
        }).sort(function(a, b) {
            if (a.matchChr != b.matchChr) {
                return a.matchChr - b.matchChr;
            } else {
                return a.matchStart - b.matchStart;
            }
        }));

        speciesData.push(parentData.filter(function(d) {
            return d.name == parents[a];
        }).sort(function(a, b) {
            if (a.chr != b.chr) {
                return a.chr - b.chr;
            } else {
                return a.start - b.start;
            }
        }));

        data.push(speciesData);
    }

    colorMapping();

    function colorMapping() {
        var newColorChildData = [];
        for (a = data.length - 2; a >= 1; a--) {
            var colorData = data[a][0];
            var colorData2 = data[a - 1][1];
            var colorData3 = data[a - 1][0];
            
            for(var i = 0; i < data[a-1][1].length; i++) {
                var d = data[a-1][1][i];
                var filterColor = colorData.filter(function(el) {
                    return el.chr == d.chr;
                })

                //break the children blocks into chunks and compare with the parents blocks. 
                filterColor.forEach(function(el) {
                    if (d.start <= el.start && d.end >= el.end) {
                        var firstLength = el.end - d.start
                        var secondLength = d.end - el.end;
                        insertNewBlock(d, el, i, firstLength, secondLength);
                    } else if (d.start >= el.start && d.end <= el.end) {
                        d.color = el.color;
                    } else if (d.start < el.start && d.end < el.end && d.end > el.start) {
                        var firstLength = el.start - d.start
                        var secondLength = d.end - el.start;
                        insertNewBlock(d, el, i, firstLength, secondLength);
                    } else if (d.start > el.start && d.end > el.end && d.start < el.end) {
                        var firstLength = el.end - d.start;
                        var secondLength = d.end - el.end;
                        insertNewBlock(d, el, i, firstLength, secondLength);
                    }
                })
            }
            
            //insert the new chunk into dataset
            function insertNewBlock(d, el, i, firstLength, secondLength) {
                var oldMatchEnd = d.matchEnd;
                d.end = d.start + firstLength;
                d.matchEnd = oldMatchEnd - secondLength;
                d.color = el.color;
                colorData3[i].end = +d.matchEnd;
                colorData3[i].matchEnd = d.end;
                colorData3[i].color = d.color;
                var newBlock = {};
                newBlock["chr"] = d.chr;
                newBlock["color"] = el.color;
                newBlock["direction"] = d.direction;
                newBlock["matchChr"] = d.matchChr;
                newBlock["matchDirection"] = d.matchDirection;
                newBlock["matchName"] = d.matchName;
                newBlock["name"] = d.name;
                newBlock["matchEnd"] = oldMatchEnd;
                newBlock["matchStart"] = oldMatchEnd - secondLength;
                newBlock["start"] = d.end;
                newBlock["end"] = d.end + secondLength;
                var newChildBlock = {};
                newChildBlock["chr"] = newBlock.matchChr;
                newChildBlock["direction"] = newBlock.matchDirection;
                newChildBlock["matchChr"] = newBlock.chr;
                newChildBlock["matchDirection"] = newBlock.direction;
                newChildBlock["matchName"] = newBlock.name;
                newChildBlock["name"] = newBlock.matchName;
                newChildBlock["matchEnd"] = newBlock.end;
                newChildBlock["matchStart"] = newBlock.start;
                newChildBlock["start"] = newBlock.matchStart;
                newChildBlock["end"] = newBlock.matchEnd;
                newChildBlock["color"] = newBlock.color;
                if (newBlock.start != newBlock.end) {
                    data[a - 1][1].splice(i + 1, 0, newBlock);
                    data[a - 1][0].splice(i + 1, 0, newChildBlock);
                }
            }
        }

        for (a = 0; a <= data.length - 1; a++) {
            data[a][0].sort(function(a, b) {
                if (a.chr != b.chr) {
                    return a.chr - b.chr;
                } else {
                    return a.start - b.start;
                }
            });
        }

    }

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

    creatDefs(svg, info, 100, "xbig");
    creatDefs(svg, info, 60, "big");
    creatDefs(svg, info, 60, "mini");

    function directionToStr(direct) {
        if (direct != "plus" && direct != "mins" && direct != "NA") {
            if (direct == "+") {
                return "plus";
            } else if (direct == "-") {
                return "mins";
            } else {
                return "NA";
            }
        } else {
            return direct;
        }
    }

    
    $("#speOne").html("<div class=\"boxTitle\"><img src=png/" + c1 + 
        "_sm.png style=\"width:60px;height:60px;\"><p class=\"textTitle\">" + sName[c1] + 
        "</p><p class=\"textArea\">" + wiki[c1] + "</p><div>");

    $("#speTwo").html("<div class=\"boxTitle\"><img src=png/" + c2 + 
        "_sm.png style=\"width:60px;height:60px;\"><p class=\"textTitle\">" + sName[c2] + 
        "</p><p class=\"textArea\">" + wiki[c2] + "</p><div>");
    
    createMiniTree(localStorage.getItem("miniLife"), info);
    var minitree = d3.cluster().size([1300, 1850]);

    var root = d3.hierarchy(newick.parse(localStorage.getItem("miniLife")), function(d) {
        return d.branchset;
    });
    minitree(root);

    var marker = svg.append('svg:defs')
    .append('svg:marker')
    .attr('id', function(d) {
        return "end";
    })
    .attr('markerHeight', 4.0)
    .attr('markerWidth', 4.0)
    .attr('markerUnits', 'strokeWidth')
    .attr('orient', 'auto')
    .attr('refX', 0.5)
    .attr('refY', 5)
    .attr('viewBox', "-5 -5 15 15")
    .append('svg:path')
    .attr('d', "M 7 0 L 7 10 L -3 5 z")
    .attr('fill', "#CACAC9");

    var link = svg.selectAll("path.link")
    .data(root.descendants().slice(1))
    .enter()
    .append("svg:path")
    .attr("class", "links_big")
    .attr("id", function(d) {
        return d.parent.data.name + "_" + d.data.name;
    }) 
    .attr("marker-start", "url(#end)")
    .attr("fill", "none")
    .attr("d", function(d) {
        var rotation = 0,
        x1 = 0,
        dy = d.x - d.parent.x,
        dx = d.y - d.parent.y,
        dr = Math.sqrt(dx * dx + dy * dy);
        if (dy > 0) {
            rotation = 1;
            x1 = 30
        } else {
            rotation = 0;
            x1 = -10
        }
        return "M" + (d.y - 60) + "," + d.x + "A" + dr + "," + dr + 
        " 0 0," + (rotation) + " " + (d.parent.y + 100) + "," + (d.parent.x + x1);
    })
    .attr("stroke", "#CACAC9")
    .attr("stroke-width", "35")
    .style("cursor", "pointer");

    linkAnimation();
    function linkAnimation() {
        link.transition()
        .duration(750)
        .attr("stroke-width", "38")
        .transition().duration(750)
        .attr("stroke-width", "35")
        .on("end", linkAnimation);
    }

    var node = svg.selectAll("g.node")
    .data(root.descendants().reverse())
    .enter()
    .append("g")
    .attr("id", function(d) {
        return d.data.name;
    }).attr("class", function(d) {
        if (d.data.name != '') {
            return "node" + (d.children ? " node--internal" : " node--leaf");
        }
    }).attr("transform", function(d) {
        if (d.children) {
            return "translate(" + (d.y - 15) + "," + (d.x - 40) + ")";
        } else {
            return "translate(" + (d.y - 15) + "," + (d.x - 40) + ")";
        }
    }).attr("initial-transform", function(d) {
        if (d.children) {
            return "translate(" + (d.y - 15) + "," + (d.x - 40) + ")";
        } else {
            return "translate(" + (d.y - 15) + "," + (d.x - 40) + ")";
        }
    });

    svg.selectAll('g.node')
    .append("rect")
    .attr("width", 100)
    .attr("height", 100)
    .attr("fill", function(d) {
        return "url(#svg" + d.data.name + "_xbig)";
    });

    svg.selectAll('g.node')
    .append("text")
    .attr("transform", function(d) {
        return "translate(" + 100 + "," + 65 + ")";
    }).attr("text-anchor", "start")
    .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
    .attr('font-size', '15px')
    .attr('fill', 'white')
    .text(function(d) {
        if (sName[d.data.name] != "") {
            return sName[d.data.name];
        } else {
            return d.data.name;
        }
    });

    svg.selectAll('g.node').append("g").attr("class", function(d) {
        return d.data.name + "_chart chrChart";
    }).attr("id", function(d) {
        return d.data.name + "_children";
    }).attr("transform", function(d) {
        return "translate(" + 100 + "," + 85 + ")";
    });

    
    for (b = data.length - 1; b >= 0; b--) {
        if(parents[b] == p){
          buildChr(data[b][1], p, childrens[b]);
      }
      buildChr(data[b][0], childrens[b], parents[b]);
  }
  forward_pointer_event();
  
  var selectedBar = [];
  var selectedLink = [];

  $(".mode").click(function() {
    $("#" + mode).css("color", "#555555");
    $(this).css("color", "#d23600");
    mode = $(this).attr("id");
    if (mode == "forward" || mode == "backward") {
        $("#morphthenslide").css("color", "#d23600");
        d3.select("#tree")
        .attr("transform", "translate(" + margin.left + "," + (-130) + ")");
        d3.selectAll(".circos").remove();
        d3.selectAll(".chrChart path").remove();
        for (b = data.length - 1; b >= 0; b--) {
            d3.select("#" + childrens[b] + " text").style("opacity", 1);
            d3.select("#" + parents[b] + " text").style("opacity", 1);
        }
        d3.selectAll(".chrChart").attr("visibility", "visible");
        if(mode == "forward"){ 
          forward_pointer_event();
      }

      if(mode == "backward"){
          backward_pointer_event();
      }
  }
  else if(mode == "static"){
    forward_pointer_event();
    $("#morphthenslide").css("color", "#555555");
    d3.select("#tree")
    .attr("transform", "translate(" + margin.left + "," + (-130) + ")");
    selectedLink = [];
    for (b = data.length - 1; b >= 0; b--) {
        d3.select("#" + childrens[b] + " text").style("opacity", 1);
        d3.select("#" + parents[b] + " text").style("opacity", 1);
    }
    d3.selectAll(".circos").remove();
    d3.selectAll(".chrChart").attr("visibility", "visible");
}
else if(mode == "circos"){
    $("#morphthenslide").css("color", "#555555");
    selectedLink = [];
    d3.selectAll(".chrChart").attr("visibility", "hidden");
    for (b = data.length - 1; b >= 0; b--) {
      circos(data[b][1], data[b][0], childrens[b], parents[b]);
  }
}
});


  $(document).on('click', '.bar', function() {

    var id = $(this).attr("id"),
    chr = id.split("_")[1];
    var spe = $(this).parent().parent().attr("class").split("_")[0];
    var current_spe = spe;
    var type = $(this).parent().parent().attr("id").split("_")[1];
    
    id = current_spe + "_" + chr;

    if(mode == "backward"){
        var childIndex = childrens.indexOf(current_spe);
        current_spe = parents[childIndex];
        type = d3.select("." + current_spe + "_chart").attr("id").split("_")[1];
        id = spe + "_" + chr;
    }
    var index = [];
    for (a = 0; a < parents.length; a++) {
        if (parents[a] == current_spe) {
            index.push(a);
        }
    }

    if (type == "children") {
        d3.selectAll("." + current_spe + "_chart g").remove();
        for (i = 0; i < index.length; i++) {
            var pos = index[i];
            buildChr(data[pos][1], current_spe, childrens[pos]);
        }
        $("." + current_spe + "_chart").attr("id", current_spe + "_parent");
    }

        //for static mode
        if (selectedBar.indexOf(current_spe) > -1) {
            d3.select("." + current_spe + "_chart").selectAll("path").remove();
        }
        if (selectedBar.indexOf(current_spe) === -1) {
            selectedBar.push(current_spe);
        }
        
        //loop through all the children of the parent when parent have two children
        for (i = 0; i < index.length; i++) {
            var pos = index[i];
            
            var childrenType = d3.select("." + childrens[pos] + "_chart").attr("id").split("_")[1];

            if(childrenType != "children" || mode == "forward"){
                d3.selectAll("." + childrens[pos] + "_chart g").remove();    
                buildChr(data[pos][0], childrens[pos], current_spe);
                d3.selectAll("." + childrens[pos] + "_chart").attr("id", childrens[pos] + "_children");  
            }
            
            if (mode == "static") {
                var index2 = selectedLink.indexOf(current_spe + "_" + childrens[pos]);
                if (index2 > -1) {
                    selectedLink.splice(index2, 1);
                }
                static();
            } else if (mode == "forward") {
                var copy = clone("#" + id + "_" + childrens[pos]);
                morphthenslide();
            }
            else if(mode == "backward"){
                var copy = clone("#" + id + "_" + current_spe);
                morphthenslide();
            }

            if(mode == "forward" && mode == "static"){ 
                forward_pointer_event();
            }else if(mode == "backward"){
                backward_pointer_event();
            }

            function static() {
                var data2 = data[pos][1];
                var chrData = data2.filter(function(d) {
                    return d.chr == chr;
                });
                createLinks(current_spe, childrens[pos], chrData)
            }

            function morphthenslide() {
                copy.attr("class", "clone");
                copy.selectAll(".block").style("fill", function() {
                    var color = $(this).css("fill");
                    color = color.replace(/[^\d,]/g, '').split(',');
                    return LightenDarkenColor(color, 10);
                }).transition().duration(5000).attr("class", function() {
                    return $(this).attr('class') + "_clone";
                }).attr("id", function() {
                    return $(this).attr('id') + "_clone";
                }).attr("transform", function() {
                    var matchName = $(this).attr('class').split(' ')[1].split('_')[0];
                    var matchDirection = $(this).attr('class').split(' ')[1].split('_')[4];
                    var name = $(this).attr('id').split('_')[0];
                    var direction = $(this).attr('id').split('_')[4];
                    var x1 = d3.select("#" + $(this).attr('class').split(' ')[1]).attr("transform");
                    var transform = getTranslation(d3.select("#" + matchName).attr("transform"));
                    var transform2 = getTranslation(d3.select("#" + name).attr("transform"));
                    var x = transform[0] - transform2[0];
                    var y = transform[1] - transform2[1];
                    var w = $(this).attr('width');
                    var h = $(this).attr('height');
                    var rotate = 0;
                    if (matchDirection != direction) {
                        if (matchDirection == "plus") {
                            rotate = 180;
                        } else if (matchDirection == "mins") {
                            rotate = -180;
                        } else {
                            rotate = 0;
                        }
                        return x1 + "translate(" + x + "," + y + ")rotate(" + rotate + " " + w / 2 + " " + h / 2 + ")";
                    } else { 
                        return x1 + "translate(" + x + "," + y + ")";
                    }
                }).on('end', function() {
                    d3.select(this).remove()
                });
            }
        }
    })

$(".links_big").click(function() {
    var link = d3.select(this);
    d3.selectAll(".clone text").remove();

    var parent = $(this).attr('id').split('_')[0],
    child = $(this).attr('id').split('_')[1];

    var index = childrens.indexOf(child);

    d3.selectAll("." + parent + "_chart g").remove();
    buildChr(data[index][1], parent, child);
    if(mode == "backward"){
    	$("." + parent + "_chart").attr("id", parent + "_parent");
    }
    else{
    	$("." + parent + "_chart").attr("id", parent + "_children");
    }
    
    d3.selectAll("." + child + "_chart g").remove();
    buildChr(data[index][0], child, parent);
    if(mode == "backward"){
    	$("." + child + "_chart").attr("id", child + "_children");
    }
    else{
    	$("." + child + "_chart").attr("id", child + "_parent");
    }

    if (mode == "static") {
        var index2 = selectedLink.indexOf(parent + "_" + child);
        if (index2 > -1) {
            d3.select("." + parent + "_chart").selectAll("." + parent + "_" + child + "_link").remove();
            selectedLink.splice(index2, 1);
        }
        if (index2 === -1) {
            selectedLink.push(parent + "_" + child);
            staticLink();
        }
    } else if (mode == "forward" || mode == "backward") {
        morphthenslideLink();
    }else if (mode == "circos"){
        var index2 = selectedLink.indexOf(parent + "_" + child);
        if (index2 > -1) {
            d3.select("." + parent + "_" + child + "_circos")
            .selectAll(".ribbons path").style("opacity", 0);
            selectedLink.splice(index2, 1);
        }
        if (index2 === -1) {
            selectedLink.push(parent + "_" + child);
            d3.select("." + parent + "_" + child + "_circos")
            .selectAll(".ribbons path").style("opacity", 0.5);
        }

    }

    function staticLink() {
        var data2 = data[index][1];
        createLinks(parent, child, data2)
        forward_pointer_event();
    }

    function morphthenslideLink() {
        d3.selectAll(".block_boarder").style("opacity", 0);
        d3.selectAll(".links_big").style("pointer-events", "none");
        if(mode == "backward"){
            var selection = d3.select("." + child + "_chart");
            backward_pointer_event();
        }
        else if(mode == "forward"){
            var selection = d3.select("." + parent + "_chart");
            forward_pointer_event();
        }
        
        selection.selectAll(".block").transition().duration(7000).attr("transform", function() {
            var matchDirection = $(this).attr('class').split(' ')[1].split('_')[4];
            var direction = $(this).attr('id').split('_')[4];
            var x1 = d3.select("#" + $(this).attr('class').split(' ')[1]).attr("transform");
            var w = $(this).attr('width');
            var h = $(this).attr('height');
            var rotate = 0;
            if (matchDirection != direction) {
                if (matchDirection == "plus") {
                    rotate = 180;
                } else if (matchDirection == "mins") {
                    rotate = -180;
                } else {
                    rotate = 0;
                }
                return x1 + "rotate(" + rotate + " " + w / 2 + " " + h / 2 + ")";
                } else { 
                    return x1;
                }
            });
        selection.selectAll(".bar").transition().duration(4000).delay(7000).attr("transform", function() {
            if(mode == "backward"){
                var transform2 = getTranslation(d3.select("#" + child).attr("transform"));
                var transform = getTranslation(d3.select("#" + parent).attr("transform"));
            }
            else if(mode == "forward"){
                var transform = getTranslation(d3.select("#" + child).attr("transform"));
                var transform2 = getTranslation(d3.select("#" + parent).attr("transform"));
            }
            
            var x = transform[0] - transform2[0];
            var y = transform[1] - transform2[1];
            return "translate(" + x + "," + y + ")";
        }).on('end', function() {
            selection.selectAll(".block").attr("transform", function() {
                var matchDirection = $(this).attr('class').split(' ')[1].split('_')[4];
                var direction = $(this).attr('id').split('_')[4];
                var x1 = $(this).attr("original-transform");
                var w = $(this).attr('width');
                var h = $(this).attr('height');
                var rotate = 0;
                if (matchDirection != direction) {
                    if (matchDirection == "plus") {
                        rotate = -180;
                    } else if (matchDirection == "mins") {
                        rotate = 180;
                    } else {
                        rotate = 0;
                    }
                    return x1 + "rotate(" + rotate + " " + w / 2 + " " + h / 2 + ")";
                    } else { 
                        return x1;
                    }
                });
            selection.selectAll(".bar").attr("transform", function() {
                return "translate(" + 0 + "," + 0 + ")";
            });

            d3.selectAll(".links_big").style("pointer-events", "auto");
            d3.selectAll(".block_boarder").style("opacity", 1);
        });
    }
})
});

function createLinks(spe, child, data) {
    var link = d3.select("." + spe + "_chart").selectAll(".link").data(data).enter().insert("path").attr("class", spe + "_" + child + "_link").attr("d", function(d) {
        var sourceId = d.name + "_" + d.chr + "_" + d.start + "_" + d.end + "_" + d.direction;
        var targetId = d.matchName + "_" + d.matchChr + "_" + d.matchStart + "_" + d.matchEnd + "_" + d.matchDirection;
        var sourceHeight = d3.select("#" + sourceId).attr("height");
        var targetHeight = d3.select("#" + targetId).attr("height");
        var sourceTransform = getTranslation(d3.select("#" + sourceId).attr("transform"));
        var targetTransform = getTranslation(d3.select("#" + targetId).attr("transform"));
        var sourceTransform2 = getTranslation(d3.select("#" + d.name).attr("transform"))
        var targetTransform2 = getTranslation(d3.select("#" + d.matchName).attr("transform"))
        var x1 = sourceTransform[0] + 23 //+ sourceTransform2[0];
        var y1 = sourceTransform[1] + sourceHeight / 2 //+ sourceTransform2[1];
        var x2 = targetTransform[0] + targetTransform2[0] - sourceTransform2[0];
        var y2 = targetTransform[1] + targetTransform2[1] - sourceTransform2[1] + targetHeight / 2;
        return "M" + x1 + "," + y1 + "C" + (x1 + x2) / 2 + "," + y1 + " " + (x1 + x2) / 2 + "," + y2 + " " + x2 + "," + y2;
    }).attr("stroke", function(d) {
        if (d.name == p) {
            return colorScale(d.chr);
        } else {
            return $("." + d.color).css("fill");
        }
    }).attr("stroke-width", "1").attr("fill", "none");
}

function cal_rowDis(temparray) {
    var temp = temparray.map(function(a) {
        return a.values;
    });
    var max_end = 0;
    for (a = 0; a < temp.length; a++) {
        max_end = Math.max(max_end, d3.max(temp[a], function(d) {
            return d.end;
        }));
    }
    return max_end;
}

function buildChr(data, parentSpe, childSpe) {
    var groupedData = d3.nest().key(function(d) {
        return d.chr;
    }).entries(data);
    var i, j, temparray, chunk = 7,
    num = 0,
    row = 0;
    for (i = 0, j = groupedData.length; i < j; i += chunk) {
        temparray = groupedData.slice(i, i + chunk);
        x.domain(temparray.map(function(d) {
            return d.key;
        }));

        y = d3.scaleLinear().rangeRound([num, num + 140]);
        y.domain([0, d3.max(data, function(d) {
            return d.end;
        })]).nice();

        var layer = d3.select("." + parentSpe + "_chart")
        .append("g")
        .attr("class", parentSpe + "_" + childSpe + "_row" + row).selectAll(".row" + row).data(temparray).enter().append("g").attr("class", "row" + row + " " + "bar").attr("id", function(d) {
            return parentSpe + "_" + d.key + "_" + childSpe;
        });
        appendRow(num, temparray, data, layer, parentSpe);
        row++;
        num = y(cal_rowDis(temparray)) + 15;
    }
}

function appendRow(num, temparray, data, layer, spe) {
    var chr_data = {}
    var data2 = temparray.map(function(d) {
        return d.values;
    });

    for(var i = 0; i < data2.length; i++){
        for(var j = 0; j < data2[i].length; j++){
            var chr = data2[i][j].chr;
            var end = data2[i][j].end;

            if(chr_data[chr] === undefined){
                chr_data[chr] = end;
            }else if(end > chr_data[chr]){
                chr_data[chr] = end;
            }
        }
    }
    
    var chromosomes = layer.selectAll("rect").data(function(d) {
        return d.values;
    }).enter().append("rect").attr("class", function(d) {
        current_chr = d.chr;
        return d.name + "_" + d.chr + " " + d.matchName + "_" + d.matchChr + "_" + d.matchStart + "_" + d.matchEnd + "_" + d.matchDirection + " block";
    }).attr("id", function(d) {
        return d.name + "_" + d.chr + "_" + d.start + "_" + d.end + "_" + d.direction;
    }).attr("transform", function(d) {
        return "translate(" + x(d.chr) + "," + y(d.start) + ") rotate(0)";
    }).attr("original-transform", function(d) {
        return "translate(" + x(d.chr) + "," + y(d.start) + ") rotate(0)";
    }).attr("height", function(d) {
        return y(d.end) - y(d.start);
    }).attr("width", 23).style("fill", function(d) {
        if (d.name == p) {
            return colorScale(d.chr);
        } else if (d.color == "empty") {
            return "#ffffff";
        } else {
            return $("." + d.color).css("fill");
        }
    }).style("cursor", "pointer");


    layer.append("rect")
    .attr("class", "block_boarder")
    .attr("transform", function(d) {
        return "translate(" + x(d.key) + "," + y(0) + ") rotate(0)";
    })
    .attr("height", function(d) {
        return y(chr_data[d.key]) - y(0);
    }).attr("width", 23).style("stroke", "grey").style("fill","none")
    

    layer.append("text").attr("id", function(d) {
        return spe + "_" + d.key + "_text";
    }).attr("transform", function(d) {
        return "translate(" + (x(d.key) - 12) + "," + (0 + num) + ")";
    }).attr("orginal-transform", function(d) {
        return "translate(" + (x(d.key) - 12) + "," + (0 + num) + ")";
    }).attr("text-anchor", "start").attr('font-size', '10px').attr('fill', 'white').text(function(d) {
        return d.key;
    });
}

function circos(data, data2, childSpe, parentSpe) {
    d3.select("#tree")
    .attr("transform", "translate(" + (margin.left) + "," + (-50) + ")scale(1.2)");

    var groupCounts = {};
    var translocations = [];
    var color = [];
    var chr = [];
    
    var uniqueCounts = {};
    var unique= [];
    
    var transform2 = getTranslation(d3.select("#" + childSpe).attr("transform"));
    var transform = getTranslation(d3.select("#" + parentSpe).attr("transform"));

    var width = transform2[0] - transform[0],
    height = 650,
    innerRadius = Math.min(width, height) * .3 * 1.2,
    outerRadius = innerRadius * 1.06;

    var x1 = transform[0]*1.2+ (margin.left + 20);
    var x2 = transform2[0]*1.2+ (margin.left + 20);
    var y1 = transform[1]*1.2 - 50;
    var y2 = transform2[1]*1.2 - 50;

    var y;
    if(y2 > y1){
        y = y1 + (y2 - y1);
    }
    else if(y2 == y1){
        y = y2*1.1
    }
    else{
        y = y2 + (y1 - y2)/2.5;
    }
    var x = x1 + (x2 - x1)/1.8;

    data2.forEach(function(d, i) {
        if(uniqueCounts[d.chr + d.name] === undefined){
            uniqueCounts[d.chr + d.name] = 1;
            unique.push(i);
        }
        if (groupCounts[d.chr + d.name + d.start + d.end] === undefined) {
            groupCounts[d.chr + d.name + d.start + d.end] = Math.abs(d.end - d.start);
            color.push(d.color);
            chr.push(d.name + "_" + d.chr);
        }
    })
    data.reverse().forEach(function(d, i) {
        if(uniqueCounts[d.chr + d.name] === undefined){
            uniqueCounts[d.chr + d.name] = 1;
            unique.push(i + data2.length);
        }
        if (groupCounts[d.chr + d.name + d.start + d.end] === undefined) {
            groupCounts[d.chr + d.name + d.start + d.end] = Math.abs(d.end - d.start);
            color.push(d.color);
            chr.push(d.name + "_" + d.chr);
        }
    })
    
    data.forEach(function(d, i) {
        var path = [];
        path.push(Object.keys(groupCounts).indexOf(d.chr + d.name + d.start + d.end));
        path.push(0);
        path.push(Object.keys(groupCounts).indexOf(d.matchChr + d.matchName + d.matchStart + d.matchEnd));
        path.push(0);
        path.push(Math.abs(d.end - d.start));
        path.push(Math.abs(d.end - d.start));
        path.push(d.color);
        translocations.push(path);
    })
    
    var groups = $.map(groupCounts,function(k,v){
        return k;
    });

    data.reverse();
    
    var translocationgraph = translocation()
    .data(chr)
    .padding(0.015)
    .groups(groups)
    .edges(translocations);

    var g = d3.select("#chrSvg").append("g")
    .attr("transform", "translate(" + x + "," + y + ")")
    .attr("class", parentSpe + "_" + childSpe + "_circos circos")
    .attr('pointer-events', 'all');

    var line = g.append("line")       
    .style("stroke", "white")  
    .attr("x1", 0)     
    .attr("y1", -innerRadius * 0.9)      
    .attr("x2", 0)     
    .attr("y2", innerRadius * 0.9);   

    d3.select("#" + childSpe + " text").style("opacity", 0);
    d3.select("#" + parentSpe + " text").style("opacity", 0);

    var text = g.append("text")
    .attr("x", -innerRadius/2)
    .attr("y", 0)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr('fill', 'white')
    .text(function() {if (sName[parentSpe] != "") {
        return sName[parentSpe];
    } else {
        return parentSpe;
    }});

    var text2 = g.append("text")
    .attr("x", innerRadius/2)
    .attr("y", 0)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr('fill', 'white')
    .text(function() {if (sName[childSpe] != "") {
        return sName[childSpe];
    } else {
        return childSpe;
    }});

    var group = g.append("g").attr("class", "groups").selectAll("g").data(translocationgraph.groups).enter().append("g");
    group.append("path").style("fill", function(d) {
        var c = chr[d.index]
        if (c.split("_")[0] == p) {
            return colorScale(c.split("_")[1]);
        } else {
            return $("." + color[d.index]).css("fill");
        }
    })
    .attr("class",function(d){return chr[d.index];})
    .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
    .on("click",fade(0.5));
    
    group.append("text")
    .filter(function(d) { return unique.indexOf(d.index) != -1; })
    .each(function(d) { 
        d.angle = d.startAngle + 0.05; 
        if(d.angle > (7/8)* Math.PI && d.angle < (9/8)* Math.PI){
            d.angle = d.startAngle; 
        }
        
    })
    .attr('font-size', '9px')
    .attr("transform", function(d) {
        if(d.angle > (7/8)* Math.PI && d.angle < (9/8)* Math.PI){
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
            + "translate(" + (chr[d.index].split("_")[1] % 2 == 0 ? (innerRadius + 35) : (innerRadius + 26))  + ")rotate(-90)"
            ;
        }
        else{
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
            + "translate(" + (innerRadius + 18) + ")"
            + (d.angle > Math.PI ? "rotate(180)" : "");
        }
        
    })
    .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : ""; })
    .text(function(d) { return chr[d.index].split("_")[1]; });

    g.append("g").attr("class", "ribbons")
    .selectAll("path")
    .data(translocationgraph.edges).enter().append("path")
    .attr("id", function(d){
        return chr[d.source.index] + "_" + chr[d.target.index];
    })
    .attr("d", d3.ribbon().radius(innerRadius))
    .style("fill", function(d) {
        var c = chr[d.source.index]
        if (c.split("_")[0] == p) {
            return colorScale(c.split("_")[1]);
        } else {
            return $("." + color[d.source.index]).css("fill");
        }
    }).style("opacity", 0)
    .attr('pointer-events', 'none');
    
    function fade(opacity) {
        return function(g, i) {
            var path = d3.select("." + parentSpe + "_" + childSpe + "_circos")
            .selectAll(".ribbons path");
            path.style("opacity", 0);
            path.filter(function(d) {
                return chr[d.source.index] == chr[g.index] ;
            }).transition().style("opacity", opacity);
        };
    }
}

function forward_pointer_event(){
    d3.selectAll(".chrChart").selectAll("rect").style("pointer-events", "auto");
    if(p != c1){
        d3.select("." + c1 + "_chart").selectAll("rect").style("pointer-events", "none");
        d3.select("." + c2 + "_chart").selectAll("rect").style("pointer-events", "none");  
    }else{
        d3.select("." + c2 + "_chart").selectAll("rect").style("pointer-events", "none");
    }
}

function backward_pointer_event(){
    d3.selectAll(".chrChart").selectAll("rect").style("pointer-events", "auto");
    d3.select("." + p + "_chart").selectAll("rect").style("pointer-events", "none");
}

function getTranslation(transform) {
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttributeNS(null, "transform", transform);
    var matrix = g.transform.baseVal.consolidate().matrix;
    return [matrix.e, matrix.f];
}

function clone(selector) {
    var node = d3.select(selector).node();
    return d3.select(node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling));
}

function getFileName(array) {
    if (array.length > 1) {
        for (var a = 0; a < array.length - 1; a++) {
            filenames.push("./data/" + array[a + 1] + "/" + array[a + 1] + "_" + array[a] + ".csv");
            parents.push(array[a + 1]);
        }
    }
    filenames.push("./data/" + p + "/" + p + "_" + array[array.length - 1] + ".csv")
    parents.push(p);
}

function LightenDarkenColor(color, percent) {
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var hsl = rgbToHsl(r, g, b)
    var h = Math.round(hsl[0]);
    var s = Math.round(hsl[1] * 100);
    var l = Math.round(hsl[2] * 100) + percent;
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = (max - min);
        s = l >= 0.5 ? d / (2 - (max + min)) : d / (max + min);
        switch (max) {
            case r:
            h = ((g - b) / d + 0) * 60;
            break;
            case g:
            h = ((b - r) / d + 2) * 60;
            break;
            case b:
            h = ((r - g) / d + 4) * 60;
            break;
        }
    }
    return [h, s, l];
}
