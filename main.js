//2-2 D3 basemap 
(function(){

//pseudo-global variables
var attrArray = ["varA", "varB", "varC", "varD", "varE"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
//map frame dimensions
var width = 500,
    height = 500;

 //create new svg container for the map
 var map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

 // create Albers equal area conic projection centered on West Coast; replaced // Example 2.2: Creating a path generator
 var projection = d3.geoAlbers()
    .center([1.5,37.30])   
    .rotate([122.73, -5.44, 0]) 
    .parallels([29.5, 45.5])
    .scale(2200)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

//use Promise.all to parallelize asynchronous data loading
var promises = [    
    d3.csv("data/Coho_Chinook_SalmonRanges.csv"),
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

//translate range/county TopoJSON
var salmon_Counties = topojson.feature(County_Salmon, County_Salmon.objects.CountySalmon).features, //why does the .features make my counties go away but without it my counties will draw?
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
   //variables for data join
   var attrArray = ["varA", "varB", "varC", "varD", "varE"];

   //loop through csv to assign each set of csv attribute values to geojson region
   for (var i=0; i<csvData.length; i++){
       var csvRegion = csvData[i]; //the current region
       var csvKey = csvRegion.OBJECTID; //the CSV primary key

       //loop through geojson regions to find correct region
       for (var a=0; a<salmon_Ranges.length; a++){

           var geojsonProps = salmon_Ranges[a].properties; //the current region geojson properties
           var geojsonKey = geojsonProps.OBJECTID; //the geojson primary key

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

function setEnumerationUnits(salmon_Ranges, map, path, colorScale){
    //...REGIONS BLOCK FROM CHAPTER 8
    //add France regions to map
    var ranges = map.selectAll(".ranges")
    .data(salmon_Ranges)
    .enter()
    .append("path")
    .attr("class", function(d){
        return "ranges " + d.properties.OBJECTID;
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

// //add salmonRanges regions to map-this has all the data join on id
// var ranges = map.selectAll(".ranges")
//  .data(salmon_Ranges)
//  .enter()
//  .append("path")
//  .attr("class", function(d){
//      return "ranges " + d.properties.OBJECTID;
//  })
//  .attr("d", path);

// };

})(); //last line of main.js