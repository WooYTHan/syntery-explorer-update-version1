function createLinearContextTree(life,info,baseSvg) {
    var tree = d3.cluster().separation(function(a, b) { return (a.parent == b.parent ? 1 : 1) })
    .size([h*3*0.185, 200]);
    var root = d3.hierarchy(newick.parse(life), function(d) {
        return d.branchset;
    });
    
    var diagonal = getDiagonal();
    

    var chart = baseSvg.append("g").attr("transform", "translate(50, -80)");
    tree(root);
    
    var resize = $("#miniBaseSvg"),
    container2 = resize.parent();

    $(window).on("resize", function() {
        var targetWidth = container2.width();
        resize.attr("width", targetWidth);
        resize.attr("height",container2.height());
    }).trigger("resize");


    scaleBranchLengths(root.descendants(), w*0.155);

    var link = chart.selectAll("path.link")
    .data(root.links())
    .enter().append("svg:path")
    .attr("d", diagonal)
    .attr("fill", "none")
    .attr("stroke", "#000000");

    var node = chart.selectAll("g.node")
    .data(root.descendants())
    .enter().append("g")
    .attr("id", function(d) {
        return d.data.name;
    })
    .attr("id",function(d){return d.data.name;})
    .attr("class", function(d) {if(d.data.name != ''){
      return "node" +
      (d.children ? " node--internal" : " node--leaf");
  }})
    .attr("transform", function(d) {
        if(d.children){
            return "translate(" + (d.y - 35) + "," + d.x + ")";}
            else{
                return "translate(" + (d.y + 10) + "," + d.x + ")";    
            }
        })
    .attr("initial-transform",function(d) {
        if(d.children){
            return "translate(" + (d.y - 35) + "," + d.x + ")";}
            else{
                return "translate(" + (d.y + 10) + "," + d.x + ")";    
            }});

    chart.selectAll('g.node').append("svg:text")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("text-anchor", "start")
        //.attr('font-family', 'Raleway, sans-serif')
        .attr('font-size', '9px')
        .attr('fill', '#8C7164')
        .text(function(d) {
            if(sName[d.data.name] != ""){return sName[d.data.name];}
            else{
                return d.data.name;
            } 
        });
        
    }