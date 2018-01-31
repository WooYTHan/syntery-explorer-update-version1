function creatDefs(svg, info, size, name) {
    svg.selectAll("defs")
    .data(info)
    .enter()
    .append("pattern")
    .attr("id", function(d) {
        return "svg" + d.Id + "_" + name;
    })
    .attr('patternUnits', 'userSpaceOnUse')
    .attr("width", size)
    .attr("height", size)
    .append("image")
    .attr("xlink:href", function(d) {
        var url = "png/" + d.Id + "_sm.png";
        if (!imageExists(url)) {
            return "png/dummy.png";
        } else {
            return "png/" + d.Id + "_sm.png";
        }
    })
    .attr("width", size)
    .attr("height", size);

}
function imageExists(url) {
    var image = new Image();
    image.src = url;
    if (image.complete && image.height == 0) {
        return false;
    } 
    return true;
}
function getSubTree(array) {
    var subTree = "";
    var parentheses = "";
    if (array.length > 1) {
        subTree = array[array.length - 1] + ": 1.5";
        for (i = array.length - 2; i >= 0; i--) {
            subTree = array[i] + ":1.5)" + subTree;
            parentheses = "(" + parentheses;
        }
        subTree = parentheses + subTree;
    } else {
        subTree = array[array.length - 1] + ": 1.5";
    }
    return subTree;
}

function getMiniTreeArray(node) {
    var array = [];
    array.push(node.data.name);
    while (node.parent !== null) {
        if (node.parent.data.name != "") {
            array.push(node.parent.data.name);
        }
        node = node.parent;
    }
    
    return array;
}

function sliceArray(array, common) {
    var index = array.indexOf(common);
    return array.slice(0, index);
}

function buildMiniTree(firstNode, secondNode) {
    var miniLife;
    var firstArray = getMiniTreeArray(firstNode);
    var secondArray = getMiniTreeArray(secondNode);
    var common = $.grep(firstArray, function(element) {
        return $.inArray(element, secondArray) !== -1;
    });

    firstArray = sliceArray(firstArray, common[0]);
    secondArray = sliceArray(secondArray, common[0]);

    for (i = 0; i < firstArray.length; i++) {
        if(firstArray[i] != c1){
            d3.select("#boarder" + firstArray[i]).attr("opacity",1);
        }
        d3.selectAll("." + common[0] + "-" + firstArray[i])
        .transition().duration(500)
        .style("stroke", "#1E90FF").style("stroke-width", "5");
        for (j = firstArray.length - 1; j > 0; j--) {
            d3.selectAll("." + firstArray[i] + "-" + firstArray[j])
            .transition().duration(500)
            .style("stroke", "#1E90FF").style("stroke-width", "5");
            d3.selectAll("." + firstArray[j] + "-" + firstArray[i])
            .transition().duration(500)
            .style("stroke", "#1E90FF").style("stroke-width", "5");
        }
    }
    for (i = 0; i < secondArray.length; i++) {
        if(secondArray[i] != c2){
            d3.select("#boarder" + secondArray[i]).attr("opacity",1);
        }
        d3.selectAll("." + common[0] + "-" + secondArray[i])
        .transition().duration(500)
        .style("stroke", "#1E90FF").style("stroke-width", "5");
        for (j = secondArray.length - 1; j > 0; j--) {
            d3.selectAll("." + secondArray[i] + "-" + secondArray[j])
            .transition().duration(500)
            .style("stroke", "#1E90FF").style("stroke-width", "5");
            d3.selectAll("." + secondArray[j] + "-" + secondArray[i])
            .transition().duration(500)
            .style("stroke", "#1E90FF").style("stroke-width", "5");
        }
    }

    
    var parent = common[0] + ""; 
    d3.select("#boarder" + parent).attr("opacity",1);
    miniLife = "(" + ((firstArray[0] != null) ? (getSubTree(firstArray) + ",") : "") + ((secondArray[0] != null) ? getSubTree(secondArray) : "") + ")" + parent;
    localStorage.setItem("firstArray", firstArray);
    localStorage.setItem("secondArray",secondArray);

    var c1 = (firstArray[0] != null) ? firstArray[0] : parent;
    var c2 = (secondArray[0] != null) ? secondArray[0] : parent;

    var nodeName = {
        p: parent,
        c1: c1,
        c2: c2
    };
    str = jQuery.param(nodeName);
    return miniLife;
}
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        lineHeight = 1.1, // ems
        tspan = text.text(null).append("tspan").attr("x", 10).attr("y", y).attr("dy", dy + "em");     
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            var textWidth = tspan.node().getComputedTextLength();
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                ++lineNumber;
                tspan = text.append("tspan").attr("x", 10).attr("y", 0).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}