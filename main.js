//2-2 D3 basemap 
(function(){
//"RiverMi", "change_Apr_precip", "change_Aug_precip", "change_Nov_precip", "PctWildScenic"
//pseudo-global variables
var attrArray = ["NumHatcheries","PctMinesbeforeEndanged","BuiltDuringDamEraPct", "RiverMi", "PctWildScenic","NovPrecipdiff","AugPrecipDiff","AprPrecipDiff","Novavg","Augavg", "Apravg"]; //list of attributes
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
//map frame dimensions
var width = 500,
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

//Example 1.4: Adding a callback to
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
   var attrArray = ["NumHatcheries","PctMinesbeforeEndanged","BuiltDuringDamEraPct", "RiverMi", "PctWildScenic", "NovPrecipdiff","AugPrecipDiff","AprPrecipDiff","Novavg","Augavg", "Apravg"];

   //loop through csv to assign each set of csv attribute values to geojson region
   for (var i=0; i<csvData.length; i++){
       var csvRegion = csvData[i]; //the current region
       var csvKey = csvRegion.RangeID; //the CSV primary key

       //loop through geojson regions to find correct region
       for (var a=3; a<salmon_Ranges.length; a++){

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
            return "bar " + d.RangeID;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
       .style("fill", function(d){
            return colorScale(d[expressed]);
        })
         .on("mouseover", function(event, d){
            highlight(d);
        });//don't edit any of this according to notes

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
        //.text("Precipitation differences in '" + expressed[3] + "' inches  in each range");
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
};//close out setChart function

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
        // .attr("x", function(d, i){
        //     return i * (chartInnerWidth / csvData.length) + leftPadding;
        // })
        // //resize bars
        // .attr("height", function(d, i){
        //     return 463 - yScale(parseFloat(d[expressed]));
        // })
        // .attr("y", function(d, i){
        //     return yScale(parseFloat(d[expressed])) + topBottomPadding;
        // })
        // //recolor bars
        // .style("fill", function(d){            
        //     var value = d[expressed];            
        //     if(value) {                
        //         return colorScale(value);            
        //     } else {                
        //         return "#ccc";            
        //     }    
        // });
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
     .text("Number of Variable " + expressed[3] + " in each range");
};

function setEnumerationUnits(salmon_Ranges, map, path, colorScale){
    //...REGIONS BLOCK FROM CHAPTER 8
    //add France regions to map
    var ranges = map.selectAll(".ranges")
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
            return colorScale(d.properties[expressed]);            
        } else {                
            return "#ccc";            
        }    
});
}
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.RangeID)
        .style("stroke", "blue")
        .style("stroke-width", "2");
};

})(); //last line of main.js