// Javascript (jquery + D3) for Saint-Paul-Crime project | Nicholas Rolstad 2018

//immediately invoked function
(function(){
	//function to force page reload on resize | this allows responsize design of d3 elements that rely on innerWidth/innerHeight
	$(window).bind('resize', function(e) {
		if (window.RT) clearTimeout(window.RT);
		window.RT = setTimeout(function() {
			this.location.reload(false); /* false to get page from cache */
		}, 100);
	});
	
	//check if device is in portrait mode, if it is alert user to rotate to landscape
	if (window.innerHeight > window.innerWidth) {
		alert('Please rotate device and refresh page!');
	}
	
	//set scale based on viewport width
	if (window.innerWidth > 1900){
		var scale = 300000;
	} else if (window.innerWidth > 1300) {
		var scale = 260000;
	} else if (window.innerWidth > 1100) {
		var scale = 220000;
	} else if (window.innerWidth > 900) {
		var scale = 180000;
	} else {
		var scale = 100000;
	}
	
	
	//set width, height
	var width = window.innerWidth *.48, 
		height = window.innerHeight;

	//chart frame dimensions
	var chartWidth = window.innerWidth * .48,
		chartHeight = window.innerHeight +5;
	
	//create Albers equal area conic projection centered on St. Paul
	var projection = d3.geoAlbers()
		.center([0, 44.95])
		.rotate([93.11, 0, 0])
		.parallels([43, 62])
		.scale(scale)
		.translate([width / 2, height / 2]);

	//create path
	var path = d3.geoPath()
		.projection(projection);

	//emptry array to store attribute list
	var column_array = [];

	//empty array to store values from CSV data
	var valueArr = []

	//array of crimes
	var crimes = ['Robbery','Aggravated Assault','Residential Burglary','Theft','Motor Vehicle Theft','Vandalism','Weapons Discharge','Narcotics','Rape'];

	//array of years
	var years = ['2012','2013','2014','2015','2016'];

//onload function
window.onload = function(){
	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	//d3 queue to load files
	d3.queue()
		.defer(d3.csv, "data/saintpaulcrimeperk.csv") //load saint paul crime statistics csv
		.defer(d3.json, "data/districtsall.topojson") //load saint paul neighborhoods map
		.await(callback);
	
	//callback function on queue
	function callback(error, csvData, districts){
		
		// retrieve columns from csvData and push to column_array
		for (x in csvData.columns) {
			column_array.push(csvData.columns[x]);
		}
		
		//set initial expressed variable to Robbery 2016
		var expressed = column_array[20];
		
		//push values from csvData into valueArr
		for (i in csvData) {
			valueArr.push(parseInt(csvData[i][String(expressed)]));
		}
		
		//create districts array with data from districts.topojson
		var districts = topojson.feature(districts, districts.objects.districts).features;
		
		//function to highlight selected feature by changing stroke
		function highlight(props, csvData){
				var selected = d3.selectAll(".district").filter(".a" + props.district)
					.style("opacity", ".82")
				var selected2 = d3.selectAll(".bars").filter(".a" + props.district)
					.style("stroke", "#333")
					.style("stroke-width", "4")
					.style("opacity", "1")
			setLabel(props);
		};
		
		//function to dehighlight selected feature by changing stroke
		function dehighlight(props){
			//select district and change stroke to default style
			var selected = d3.selectAll(".a" + props.district)
				.style("stroke", function(){
					return getStyle(this, "stroke")
				})
				.style("opacity", function(){
					return getStyle(this, "opacity")
				})
				.style("stroke-width", function(){
					return getStyle(this, "stroke-width")
				});
			
			//gets the current style
			function getStyle(element, styleName){
				var styleText = d3.select(element)
					.select("desc")
					.text();

				var styleObject = JSON.parse(styleText);

				return styleObject[styleName];
			};
			
			d3.select(".infolabel")
        		.remove();
		};
		
		//function to set the label
		function setLabel(props){
			var labelAttribute = "<h1>" + props[expressed] +
				"</h1><b>" + ' / 1000' + "</b>";

			//create info label div
			var infolabel = d3.select("body")
				.append("div")
				.attr("class", "infolabel")
				.attr("id", props.district)
				.html(labelAttribute);
			//this if statement makes sure the nieghborhood name shows up for both the map/bars
			//it fixes a bug where only one or the other shows up and can be removed if/when that bug is found.
			if (props['Neighborhood'] != props['Neighborhood']) {
				var regionName = infolabel.append("div")
				.attr("class", "labelname")
				.html(csvData[props.district -1]['Neighborhood']);
			} else {
				var regionName = infolabel.append("div")
				.attr("class", "labelname")
				.html(props['Neighborhood'])
			}
		};
		
		//function to move label with mouse
		function moveLabel(){
			if (window.innerWidth > 1500){
				var xOffset = d3.event.clientX - 150;
				var yOffset = d3.event.clientY - 95;
			} else if (window.innerWidth > 900) {
				var xOffset = d3.event.clientX - 100;
				var yOffset = d3.event.clientY - 75;		   
			} else {
				var xOffset = d3.event.clientX - 80;
				var yOffset = d3.event.clientY - 60;
			}
			//use coordinates of mousemove event to set label coordinates
			var x = xOffset,
				y = yOffset;

			d3.select(".infolabel")
				.style("left", x + "px")
				.style("top", y + "px");
		};


		
		// function that returns an array with values of a specific crime for every region/year.
		function crimeValues() {
			var valueArr = [];
			var cr = document.getElementById("Crime").value;
			for (i in csvData) {
				for (x in years) {
					valueArr.push(parseInt(csvData[i][cr.replace(/\s/g, '')+years[x]]));
				}
			}
			// replace NaN with 0
			for (x in valueArr) {
				if (valueArr[x] !== valueArr[x]) {
					valueArr[x] = 0;
				}
			}
			return valueArr;
		};
		

		//create a scale to size bars proportionally to frame
		var yScale = d3.scaleLinear()
			.range([0, chartHeight])
			.domain([0,d3.max(valueArr)*1.10]);
		
		
		
		//function to change the attributes displayed after changed via dropdown
		function changeAttribute(attribute, csvData){
			//change the expressed attribute
			expressed = attribute;

			//recreate the color scale
			var colorScale = makeColorScale(csvData, d3.min(crimeValues()), d3.max(crimeValues()));
			
			//new scale update
			var yScale2 = d3.scaleLinear()
				.range([0, chartHeight])
				.domain([0,d3.max(crimeValues())*1.10]);

			//recolor enumeration units
			var district = d3.selectAll(".district")
			    .transition()
        		.duration(1000)
				.style("fill", function(d){
					return choropleth(d.properties, colorScale)
				});
			
			var bars = d3.selectAll(".bars")
			    .sort(function(a, b){
            		return a[expressed]-b[expressed];
				})
				.transition() //add animation
        		.delay(function(d, i){
            		return i * 20
        		})
        		.duration(500)
				.attr("x", function(d, i){
					return i * (chartWidth / csvData.length);
				})
				.attr("height", function(d){
            		return yScale2(parseFloat(d[expressed]));
        		})
        		.attr("y", function(d){
            		return chartHeight - yScale2(parseFloat(d[expressed]));
        		})
				.style("fill", function(d){
            		return choropleth(d, colorScale);
        		});
			
			var numbers = d3.selectAll(".numbers")
					.sort(function(a, b){
						return a[expressed]-b[expressed]
					})
					.transition() //add animation
        			.delay(function(d, i){
            			return i * 20
        			})
        			.duration(500)
					.attr("text-anchor", "middle")
					.attr("x", function(d, i){
						var fraction = chartWidth / csvData.length;
						return i * fraction + (fraction - 1) / 2;
					})
					.attr("y", function(d){
						return chartHeight - yScale2(parseFloat(d[expressed])) + 25;
					})
					.text(function(d){
						return d[expressed];
					});
		};
		
		
		
		
		//function to create a dropdown menu for attribute selection
		function createDropdown(type, defaultSelection, data){
			//add select element
			var dropdown = d3.select("body")
				.append("select")
				.attr("class", "dropdown " + type)
				.attr("id", type)
				.property("selected",3)
				.on("change", function(){
					var cr = document.getElementById("Crime").value;
					var yr = document.getElementById("Year").value;
					changeAttribute(cr.replace(/\s/g, '')+yr, csvData)
				});


			//add initial option
			var titleOption = dropdown.append("option")
				.attr("class", "titleOption")
				.attr("disabled", "true")
				.text("Select " + type);

			//add attribute name options
			var attrOptions = dropdown.selectAll("attrOptions")
				.data(data)
				.enter()
				.append("option")
				.attr("value", function(d){ return d })
				.text(function(d){ return d });
			
			document.getElementById(type).value = defaultSelection;
		};
		
		
		function setChart(csvData, colorScale){

			//create chart div
			var chart = d3.select("body")
				.append("svg")
				.attr("width", chartWidth)
				.attr("height", chartHeight)
				.attr("class", "chart");

			//set bars for each neighborhood
			var bars = chart.selectAll(".bars")
				.data(csvData)
				.enter()
				.append("rect")
			    .sort(function(a, b){
            		return a[expressed]-b[expressed];
				})
				.attr("class", function(d){
					return "bars a" + d.District;
				})
				.attr("width", chartWidth / csvData.length - 1)
				.attr("x", function(d, i){
					return i * (chartWidth / csvData.length);
				})
				.attr("height", function(d){
            		return yScale(parseFloat(d[expressed]));
        		})
        		.attr("y", function(d){
            		return chartHeight - yScale(parseFloat(d[expressed]));
        		})
				.on("mouseover", highlight)
				.on("mouseout", dehighlight)
				.on("mousemove", moveLabel)
				.style("fill", "white");
			
			//add bar description for dehighlight
			var desc = bars.append("desc")
        		.text('{"stroke": "none", "stroke-width": "0px"}');
			
			//add numbers to bars
			var numbers = chart.selectAll(".numbers")
				.data(csvData)
				.enter()
				.append("text")
				.sort(function(a, b){
					return a[expressed]-b[expressed]
				})
				.attr("class", function(d){
					return "numbers " + d.District;
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
	
		};
		
		//create both dropdowns
		createDropdown('Crime', 'Robbery', crimes);
		createDropdown('Year', '2016', years);
		
		
		//color scale
		function makeColorScale(data, min, max){
			var colorClasses = [
				"#B1DE97",
				"#CEE17D",
				"#EBE463",
				"#E78E4E",
				"#B82828"
			];

			//create color scale generator
			var colorScale = d3.scaleQuantile()
				.range(colorClasses);

			//build two-value array of minimum and maximum expressed attribute values
			var minmax = [
				min,
				max
			];
			//assign two-value array as scale domain
			colorScale.domain(minmax);
			return colorScale;
		};
		
		
		
		//return colorscale
		function choropleth(props, colorScale){
			//make sure attribute value is a number
			var val = parseFloat(props[expressed]);
			//if attribute value exists, assign a color; otherwise assign gray
			if (typeof val == 'number' && !isNaN(val)){
				return colorScale(val);
			} else {
				return "#CCC";
			};
		};
		
		//create colorscale
		var colorScale = makeColorScale(csvData,0 ,9);
		setChart(csvData, colorScale);
		
		//join csv and district
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
		
		
		//create map of saint paul
		var neighborhoods = map.append("g")
			.selectAll("path")
			.data(districts)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("class", function(d){
				return "district a" + d.properties.district;
			})
			.style("fill", "white")
			.style("opacity", "1")
			.on("mouseover", function(d){
            	highlight(d.properties);
			})
			.on("mousemove", moveLabel)
			.on("mouseout", function(d){
            	dehighlight(d.properties);
			});
		
		// set initial data view
		changeAttribute('Robbery2016', csvData);
		
		// set neighborhoods description for dehighlight
		var desc = neighborhoods.append("desc")
        	.text('{"stroke": "#f4f4eb", "opacity": "1", "stroke-width": "1px"}');
	};
};
	
})();




