function translocation() {
  var translocation = {},
  data,
  groups,
  groupsEarly,
  groupCount,
  edges,
  edgesEarly,
  edgeCount,
  padding = 0;

  function relayout() {
    var groupStartRad, groupEndRad, sourceGrp, targetGrp, attributes;
    groups = [];
    edges = [];
    

    var counts = {};
    var counts2 = {};

    for (var i = 0; i < data.length; i++) {
      counts[data[i]] = 1 + (counts[data[i]] || 0);
    }

    var keys = Object.keys(counts);
    var length = keys.length;

    for(var i = 0; i < keys.length; i++){
      keys[i] = keys[i].split("_")[0];
    }

    for (var i = 0; i < keys.length; i++) {
      counts2[keys[i]] = 1 + (counts2[keys[i]] || 0);
    }
    

    var c2 = $.map(counts2,function(k,v){
      return k;
    });

    var num1 = c2[0]; //number of chromosomes in child
    var num2 = c2[1]; //number of chromosomes in parent



    //Compute the total of the each group sizes:
    var k1 = 0;
    var k2 = 0;

    for(var i = 0; i < groupCount/2; i++) {
      k1 += groupsEarly[i];

    }
    for(var i = groupCount/2; i < groupCount; i++) {
      k2 += groupsEarly[i];

    }

    
    // Convert the sum to scaling factor for [0, pi].
    var scale1 = d3.scaleLinear().range([0, Math.PI - 0.015 * num1]).domain([0, k1])
    var scale2 = d3.scaleLinear().range([0, Math.PI - 0.015 * num2]).domain([0, k2])
    
    
    //Compute the array of group objects:
    for(groupStartRad = 0, i = 0; i < groupCount; i++){
      
      if(i < groupCount - 1){
        if(data[i] == data[i + 1]){
          padding = 0;
        }
        else{
          padding = 0.015;
        }
        
      }

      if(i < groupCount/2){
        groupEndRad = groupStartRad + scale1(groupsEarly[i]);
      }
      if(i >= groupCount/2){
        groupEndRad = groupStartRad + scale2(groupsEarly[i]);

      } //Add radial length of group

      groups[i] = {
        index: i,
        startAngle: groupStartRad,
        endAngle: groupEndRad,
        value: groupsEarly[i],
        padding: padding

      }
      groupStartRad = groupEndRad + padding;

    }

    //Compute array of edges:
    for(var i = 0; i < edgeCount; i++) {
      
      sourceGrp = groups[edgesEarly[i][0]];
      targetGrp = groups[edgesEarly[i][2]];
      attributes = edgesEarly[i].length > 6 ? edgesEarly[i][6] : {};

      edges[i] = {
        source: {
          endAngle: sourceGrp.startAngle + scale2(edgesEarly[i][4] + edgesEarly[i][1]),
          index: edgesEarly[i][0],
          startAngle: sourceGrp.startAngle + scale2(edgesEarly[i][1]),
          value: edgesEarly[i][1],
          width: edgesEarly[i][4]
        },
        target: {
          endAngle: targetGrp.startAngle + scale1(edgesEarly[i][5] + edgesEarly[i][3]),
          index: edgesEarly[i][2],
          startAngle: targetGrp.startAngle + scale1(edgesEarly[i][3]),
          value: edgesEarly[i][3],
          width: edgesEarly[i][5]
        },
        attributes : attributes
      }
    }
    attributes = targetGrp = sourceGrp = null;
    
  }

  //Expects an array of sizes, where the index is group ID
  translocation.groups = function(x) {
    if(!x) {
      if (!groups) {
        relayout();
      }
      return groups;
    }
    groups = null;
    groupsEarly = x;
    groupCount = x.length;
    return translocation;
  }

  //Expects array of edge objects [[StartGrp, Location, EndGrp, Location, startThickness, endThickness, attrsObj]]
  translocation.edges = function(x) {
    if(!x) {
      if (!edges) {
        relayout();
      }
      return edges;
    }
    edges = null;
    edgesEarly = x;
    edgeCount = x.length;
    return translocation;
  }

  //Sets padding between each group
  translocation.padding = function(x) {
    if (!x) {
      return padding;
    }
    padding = x;
    edges = groups = null;
    return translocation;
  };

  translocation.data = function(x) {
    if (!x) {
      return data;
    }
    data = x;
    edges = groups = null;
    return translocation;
  };

  return translocation;
};