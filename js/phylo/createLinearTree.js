var disable_Parents;
function creatLinearTree(life, info, baseSvg) {
    var showTime = 0;
    var showName = 1;
    $("#show_name").css("color", "#d23600");
    

    $("#zoomValue").val('100');
    var tree = d3.cluster().separation(function(a, b) {
        return (a.parent == b.parent ? 1 : 1)
    })
    .size([h * 3, w]);

    var parsedData = newick.parse(life);
    var root = d3.hierarchy(parsedData, function(d) {
        return d.branchset;
    });
    var diagonal = getDiagonal();

    $("#zoomValue").change(function() {
        zoomValue = $("#zoomValue").val();
        baseSvg.transition()
        .duration(150)
        .call(zoom.transform, d3.zoomIdentity
            .translate(30, 0)
            .scale(zoomValue / 100));
    });
    
    $("#show_timeLine").click(function(){
        if(showTime == 0){
         $("#show_timeLine").css("color", "#d23600");
         showTimeLine();
         showTime = 1;
     }
     else{
         $("#show_timeLine").css("color", "#555555");
         d3.select(".xaxis").remove(); 
         showTime = 0;
     }
 });

    $("#show_name").click(function(){
        if(showName == 0){
         $("#show_name").css("color", "#d23600");
         chart.selectAll("g.node").select("text").style("opacity", 1);
         showName = 1;
     }
     else{
         $("#show_name").css("color", "#555555");
         chart.selectAll("g.node").select("text").style("opacity", 0);
         showName = 0;
     }
 });

    $("#radial").click(function() {
        $("#show_timeLine").css("color", "#555555");
        d3.select(".xaxis").remove(); 
        showTime = 0;

    });

    var chart = baseSvg.append("g").attr("transform", "translate(50, 20)");
    tree(root);

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

    scaleBranchLengths(root.descendants(), w);

    var link = chart.selectAll("path.link")
    .data(root.links())
    .enter().append("svg:path")
    .attr("class", function(d) {
        var nodeP = d.source;
        var node2 = d.target;
        while (nodeP.data.name == "") {
            nodeP = nodeP.parent;
        }
        function getDescendants(node) {
            var nameP = nodeP.data.name;
            var name = "";
            if (node.children) {
                node.children.forEach(function(d) {
                    if (d.data.name != "") {
                        name = " " + nameP + "-" + d.data.name + name;
                    } else {
                        name += " " + nameP + "-" + getDescendants(d);
                    }
                })
                name += " " + nameP + "-" + node.data.name;
            } else {
                var name = "";
                name = nameP + "-" + node.data.name;
            }
            return name;
        }
        return getDescendants(node2) + " links";
    })
    .attr("d", diagonal)
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("stroke-width", "2px");

    var node = chart.selectAll("g.node")
    .data(root.descendants())
    .enter().append("g")
    .attr("id", function(d) {
        return d.data.name;
    })
    .attr("class", function(d) {
        if (d.data.name != '') {
            return "node" +
            (d.children ? " node--internal" : " node--leaf");
        }
    })
    .attr("transform", function(d) {
        if (d.children) {
            return "translate(" + (d.y - 40) + "," + (d.x - 35) + ")";
        } else {
            return "translate(" + (d.y - 2) + "," + (d.x - 35) + ")";
        }
    })
    .attr("initial-transform", function(d) {
        if (d.children) {
            return "translate(" + (d.y - 40) + "," + (d.x - 35) + ")";
        } else {
            return "translate(" + (d.y - 2) + "," + (d.x - 35) + ")";
        }
    })
    .on("click", function(d) {
        if (selected == 0) {
            $(".button").hide(); 
            d3.selectAll(".boarder").attr("opacity",0);
            d3.select("#boarder" + d.data.name).attr("opacity",1);
            disable_Parents = [];
            var node = d;
            while (node.parent !== null) {
                if (node.parent.data.name != "") {
                    disable_Parents.push(node.parent.data.name);
                }
                node = node.parent;
            }

            for(i = 0; i < disable_Parents.length; i++){
                d3.select("#" + disable_Parents[i])
                .attr("pointer-events", "none")
                .attr("opacity",0.5);
            }

            d3.selectAll(".links").style("stroke", "#000000").style("stroke-width", "2");
            firstNode = d;
            selected = 1;
            firstNodeName = "" + d.data.name;
            $("#speOne").html("<div class=\"boxTitle\"><img src=png/" + d.data.name + 
                "_sm.png style=\"width:60px;height:60px;\"><p class=\"textTitle\">" + 
                sName[d.data.name] + "</p><p class=\"textArea\">" +
                 wiki[d.data.name] + "</p><div>");
            $("#speTwo").html("Click Icons to Select Species.")
            d3.selectAll('#miniTree svg').remove();
        } else if (selected == 1) {
            d3.select("#boarder" + d.data.name).attr("opacity",1);
            for(i = 0; i < disable_Parents.length; i++){
                d3.select("#" + disable_Parents[i])
                .attr("pointer-events", "all")
                .attr("opacity",1);
            }
            secondNode = d;
            if(firstNode == secondNode){
                alert("Please select a different species");
            }
            else{
                $("#genome").show();
                selected = 0;
                secondNodeName = "" + d.data.name;
                $("#speTwo").html("<div class=\"boxTitle\"><img src=png/" + d.data.name + 
                    "_sm.png style=\"width:60px;height:60px;\"><p class=\"textTitle\">" +
                     sName[d.data.name] + "</p><p class=\"textArea\">" + 
                     wiki[d.data.name] + "</p><div>");
                var miniLife = buildMiniTree(firstNode, secondNode);
                localStorage.setItem("miniLife", miniLife);
                createMiniTree(miniLife, info);
            }

        }

    })
    .attr("pointer-events", function(d) {
        if (sName[d.data.name] != "") {
            return "all";
        } else {
            return "none";
        }

    })
    .attr("cursor", function(d) {
        if (sName[d.data.name] != "") {
            return "pointer";
        } 

    })
    .attr("opacity", function(d) {
        if (sName[d.data.name] != "") {
            return 1;
        } else {
            return 0.5;
        }

    });

    chart.selectAll('g.node')
    .append("rect")
    .attr("width", function(d) {
        if (sName[d.data.name] != "") {
            return 80;
        } else {
            return 60;
        }
    })
    .attr("height", function(d) {
        if (sName[d.data.name] != "") {
            return 80;
        } else {
            return 60;
        }
    })
    .attr("fill", function(d) {
        if (sName[d.data.name] != "") {
            return "url(#svg" + d.data.name + "_big)";
        } else {
            return "url(#svg" + d.data.name + "_mini)";
        }

    });
    
    chart.selectAll('g.node')
    .filter(function(d){
        return sName[d.data.name] != "";
    })
    .append("circle")
    .attr("class","boarder")
    .attr("id",function(d){
        return "boarder" + d.data.name;
    })
    .attr("cx", 40)
    .attr("cy", 40)
    .attr("stroke","#1E90FF")
    .attr("stroke-width","5")
    .attr("fill","none")
    .attr("opacity",0)
    .attr("r", 40)


    chart.selectAll('g.node').append("text")
    .attr("dx", function(d){
        if(d.children){
            return -120;
        }
        else{
            return 85;
        }
    })
    .attr("dy", 40)
    .attr("text-anchor", "start")
    .attr("font-family", "Raleway', sans-serif")
    .attr('font-size', '15px')
    .attr('fill', 'white')
    .text(function(d) {
        if (sName[d.data.name] != "") {
            return sName[d.data.name];
        } else {
            return d.data.name;
        }
    });

    
    function showTimeLine() {
        var rootDist = root.descendants().map(function(n) {
            return n.data.length;
        });
        rootDists = d3.max(rootDist);
        d3.select('.xaxis').remove();
        
        timeLineScale = d3.scaleLinear()
        .domain([rootDists, 0])
        .rangeRound([0, w * scale2]).nice();

        xAxis = d3.axisBottom(timeLineScale);

        d3.select(".timeLine").append("g")
        .attr("class", "xaxis")
        .attr("transform", function() {
            if (frameTranslate !== null && dragTransform !== null) {
                return "translate(" + (frameTranslate[0]+35) + "," + 20 + ")";
            } else {
                return "translate(35," + 20 + ")";
            }
        })
        .call(xAxis.ticks(5))
        .selectAll("text")
        .style("font-size", "15px");
    }

}