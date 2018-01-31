function creatRadialTree(life, info, baseSvg) {
   var showTime = 0;
   var showName = 1;
   $("#show_name").css("color", "#d23600");
   $("#zoomValue").val('100');
   outerRadius = w / 2.8, innerRadius = outerRadius - 170;

   creatDefs(baseSvg, info, 60, "big");

   $("#zoomValue").change(function() {
       zoomValue = $("#zoomValue").val();
       console.log(zoomValue);
       baseSvg.transition()
       .duration(150)
       .call(zoom.transform, d3.zoomIdentity
           .translate(0, 0)
           .scale(zoomValue / 100));
   });

   var chart = baseSvg.append("g")
   .attr("transform", "translate(" + (outerRadius * 1.8) + "," + outerRadius + ")");

   var root = d3.hierarchy(newick.parse(life), function(d) {
       return d.branchset;
   })
   .sum(function(d) {
       return d.branchset ? 0 : 1;
   });

   var linearTree = d3.cluster()
   .size([360, innerRadius])
   .separation(function(a, b) {
       return 1;
   });

   linearTree(root);

   setRadius(root, root.data.length = 0, innerRadius / maxLength(root));

   
   $("#show_timeLine").click(function(){
    if(showTime == 0){
     $("#show_timeLine").css("color", "#d23600");
     showRadialTimeLine();
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
     d3.select(".labels").selectAll("text").style("opacity", 1);
     showName = 1;
 }
 else{
     $("#show_name").css("color", "#555555");
     d3.select(".labels").selectAll("text").style("opacity", 0);
     showName = 0;
 }
});

   $("#linear").click(function() {
    $("#show_timeLine").css("color", "#555555");
    d3.select(".xaxis").remove(); 
    showTime = 0;
});

   var link = chart.append("g")
   .selectAll("path")
   .data(root.links())
   .enter().append("path")
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
                     //var name = "";
                     node.children.forEach(function(d) {
                       if (d.data.name != "") {
                           name = " " + nameP + "-" + d.data.name + name;
                       } else {
                           name += " " + nameP + "-" + getDescendants(d);
                       }
                   })
                 } else {
                   var name = "";
                   name = nameP + "-" + node.data.name;
               }
               return name;
           }
           return getDescendants(node2) + " links";
       })
   .each(function(d) {
       d.target.linkNode = this;
   })
   .attr("d", linkConstant);

   var node = chart.selectAll(".node")
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
       return "translate(" + project(d.x, d.y) + ")";
   })
   .attr("initial-transform", function(d) {
       return "rotate(" + (d.x - 96) + ")translate(" + (d.y - 10) + ")" + (d.x <= 180 ? "rotate(0)" : "rotate(180)");
   })
   .on("click", function(d) {
      if (selected == 0) {
        d3.selectAll(".boarder").attr("opacity",0);
        d3.select("#boarder" + d.data.name).attr("opacity",1);
        d3.selectAll(".links").style("stroke", "#000000").style("stroke-width", "2");

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

        firstNode = d;
        selected = 1;
        firstNodeName = "" + d.data.name;
        $("#speOne").html("<div class=\"boxTitle\"><img src=png/" + d.data.name + "_sm.png style=\"width:60px;height:60px;\"><p class=\"textTitle\">" + sName[d.data.name] + "</p><p class=\"textArea\">" + wiki[d.data.name] + "</p><div>");
        $("#speTwo").html("Click Icons to Select Species.")
        d3.selectAll('#miniTree svg').remove();
    } else if (selected == 1) {
       d3.select("#boarder" + d.data.name).attr("opacity",1);
       secondNode = d;

       for(i = 0; i < disable_Parents.length; i++){
        d3.select("#" + disable_Parents[i])
        .attr("pointer-events", "all")
        .attr("opacity",1);
    }
    if(firstNode == secondNode){
        alert("Please select a different species");
    }
    else{
        $("#genome").show();
        selected = 0;
        secondNodeName = "" + d.data.name;
        $("#speTwo").html("<div class=\"boxTitle\"><img src=png/" + d.data.name + "_sm.png style=\"width:60px;height:60px;\"><p class=\"textTitle\">" + sName[d.data.name] + "</p><p class=\"textArea\">" + wiki[d.data.name] + "</p><div>");
        var miniLife = buildMiniTree(firstNode, secondNode);
        localStorage.setItem("miniLife", miniLife);
        createMiniTree(miniLife, info);
    }
}
});


   function showRadialTimeLine() {
       var rootRadius = root.descendants().map(function(n) {
           return n.radius;
       });

       var rootDists = root.descendants().map(function(n) {
           return n.data.length;
       });

       d3.select(".xaxis").remove();

       var radialScale = d3.scaleLinear()
       .domain([d3.max(rootDists), 0])
       .rangeRound([0, -d3.max(rootRadius)]).nice();

       var xAxis = d3.axisRight(radialScale);

       chart.append("g")
       .attr("class", "xaxis")
       .attr("transform", "translate(" + 30 + "," + 18 + ")")
       .call(xAxis.ticks(5))
       .selectAll("text")
       .style("font-size", "15px");

   }

     // adds the circle to the node
     chart.selectAll('g.node')
     .append("rect")
     .attr("width", function(d) {
        if (sName[d.data.name] != "") {
            return 60;
        } else {
            return 50;
        }
    })
     .attr("height", function(d) {
        if (sName[d.data.name] != "") {
            return 60;
        } else {
            return 50;
        }
    })
     .attr("fill", function(d) {
        if (sName[d.data.name] != "") {
            return "url(#svg" + d.data.name + "_mini)";
        } else {
            return "url(#svg" + d.data.name + "_xmini)";
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
     .filter(function(d){
        return sName[d.data.name] != "";
    })
     .append("circle")
     .attr("class","boarder")
     .attr("id",function(d){
        return "boarder" + d.data.name;
    })
     .attr("cx", 30)
     .attr("cy", 30)
     .attr("stroke","#1E90FF")
     .attr("stroke-width","5")
     .attr("fill","none")
     .attr("opacity",0)
     .attr("r", 30)
     
     chart.append("g")
     .attr("class", "labels")
     .selectAll("text")
     .data(root.leaves())
     .enter().append("text")
     .attr("dy", ".85em")
     .attr('fill', '#ffffff')
     .attr("transform", function(d) {
       return "rotate(" + (d.x - 90) + ")translate(" + (innerRadius + 60) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
   })
     .attr("text-anchor", function(d) {
       return d.x < 180 ? "start" : "end";
   })
     .text(function(d) {
       if (sName[d.data.name] != "") {
           return sName[d.data.name].replace(/_/g, " ");
       } else {
           return d.data.name.replace(/_/g, " ");
       }
   })
 }