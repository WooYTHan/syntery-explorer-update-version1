function createMiniTree(life, info) {
   var minitree = d3.cluster()
   .size([220, 300]);
   
   var root = d3.hierarchy(newick.parse(life), function(d) {
       return d.branchset;
   });

   var baseSvg = d3.select("#miniTree").append("svg")
   .attr("id", "miniTreeSvg")
   .attr("width", 390)
   .attr("height", 240)
   .attr("preserveAspectRatio", "xMinYMin meet")
   .attr("viewBox", "0 0 390 240");

   var resize = $("#miniTreeSvg"),
   aspect = resize.width() / resize.height(),
   container = resize.parent();
   $(window).on("resize", function() {
       var targetWidth = container.width();
       resize.attr("width", targetWidth);
       var calHeight = Math.round(targetWidth / aspect);
       if (calHeight < container.height()) {
           resize.attr("height", Math.round(targetWidth / aspect));
       } else {
           resize.attr("height", container.height());
       }
   }).trigger("resize");

   var chart = baseSvg.append("g").attr("transform", "translate(10, -25)");
   minitree(root);


   var marker = baseSvg.append('svg:defs')
   .append('svg:marker')
   .attr('id', function(d) {
       return "end";
   })
   .attr('markerHeight', 5)
   .attr('markerWidth', 5)
   .attr('markerUnits', 'strokeWidth')
   .attr('orient', 'auto')
   .attr('refX', 0)
   .attr('refY', 5.5)
   .attr('viewBox', "-5 -5 15 15")
   .append('svg:path')
   .attr('d', "M -2 5 L 8 0 L 8 10 z")
   .attr('fill', "#ABC2CF");


   var link = chart.selectAll("path.link")
   .data(root.descendants().slice(1))
   .enter().append("svg:path")
   .attr("class", "links_mini")
   .attr("marker-start", "url(#end)")
   .attr("fill", "none")
   .attr("d", function(d) {
       return "M" + d.y + "," + d.x +
       "C" + (d.y + d.parent.y) / 2 + "," + d.x +
       " " + (d.y + d.parent.y) / 2 + "," + d.parent.x +
       " " + d.parent.y + "," + d.parent.x;
   })
   .attr("stroke", "#ABC2CF")
   .attr("stroke-width", "5");

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
           return "translate(" + (d.y - 3) + "," + (d.x - 22) + ")";
       } else {
           return "translate(" + (d.y + 5) + "," + (d.x - 25) + ")";
       }
   })
   .attr("initial-transform", function(d) {
       if (d.children) {
           return "translate(" + (d.y - 3) + "," + (d.x - 22) + ")";
       } else {
           return "translate(" + (d.y + 5) + "," + (d.x - 25) + ")";
       }
   });

     //var yscale = scaleBranchLengths(root.descendants(), 200)

     chart.selectAll('g.node')
     .append("rect")
     .attr("width", 60)
     .attr("height", 60)
     .attr("fill", function(d) {
       return "url(#svg" + d.data.name + "_mini)";
   });

     chart.selectAll('g.node').append("text")
     .attr("x", 10)
     .attr("dy",6.5)
     .attr("text-anchor", "start")
     .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
     .attr('font-size', '11px')
     .attr('fill', 'white')
     .text(function(d) {
       if (sName[d.data.name] != "") {
           return sName[d.data.name];
       } else {
           return d.data.name;
       }
   })
     .call(wrap, 100);

 }