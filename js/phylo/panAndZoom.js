var miniBaseSvg, frame, minimap, num,num2,num3 = null;
d3.demo = {};

d3.demo.canvas = function(life, info) {

    //"use strict";
    var width = 0,
    height = 0,
    scale = 1,
    translation = [0, 0],
    base = null,
    wrapperBorder = 2,
    minimapPadding = 20,
    minimapScale = 0.185,
    dragEnabled = true;

    function canvas(selection) {

        base = selection;

        var xScale = d3.scaleLinear()
        .domain([-width / 2, width / 2])
        .range([0, width]);

        var yScale = d3.scaleLinear()
        .domain([-height / 2, height / 2])
        .range([height, 0]);

        var zoomHandler = function(newScale) {
            if (d3.event) {
                scale = d3.event.transform.k;
            } else {
                scale = newScale;
            }
            if (dragEnabled) {
                var tbound = -height * scale,
                bbound = height * scale,
                lbound = -width * scale,
                rbound = width * scale;

                translation = d3.event ? [d3.event.transform.x, d3.event.transform.y] : [0, 0];

                translation = [
                Math.max(Math.min(translation[0], rbound), lbound),
                Math.max(Math.min(translation[1], bbound), tbound)
                ];
            }

            d3.select(".panCanvas, .panCanvas .bg")
            .attr("transform", "translate(" + translation + ")" + " scale(" + scale + ")");

            minimap.scale(scale).render();
        }; // startoff zoomed in a bit to show pan/zoom rectangle

        zoom = d3.zoom()
        .scaleExtent([0.7, 1.7])
        .on("zoom.canvas", zoomHandler);

        var svg = selection.append("svg")
        .attr("class", "svg canvas")
        .attr("id","canvas")
        .attr("preserveAspectRatio", "xMinYMid meet")
        .attr("height", height)
        .attr("height", width + 700)
        .attr("viewBox", "0 0 " + (width + 700) + " " + height);

        creatDefs(svg, info, 80, "big");
        creatDefs(svg, info, 60, "mini");
        creatDefs(svg, info, 50, "xmini");


        var svgDefs = svg.append("defs");

        var filter = svgDefs.append("svg:filter")
        .attr("id", "minimapDropShadow_gmult")
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "150%")
        .attr("height", "150%");

        filter.append("svg:feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceGraphic")
        .attr("dx", "1")
        .attr("dy", "1");

        var innerWrapper = svg.append("g")
        .attr("class", "wrapper inner")
        .attr("transform", "translate(" + (wrapperBorder) + "," + (wrapperBorder) + ")").call(zoom).on("dblclick.zoom", null);

        innerWrapper.append("g")
        .attr("class", "timeLine");

        innerWrapper.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

        var panCanvas = innerWrapper.append("g")
        .attr("class", "panCanvas")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(0,0)");

        panCanvas.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

        miniBaseSvg = d3.select("#contextTree").append("svg")
        .attr("id", "miniBaseSvg");

        minimap = d3.demo.minimap(life, info, miniBaseSvg)
        .zoom(zoom)
        .target(panCanvas)
        .minimapScale(minimapScale);


        miniBaseSvg.call(minimap);

        /** ADD SHAPE **/

        canvas.addLinearTree = function() {
            creatLinearTree(life, info, panCanvas);
        }

        canvas.addRadialTree = function() {
            creatRadialTree(life, info, panCanvas);
        }

        /** RENDER **/
        canvas.render = function() {
            svgDefs
            .select(".clipPath .background")
            .attr("width", width)
            .attr("height", height);

            svg
            .attr("width", width + (wrapperBorder * 2))
            .attr("height", height + (wrapperBorder * 2));

            outerWrapper
            .select(".background")
            .attr("width", width + wrapperBorder * 2)
            .attr("height", height + wrapperBorder * 2);

            innerWrapper
            .attr("transform", "translate(" + (wrapperBorder) + "," + (wrapperBorder) + ")")
            .select(".background")
            .attr("width", width)
            .attr("height", height);

            panCanvas
            .attr("width", width)
            .attr("height", height)
            .select(".background")
            .attr("width", width)
            .attr("height", height);

            minimap
            .x(width + minimapPadding)
            .y(minimapPadding)
            .render();
        };

        canvas.reset = function() {
            d3.transition().duration(750).tween("zoom", function() {
                var ix = d3.interpolate(xScale.domain(), [-width / 2, width / 2]),
                iy = d3.interpolate(yScale.domain(), [-height / 2, height / 2]),
                iz = d3.interpolate(scale, 1);
                return function(t) {
                    zoom.scale(iz(t)).x(xScale.domain(ix(t))).y(yScale.domain(iy(t)));
                    zoomHandler(iz(t));
                };
            });
        };
        
    }


    //============================================================
    // Accessors
    //============================================================


    canvas.width = function(value) {
        if (!arguments.length) return width;
        width = parseInt(value, 10);
        return this;
    };

    canvas.height = function(value) {
        if (!arguments.length) return height;
        height = parseInt(value, 10);
        return this;
    };

    canvas.scale = function(value) {
        if (!arguments.length) {
            return scale;
        }
        scale = value;
        return this;
    };

    return canvas;
};



