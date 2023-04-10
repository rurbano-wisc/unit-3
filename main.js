//2-2 D3 basemap 
(function(){

//pseudo-global variables
var attrArray = ["Number of Hatcheries","Percentage of mines built before 1989","Total river % Wild & Scenic","Built during dam era (1930s-1960s) %", "November precip average 1981-2010","Estimated difference for November 2040","August precip average 1981-2010","Estimated difference for August 2040","April precip average 1981-2010","Estimated difference for April 2040"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 110]);

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

//should I adjust this to finalize formatting better?
//map frame dimensions
var width = 700,
// window.innerWidth * 0.5,
    height = 600;

 //create new svg container for the map
 var map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

 // create Albers equal area conic projection centered on West Coast; replaced // Example 2.2: Creating a path generator
 var projection = d3.geoAlbers()
    .center([1.5,37.3])   
    .rotate([122.73, -5.44, 0]) 
    .parallels([29.5, 45.5])
    .scale(2660)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

//use Promise.all to parallelize asynchronous data loading
var promises = [    
    d3.csv("data/Coho_Chinook_SalmonRanges2.csv"),
    d3.json("data/CountySalmon.topojson"),
    d3.json("data/CohoChinook_SalmonRanges.topojson"),
];    
Promise.all(promises).then(callback);

//Adding a callback to
function callback(data) {
    // console.log(data);
    var csvData = data[0], County_Salmon = data[1], salmonRanges = data[2];
console.log(csvData);
console.log(County_Salmon);
console.log(salmonRanges);

//place graticule on the map
setGraticule(map, path);
createDropdown(csvData);

//translate range/county TopoJSON
var salmon_Counties = topojson.feature(County_Salmon, County_Salmon.objects.CountySalmon),//.features, //why does the .features make my counties go away but without it my counties will draw?
salmon_Ranges = topojson.feature(salmonRanges, salmonRanges.objects.CohoChinook_SalmonRanges).features;
//examine the results
// console.log(Salmon_Ranges);
// console.log(Salmon_Counties);

 //add salmon_Counties counties to map-this is just underlying reference data
 var counties = map.append("path")
 .datum(salmon_Counties)
 .attr("class", "counties")
 .attr("d", path);

//join csv data to GeoJSON enumeration units
salmon_Ranges = joinData(salmon_Ranges, csvData);

//add enumeration units to the map
var colorScale = makeColorScale(csvData);
setEnumerationUnits(salmon_Ranges, map, path, colorScale);

//add coordinated visualization to the map
setChart(csvData, colorScale);
    };
}; //end of setMap()

function setGraticule(map, path){
    //create graticule generator
    var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];
//create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);
        
    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];

    //assign two-value array as scale domain
    colorScale.domain(minmax);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

function joinData(salmon_Ranges, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
   //variables for data join changes in precip are estimated for 2040
   var attrArray = ["Number of Hatcheries","Percentage of mines built before 1989","Total river % Wild & Scenic","Built during dam era (1930s-1960s) %", "November precip average 1981-2010","Estimated difference for November 2040","August precip average 1981-2010","Estimated difference for August 2040","April precip average 1981-2010","Estimated difference for April 2040"];

   //loop through csv to assign each set of csv attribute values to geojson region
   for (var i=0; i<csvData.length; i++){
       var csvRegion = csvData[i]; //the current region
       var csvKey = csvRegion.RangeID; //the CSV primary key

       //loop through geojson regions to find correct region
       for (var a=0; a<salmon_Ranges.length; a++){

           var geojsonProps = salmon_Ranges[a].properties; //the current region geojson properties
           var geojsonKey = geojsonProps.RangeID; //the geojson primary key

           //where primary keys match, transfer csv data to geojson properties object
           if (geojsonKey == csvKey){

               //assign all attributes and values
               attrArray.forEach(function(attr){
                   var val = parseFloat(csvRegion[attr]); //get csv attribute value
                   geojsonProps[attr] = val; //assign attribute and value to geojson properties
               });
            };
        };
    };
    return salmon_Ranges;
};

//function to create a dropdown menu for attribute selection  
console.log('createDropdown function called');
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change event handler
function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".ranges")
        .transition()
        .duration(1000)
        .style("fill", function (d) {
        var value = d.properties[expressed];
        if (value) {
            return colorScale(value);
        } else {
            return "#ccc";
        }
    });
    //Sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //Sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){            
            var value = d[expressed];            
            if(value) {                
                return colorScale(value);            
            } else {                
                return "#ccc";            
            }    
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
        updateChart(bars, csvData.length, colorScale);
    }; //end of changeAttribute()

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){            
            var value = d[expressed];            
            if(value) {                
                return colorScale(value);            
            } else {                
                return "#ccc";
                        
            }    
    });
     //at the bottom of updateChart()...add text to chart title
     var chartTitle = d3.select(".chartTitle")
     .text( expressed + " in each range");
};

function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.RangeID)
        .style("stroke", "blue")
        .style("stroke-width", "2");
};
//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.RangeID)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
//DOES THIS GO HERE remove info label
            d3.select(".infolabel")
            .remove();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
    .node()
    .getBoundingClientRect()
    .width;
    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
    y1 = event.clientY - 75,
    x2 = event.clientX - labelWidth - 10,
    y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function setEnumerationUnits(salmon_Ranges, map, path, colorScale){
    //add France regions to map
    var regions = map.selectAll(".ranges")
    .data(salmon_Ranges)
    .enter()
    .append("path")
    .attr("class", function(d){
        return "ranges " + d.properties.RangeID;
    })
    .attr("d", path)
    .style("fill", function(d){            
        var value = d.properties[expressed];            
        if(value) {                
            return colorScale(value);     
        } else {                
            return "#ccc";            
        }
    })
    .on("mouseover", function(event, d){
        highlight(d.properties);
    //where does this get added?
    // .on("mouseout", function(event, d){
    //     dehighlight(d.properties);
    // })
    //  .on("mousemove", moveLabel);   
    //where does this get added? breaks my script  
    var desc = regions.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    
});
}

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.RangeID + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

   //set bars for each province
   var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.RangeID; //LINE 31 TECHNICALLY
        })        
        .attr("width", chartInnerWidth / csvData.length - 1)
        //mouseover event
        .on("mouseover", function(event, d){
            highlight(d);
        // does this go here
        // .on("mouseover", function(event, d){
        //     dehighlight(d);
        // });
        // .on("mousemove", moveLabel);
    //does this go here?         
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
        })

  //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.RangeID;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        });

    //below Example 2.8...create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        //.text("precip differences in '" + expressed[3] + "' inches  in each range");
     //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);
 //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
//create frame for chart border
var chartFrame = chart.append("rect")
     .attr("class", "chartFrame")
     .attr("width", chartInnerWidth)
     .attr("height", chartInnerHeight)
     .attr("transform", translate); 

updateChart(bars, csvData.length, colorScale);   
};//close out setChart function

var myIndex = 0;
carousel();

function carousel() {
  var i;
  var x = document.getElementsByClassName("mySlides");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";  
  }
  myIndex++;
  if (myIndex > x.length) {myIndex = 1}    
  x[myIndex-1].style.display = "block";  
  setTimeout(carousel, 3500); // Change image every 6 seconds
}

})(); //last line of main.js