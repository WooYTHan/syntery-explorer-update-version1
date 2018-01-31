function createRadialContextTree(life, info, miniBaseSvg) {

    outerRadius = w * 0.165,
    innerRadius = outerRadius - 180;

    var chart = miniBaseSvg.append("g")
    .attr("transform", "translate(" + (outerRadius / 2 * 1.15) + "," + (outerRadius / 2 - 30) + ")");

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


    var link = chart.append("g")
    .selectAll("path")
    .data(root.links())
    .enter().append("path")
    .each(function(d) {
        d.target.linkNode = this;
    })
    .attr("d", linkConstant)
    .attr("fill", "none")
    .attr("stroke", "#000000");

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
    });

    var rootRadius = root.descendants().map(function(n) {
        return n.radius;
    });

    var rootDists = root.descendants().map(function(n) {
        return n.data.length;
    });

    chart.append("g")
    .selectAll("text")
    .data(root.leaves())
    .enter().append("text")
    .attr('font-size', '8px')
    .attr('fill', '#8C7164')
    .attr("transform", function(d) {
        return "rotate(" + (d.x - 90) + ")translate(" + (innerRadius + 10) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
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