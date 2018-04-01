window.onload = function(){
	
	
	
	
	
	
	
	var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 44.95])
        .rotate([93.09, 0, 0])
        .parallels([43, 62])
        .scale(100000)
        .translate([width / 2, height / 2]);
	
	var path = d3.geoPath()
        .projection(projection);
	
	d3.queue()
		.defer(d3.csv, "data/saintpaulcrime.csv") //load saint paul crime statistics csv
		.defer(d3.json, "data/districts.topojson") //load saint paul neighborhoods map
		.await(callback);
	
	function callback(error, csvData, districts){
		var neighborhoods = map.append("g")
			.selectAll("path")
			.data( topojson.feature(districts, districts.objects.districts).features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("class", function(d){
				return "district " + d.properties.district;
			})
		
		
		
		
		
		var column_array = [];
		
		
		for (x in csvData.columns) {
			column_array.push(csvData.columns[x]);
		}
		
		var districts = topojson.feature(districts, districts.objects.districts).features;
		
		for (var i=0; i<csvData.length; i++){
        	var csvDistrict = csvData[i]; //the current region
        	var csvKey = csvDistrict.District; //the CSV primary key
			
			//loop through geojson regions to find correct region
        	for (var j=0; j<districts.length; j++){

            	var geojsonProps = districts[j].properties; //the current region geojson properties
            	var geojsonKey = geojsonProps.district; //the geojson primary key

            	//where primary keys match, transfer csv data to geojson properties object
            	if (geojsonKey == csvKey){

					//assign all attributes and values
                	column_array.forEach(function(attr){
                    	var val = parseFloat(csvDistrict[attr]); //get csv attribute value
						geojsonProps[attr] = val; //assign attribute and value to geojson properties
					});
				};
			};		
		};
		
		console.log(column_array);
		
	};
};
