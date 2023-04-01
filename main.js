//2-2 D3 basemap //begin script when window loads
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
    .center([-42.36, 42.84])   
    .rotate([81, 1.82, 0]) 
    .parallels([29.5, 45.5])
    .scale(2000.90)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

//  //use Promise.all to parallelize asynchronous data loading
var promises = [    
    d3.csv("data/Coho_Chinook_SalmonRanges.csv"),
    d3.json("data/CountySalmon.topojson"),
    d3.json("data/CohoChinook_SalmonRanges.topojson"),
];    
Promise.all(promises).then(callback)
    //catch promises to troubleshoot
    .catch(function(error) {
        console.log(error);
    });
  ;
  
    //Example 1.4: Adding a callback to
function callback(data) {
    // console.log(data);
    var csvData = data[0],
        County_Salmon = data[1],
        salmonRanges = data[2];
        
console.log(csvData);
console.log(County_Salmon);
console.log(salmonRanges);

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

    //translate range/county TopoJSON
    var salmon_Counties = topojson.feature(County_Salmon, County_Salmon.objects.CountySalmon),
        salmon_Ranges = topojson.feature(salmonRanges, salmonRanges.objects.CohoChinook_SalmonRanges).features;

    // // //examine the results
    // console.log(Salmon_Ranges);
    // console.log(Salmon_Counties);
 //add salmon_Counties counties to map-this is just underlying reference data
 var counties = map.append("path")
 .datum(salmon_Counties)
 .attr("class", "counties")
 .attr("d", path);

//add salmonRanges regions to map-this has all the data join on id
var ranges = map.selectAll(".ranges")
 .data(salmon_Ranges)
 .enter()
 .append("path")
 .attr("class", function(d){
     return "ranges " + d.properties.id;
 })
 .attr("d", path);

};
}