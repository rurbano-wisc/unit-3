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
 var projection = d3.geo.albers()
    .center([-36.36, 42.84])   
    .rotate([81, 1.82, 0]) 
    .parallels([29.5, 45.5])
    .scale(1689.90)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

 //use Promise.all to parallelize asynchronous data loading
    var promises = [
        d3.csv("data/CohoChinook_SalmonRanges.csv"),                    
        d3.json("data/CohoChinook_SalmonRanges.topojson"),
        d3.json("data/County_Salmon.topojson"),                   
    ];    
    Promise.all(promises).then(callback);

    //Example 1.4: Adding a callback to
function callback(data) {
    var csvData = data[0],
        CohoChinookRanges = data[1],
        County_Salmon = data[2];
        
    console.log(csvData);
    console.log(CohoChinookRanges);
    console.log(County_Salmon);

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
    var CohoChinook_Salmon_Ranges = topojson.feature(CohoChinookRanges, CohoChinookRanges.objects.CohoChinook_SalmonRanges),
        CohoChinook_Salmon_County = topojson.feature(County_Salmon, County_Salmon.objects.County_Salmon).features;

    // // //examine the results
    // console.log(CohoChinook_Salmon_Ranges);
    // console.log(CohoChinook_Salmon_County);
 //add Europe countries to map
 var ranges = map.append("path")
 .datum(CohoChinook_Salmon_Ranges)
 .attr("class", "ranges")
 .attr("d", path);

//add France regions to map
var counties = map.selectAll(".regions")
 .data(CohoChinook_Salmon_County)
 .enter()
 .append("path")
 .attr("class", function(d){
     return "counties " + d.properties.COUNTYNAME;
 })
 .attr("d", path);

}
};