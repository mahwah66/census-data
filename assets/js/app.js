// data import files
//census data csv and 2016 general election state votes by party
var csvfile = "assets/data/data.csv";
var votefile = "assets/data/statevotes.csv"

var svgWidth = d3.select('#scatter').node().getBoundingClientRect().width; //960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Axes Label Parameters
var xlablist = [
    {"value":"poverty", "text":"In Poverty (%)"},
    {"value":"age", "text":"Age (Median)"},
    {"value":"income", "text":"Household Income (Median)"}
  ];
var ylablist = [
    {"value":"obesity", "text":"Obesity (%)"},
    {"value":"smokes", "text":"Smokes (%)"},
    {"value":"healthcare", "text":"Lacks Healthcare (%)"}
  ];
var chosenXAxis = "poverty";
var chosenYAxis = "obesity";

//transition duration var
var dur = 1000;


// function used for updating axis scale click on axis label
function getScale(govData, chosenAxis, min, max) {
  // create scales
  var aLinearScale = d3.scaleLinear()
    .domain([d3.min(govData, d => d[chosenAxis]) * 0.9,
      d3.max(govData, d => d[chosenAxis]) * 1.1
    ])
    .range([min, max]);
  return aLinearScale;
}

// function used for updating an axis when axis label clicked
function renderAxis(newScale, axis, whichAxis) {
  var myAxis;
  if (whichAxis=="x") myAxis = d3.axisBottom(newScale);
  else myAxis = d3.axisLeft(newScale);
  axis.transition()
    .duration(dur)
    .call(myAxis);
  return axis;
}


// function used for updating circles group with a transition to new coords
function renderCircles(circlesGroup, newXScale, chosenXaxis, newYScale, chosenYaxis) {
  circlesGroup.transition()
    .duration(dur)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    .attr("cy", d => newYScale(d[chosenYAxis]));
  return circlesGroup;
}

// function used for updating circle text abbreviation labels to new coords
function renderAbbrevs(abbrevsGroup, newXScale, chosenXaxis, newYScale, chosenYaxis) {
    abbrevsGroup.transition()
      .duration(dur)
      .attr("x", d => newXScale(d[chosenXAxis]))
      .attr("y", d => newYScale(d[chosenYAxis])+2.5);
    return abbrevsGroup;
}



// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {
    var xlabel="";
    for (var i=0; i<xlablist.length; i++){
        if (chosenXAxis === xlablist[i]["value"]){
            xlabel = xlablist[i]["text"];
            break;
        }
    }
    var ylabel="";
    for (var i=0; i<ylablist.length; i++){
        if (chosenYAxis === ylablist[i]["value"]){
            ylabel = ylablist[i]["text"];
            break;
        }
    }
    

    var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([80, -60])
        .html(function(d) {
            return (`<h5>${d.state}</h5>${xlabel}: ${d[chosenXAxis]}<br>${ylabel}: ${d[chosenYAxis]}`);
        });

    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function(data) {
        toolTip.show(data);
        })
        // onmouseout event
        .on("mouseout", function(data, index) {
            toolTip.hide(data);
        });

    return circlesGroup;
}