/** MINIMAP **/
d3.demo.minimap = function(life, info, baseSvg) {

    "use strict";

    var minimapScale = 0.15,
    scale = 1.0,
    zoom = null,
    base = null,
    target = null,
    width = 0,
    height = 0,
    frameX = 0,
    frameY = 0;

    function minimap(selection) {
        var drag = d3.drag() 
        var container = baseSvg.append("g")
        .attr("class", "minimap").call(zoom);
        
        miniCanvas = baseSvg.append("g")
        .attr("class", "miniCanvas");

        zoom.on("zoom.minimap", zoomed);
        drag.on("start.minimap",dragStart);
        drag.on("drag.minimap",dragged);

        
        frame = container.append("g")
        .attr("class", "frame");

        frame.append("rect")
        .attr("class", "background")
        .style("stroke", "#ffffff")
        .attr("transform", "translate(100," + (-420) + ")")
        .style("stroke-width", 8)
        .attr("width", w)
        .attr("height", h);
        
        function zoomed() {
            frame.attr("transform", "translate(" + frameX + "," + frameY + ")");
            frameTranslate = [(-frameX * scale), (-frameY * scale)];
            target.attr("transform", "translate(" + frameTranslate + ")scale(" + scale + ")");
            
            scale2 = scale
            
            if(timeLineScale !== undefined){
                timeLineScale.rangeRound([0, w * scale2]);
                xAxis = d3.axisBottom(timeLineScale);

                if(display == "linear"){
                    d3.select(".timeLine")
                    .attr("transform", "translate(" + frameTranslate[0] + "," + 0 + ")")
                    .call(xAxis.ticks(5));
                }
            }
        }
        function dragStart(){
            d3.event.sourceEvent.stopPropagation();

            var frameTranslate = d3.demo.util.getXYFromTranslate(frame.attr("transform"));
            frameX = frameTranslate[0];
            frameY = frameTranslate[1];
        }

        function dragged(){
            
            d3.event.sourceEvent.stopImmediatePropagation();
            frameX += d3.event.dx;
            frameY += d3.event.dy;

            frameX = Math.min(width*0.6, Math.max(-width*0.4, frameX));
            frameY = Math.min(height*2.5/num3, Math.max(0, frameY));
            frame.attr("transform", "translate(" + frameX + "," + frameY + ")");
            var translate = [(-frameX * scale), (-frameY * scale)];
            target.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
            
            if(timeLineScale !== undefined){
                d3.select(".timeLine")
                .attr("transform", "translate(" + translate[0] + "," + 0 + ")");
            }
        }

        frame.call(drag);

        
        /** RENDER **/
        minimap.render = function() {
            container.attr("transform", "scale(" + minimapScale + ")");

            frame
            .select(".background")
            .attr("transform", "translate(100," + (-420) + ")")
            .attr("width", width / scale / num2)
            .attr("height", height / scale * num);

        };
        
        addMiniMap(life, info);
        
    }

    //============================================================
    // Accessors
    //============================================================
    

    minimap.x = function(value) {
        if (!arguments.length) return x;
        x = parseInt(value, 10);
        return this;
    };


    minimap.y = function(value) {
        if (!arguments.length) return y;
        y = parseInt(value, 10);
        return this;
    };


    minimap.scale = function(value) {
        if (!arguments.length) {
            return scale;
        }
        scale = value;
        return this;
    };


    minimap.minimapScale = function(value) {
        if (!arguments.length) {
            return minimapScale;
        }
        minimapScale = value;
        return this;
    };


    minimap.zoom = function(value) {
        if (!arguments.length) return zoom;
        zoom = value;
        return this;
    };


    minimap.target = function(value) {
        if (!arguments.length) {
            return target;
        }
        target = value;
        width = parseInt(target.attr("width"), 10);
        height = parseInt(target.attr("height"), 10);
        return this;
    };

    return minimap;
};

/** UTILS **/
d3.demo.util = {};
d3.demo.util.getXYFromTranslate = function(translateString) {
    var currentTransform = getTranslation(translateString);
    currentX = currentTransform[0];
    currentY = currentTransform[1];
    return [currentX, currentY];
};

function addMiniMap(life, info) {
    if (display == "linear") {
        num = 0.9;
        num2 = 0.825;
        num3 = 1;
        $("#contextTree").css({"height": "80%"});
        createLinearContextTree(life, info, miniCanvas);
        miniBaseSvg
        .attr("viewBox", "0 0 " + 430 + " " + 600)
        .attr("preserveAspectRatio", "xMidYMid meet");
        minimap.render();

    } else {
       num = 1.65;
       num2 = 1;
       num3 = 6;

       $("#contextTree").css({"height": "80%"});
       createRadialContextTree(life, info, miniCanvas);
       miniBaseSvg
       .attr("viewBox", "0 0 " + 365 + " " + 330)
       .attr("preserveAspectRatio", "xMidYMid meet");
       
       minimap.render();
       
       
        //miniBaseSvg.call(minimap);
        
    }
}