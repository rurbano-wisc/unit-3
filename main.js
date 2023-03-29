//2-2 D3 basemap //begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
//map frame dimensions
var width = 960,
    height = 460;

 //create new svg container for the map
 var map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

 // create Albers equal area conic projection centered on West Coast; replaced // Example 2.2: Creating a path generator
 // var projection = d3.geoAlbersUsa()
 var projection = d3.geoAlbers()
    .center([-36.36, 42.84])   
    .rotate([81, 1.82, 0]) 
    .parallels([29.5, 45.5])
    .scale(1689.90)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

//  //use Promise.all to parallelize asynchronous data loading
var promises = [];    
promises.push(d3.csv("data/Coho_Chinook_SalmonRanges.csv")); //load attributes from csv    
promises.push(d3.json("data/CohoChinook_SalmonRanges.topojson")); //load background spatial data    
promises.push(d3.json("data/County_Salmon.topojson")); //load choropleth spatial data    
Promise.all(promises).then(callback)

    //catch promises to troubleshoot
    .catch(function(error) {
    console.log(error)});

    //Example 1.4: Adding a callback to
function callback(data) {
    var csvData = data[0],
        SalmonRanges = data[1],
        SalmonCounties = data[2];
        
console.log(csvData);
console.log(SalmonRanges);
console.log(SalmonCounties);

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
    var Salmon_Ranges = topojson.feature(SalmonRanges, SalmonRanges.objects.CohoChinook_SalmonRanges),
        Salmon_Counties = topojson.feature(SalmonCounties, SalmonCounties.objects.County_Salmon).features;

    // // //examine the results
    // console.log(Salmon_Ranges);
    // console.log(Salmon_Counties);
 //add Salmon_Ranges counties to map-this is just underlying reference data
 var counties = map.append("path")
 .datum(Salmon_Counties)
 .attr("class", "counties")
 .attr("d", path);

//add Salmon_Counties regions to map-this has all the data join on id
var ranges = map.selectAll(".ranges")
 .data(Salmon_Ranges)
 .enter()
 .append("path")
 .attr("class", function(d){
     return "ranges " + d.properties.id;
 })
 .attr("d", path);

};
}