//import data, state votes first which will determine color of circle by majority political party vote
d3.csv("assets/data/statevotes.csv", function(err, voteData) {
      
    if (err) throw err;
    var stateVotes={};
    voteData.forEach(function(data) {
        var mystate, polobj={};
        for (key in data){
            if (key !== "State"){
                polobj[key] = data[key].split(",").join("");
                polobj[key] = +polobj[key];
            }else{
                mystate = data["State"];
            }
        }
        stateVotes[mystate]=polobj;
    });

    // Retrieve data from the CSV file and execute everything below
    d3.csv(csvfile, function(err, govData) {
      
        if (err) throw err;
        // parse data
        govData.forEach(function(data) {
            for (key in data){
                if (key !== "state" && key !== "abbr") data[key] = +data[key];
            }
        });

        // scale for axes
        var xLinearScale = getScale(govData, chosenXAxis, 0, width);
        var yLinearScale = getScale(govData, chosenYAxis, height, 0);

        // Create initial axis functions
        var bottomAxis = d3.axisBottom(xLinearScale);
        var leftAxis = d3.axisLeft(yLinearScale);

        // append x axis
        var xAxis = chartGroup.append("g")
            .classed("x-axis", true)
            .attr("transform", `translate(0, ${height})`)
            .call(bottomAxis);

        // append y axis
        var yAxis = chartGroup.append("g")
            .classed("y-axis", true)
            .call(leftAxis);

        // append initial circles
        var circlesGroup = chartGroup.selectAll("circle")
            .data(govData)
            .enter()
            .append("circle")
            .attr("cx", d => xLinearScale(d[chosenXAxis]))
            .attr("cy", d => yLinearScale(d[chosenYAxis]))
            .attr("r", 10)
            .attr("fill", function (d){
                if (stateVotes[d.abbr]["Democratic"]==stateVotes[d.abbr]["Republican"]) return "purple";
                else return (stateVotes[d.abbr]["Democratic"]>stateVotes[d.abbr]["Republican"]? "blue":"red");
            })
        .attr("opacity", ".8");

        // append state abbrevs
        var abbrevsGroup = chartGroup.selectAll("text .abbr")
            .data(govData)
            .enter()
            .append("text")
            .attr("class","abbr")
            .attr("text-anchor", "middle")
            .attr("x", d => xLinearScale(d[chosenXAxis]))
            .attr("y", d => yLinearScale(d[chosenYAxis])+2.5)
            .attr("font-size", "10px")
            .attr("fill", "white")
            .attr("opacity", ".8")
            .text(d => d.abbr);


        // Create group for 3 x-axis labels
        var xlabelsGroup = chartGroup.append("g")
            .attr("transform", `translate(${width / 2}, ${height + 20})`);
  
        for (var i=0; i<xlablist.length; i++){
            var label = xlabelsGroup.append("text")
                .attr("x", 0)
                .attr("y", (i+1)*20)
                .attr("value", xlablist[i]["value"])
                .classed("active", (i==0))
                .classed("inactive", (i!=0))
                .text(xlablist[i]["text"]);
        }

        // Create group for 3 y-axis labels
        var ylabelsGroup = chartGroup.append("g")
            .attr("transform", `translate(${0 - margin.left}, ${height / 2}) rotate(-90)`);
    
  
        for (var i=0; i<ylablist.length; i++){
            var label = ylabelsGroup.append("text")
                .attr("x", 0)
                .attr("y", (i+1)*20)
                .attr("value", ylablist[i]["value"])
                .classed("active", (i==0))
                .classed("inactive", (i!=0))
                .text(ylablist[i]["text"]);
        }

        // updateToolTip function above csv import
        var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);


        // x axis labels event listener
        xlabelsGroup.selectAll("text").on("click", function() {
            // get value of selection
            var value = d3.select(this).attr("value");
            if (value !== chosenXAxis) {
                // replaces chosenXaxis with value
                chosenXAxis = value;
                xlabelsGroup.selectAll("text")
                    .classed("active", false)
                    .classed("inactive", true);
                d3.select(this)
                    .classed("active", true)
                    .classed("inactive", false);
                updateChart();
            }
        });


        // y axis labels event listener
        ylabelsGroup.selectAll("text").on("click", function() {
            // get value of selection
            var value = d3.select(this).attr("value");
            if (value !== chosenYAxis) {
                // replaces chosenYaxis with value
                chosenYAxis = value;
                ylabelsGroup.selectAll("text")
                    .classed("active", false)
                    .classed("inactive", true);
                d3.select(this)
                    .classed("active", true)
                    .classed("inactive", false);
                updateChart();
            }
        });


        // update chart with transition
        function updateChart(){
            xLinearScale = getScale(govData, chosenXAxis, 0, width);
            yLinearScale = getScale(govData, chosenYAxis, height, 0);
            // updates axes with transition
            xAxis = renderAxis(xLinearScale, xAxis, "x");
            yAxis = renderAxis(yLinearScale, yAxis, "y");

            // updates circles/text with new coords
            circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);
            abbrevsGroup = renderAbbrevs(abbrevsGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

            // updates tooltips with new info
            circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);
        }

        window.addEventListener("resize", function(){
            svgWidth = d3.select('#scatter').node().getBoundingClientRect().width; //960;
            svg.attr("width", svgWidth);
            width = svgWidth - margin.left - margin.right;
            xlabelsGroup.transition()
                .duration(dur)
                .attr("transform", `translate(${width / 2}, ${height + 20})`);
            updateChart();

        });
    }); //end govData load

}); //end stateVote load

