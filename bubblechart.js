// Rachael Urbano GEOG 575 //D3 Bubble Multivariate //Activity 8
//script start
window.onload = function(){

    // SVG dimension variables
    var w = 900, h = 500;

    //container block // step 1 1.2
    var container = d3.select("body") //get the <body> element from the DOM
        // step 2
        .append("svg") //put a new svg in the body
        // step 3
        .attr("width", w) //assign the width
        .attr("height", h) //assign the height
        .attr("class", "container") //assign a class name
        .style("background-color", "rgba(0,0,0,0.2)")
    // step 6
     //innerRect block
    var innerRect = container.append("rect") //put a new rect in the svg
    // step 7 datum line
        .datum(400)
    // step 8
        .attr("width", function(d){ //rectangle width
            return d * 2; //400 * 2 = 800
        }) 
        .attr("height", function(d){ //rectangle height
            return d; //400
        })
    // step 9 example 1.9
        .attr("class", "innerRect") //class name
        .attr("x", 50) //position from left on the x (horizontal) axis
        .attr("y", 50) //position from top on the y (vertical) axis
        .style("fill", "#FFFFFF"); //fill color

// lesson 1 above // step 2-5 
    var cityPop = [
        { 
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];
    // lesson 2 stuff // step 3-1
    var x = d3.scaleLinear() //create the scale
        .range([90, 810]) //output min and max
        .domain([0, 3]); //input min and max --remove semicolon as build out, leaving removes container 

    // step 3-3 // find the minimum value of the array example 3.3
    var minPop = d3.min(cityPop, function(d){
        return d.population;
        });

//find the maximum value of the array
    var maxPop = d3.max(cityPop, function(d){
        return d.population;
        });
        
    //scale for circles center y coordinate
    var y = d3.scaleLinear()
        .range([450, 50]) //was 440, 95
        .domain([0, 700000])//was minPop, maxPop

    // step 3-5
    //color scale generator example 3.5 
    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop, 
            maxPop
    ]);   

    // step 2-2 -- example 2.3
    var circles = container.selectAll(".circles") //but wait--there are no circles yet!
    // step 2-6 comment out below and replace with 2nd line
        // .data(dataArray) //here we feed in an array // this is example 2.8 I guess
        .data(cityPop) //here we feed in an array
        .enter() //one of the great mysteries of the universe
        // step 2-3
        .append("circle") //add a circle for each datum
        .attr("class", "circles") //apply a class name to all circles
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){
            //calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){
            //use the index to place each circle horizontally
            return 90 + (i * 180);
        })
        .attr("cy", function(d){
 //subtract value from 450 to "grow" circles up from the bottom instead of down from the top of the SVG
         return y(d.population);
        })
        .style("fill", function(d, i){ //add a fill based on the color scale generator
            return color(d.population);
        })
        .style("stroke", "#000"); //black circle stroke

// step 3-6 axis
    var yAxis = d3.axisLeft(y);
    //create axis g element and add axis example 3.7
    var axis = container.append("g")
        .attr("class", "axis")
        // step 3-9 3.9
        .attr("transform", "translate(50, 0)")
        .call(yAxis);

// step 3-12 example 3.12
    var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations");

// step 3-13 example 3.14
   //below Example 3.12...create circle labels
    var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){
            //vertical position centered on each circle
            return y(d.population) + 5;
        });

// // step 3-14 comment out below
//         .attr("x", function(d,i){
//             //horizontal position to the right of each circle
//             return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
//         })
//         .attr("y", function(d){
//             //vertical position centered on each circle
//             return y(d.population) + 5;
//         })
//         .text(function(d){
//             return d.city + ", Pop. " + d.population;

// step 3-15 
// example 3.15 first and second lines of labels
   //first line of label
    var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x", function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .text(function(d){
            return d.city;
        });

// step 3-17
// create format generator
    var format = d3.format(",");

//second line of label
    var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        // // step 3-16 example 3.16
        .attr("dy", "15") //vertical offset
        .text(function(d){
            // return "Pop. " + d.population;
            return "Pop. " + format(d.population); //use format generator to format numbers
        });

};