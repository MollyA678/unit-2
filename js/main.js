
//declare map variable globally so all functions have access
var map;
// New variables
var timestamps = [
    "-500","0","600","1000","1300","1500",
    "1700","1800","1850","1900","1950","2000","Current"
];

var currentIndex = 0;
var geojsonLayer;

//function to instantiate the Leaflet map
function createMap(){

    //create the map and add a pan/zoom extent
   map = L.map('map', {
    center: [25, 105],   // centered roughly on East Asia
    zoom: 4,
    minZoom: 3,
    maxZoom: 7,
    maxBounds: [
        [-20, 60],   // southwest corner
        [60, 150]    // northeast corner
    ],
    maxBoundsViscosity: 1.0
});

    // not adding OSM base tilelayer anymore. Found a different one on leaflet providers, which is in lib now
    L.tileLayer.provider('CartoDB.DarkMatter').addTo(map);

    //call getData function
    getData(map);
};

// To scale the proportional symbols reasonably. Added flannerys
function calcPropRadius(attValue){
    var minRadius = 3;
    var maxValue = 37468000; //normalizing scaling to the largest population
    var scaledValue = attValue / maxValue;
    var radius = 30 * Math.pow(scaledValue, 0.5715);
    return radius + minRadius;
}

// Updating the proportional symbol radius to the input
function updatePropSymbols(timestamp){
    geojsonLayer.eachLayer(function(layer){
        var props = layer.feature.properties;
        var value = Number(props[timestamp]);

        // Making cities only show up once they have a population
        if (!value || value <= 0){
        layer.setRadius(0);
        return;
}

        var radius = calcPropRadius(value);
        layer.setRadius(radius);
       // New spot for popup. Moved year from popup to slider
       var population = Number(props[timestamp]).toLocaleString(); 
       var popupContent =
            "<p><b>City:</b> " + props.City + "</p>" +
            "<p><b>Population:</b> " + population + "</p>";

        layer.bindPopup(popupContent);
    });
}

// Calculating max for legend
function getMaxValue(){

    var max = 0;

    geojsonLayer.eachLayer(function(layer){
        var props = layer.feature.properties;

        timestamps.forEach(function(year){
            var value = Number(props[year]);

            if (value > max){
                max = value;
            }
        });
    });

    return max;
}

// Rounding the legend numbers
function roundLegendMax(value){

    var magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    var rounded = Math.ceil(value / magnitude) * magnitude;

    return rounded;
}

// Creating the dynamic legend
function createLegend(){

    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {

            var container = L.DomUtil.create('div','legend-control-container');

            var max = roundLegendMax(getMaxValue());

            var values = [
                roundLegendMax(max), 
                roundLegendMax(max / 2), 
                roundLegendMax(max / 4)
            ];

            container.innerHTML += "<b>Population</b><br>";

            values.reverse().forEach(function(value){

                var radius = calcPropRadius(value);

                container.innerHTML +=
                    '<div class="legend-circle">' +
                    '<svg width="' + (radius*2) + '" height="' + (radius*2) + '">' +
                    '<circle cx="' + radius +
                    '" cy="' + radius +
                    '" r="' + radius +
                    '" fill="#ff7800" fill-opacity="0.8" stroke="#000"/>' +
                    '</svg> ' +
                    value.toLocaleString() +
                    '</div>';
            });

            return container;
        }
    });

    map.addControl(new LegendControl());
}

// Creating the sequence controls
function createSequenceControls(){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // Labeling the slider
            container.innerHTML += '<div class="year-label" id="yearLabel"></div>';

            // Previous button
            container.innerHTML += '<button class="step" id="reverse">⟵</button>';

            // Slider
            container.innerHTML += '<input class="range-slider" type="range">';

            // Next button
            container.innerHTML += '<button class="step" id="forward">⟶</button>';

            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });

    map.addControl(new SequenceControl());

    var slider = document.querySelector(".range-slider");
    var yearLabel = document.querySelector("#yearLabel");
    yearLabel.innerHTML = timestamps[currentIndex];

    // Slider settings
    slider.max = timestamps.length - 1;
    slider.min = 0;
    slider.step = 1;
    slider.value = currentIndex;

    yearLabel.innerHTML = timestamps[currentIndex];

    // Slider input.
    slider.addEventListener("input", function(){
        currentIndex = Number(this.value);
        yearLabel.innerHTML = timestamps[currentIndex];
        updatePropSymbols(timestamps[currentIndex]);
    });


    // Figuring out the wrap around
    document.querySelector("#forward").addEventListener("click", function(){
        currentIndex++;
        if (currentIndex > timestamps.length - 1) {
            currentIndex = 0; // Loop to start
        }
        slider.value = currentIndex;
        yearLabel.innerHTML = timestamps[currentIndex];
        updatePropSymbols(timestamps[currentIndex]);
    });

    // reverse slider
    document.querySelector("#reverse").addEventListener("click", function(){
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = timestamps.length - 1; // Loop to end
        }
        slider.value = currentIndex;
        yearLabel.innerHTML = timestamps[currentIndex];
        updatePropSymbols(timestamps[currentIndex]);
    });
}

// Function to retrieve the data and place it on the map
function getData(map){
    fetch("./data/population_cities.geojson")
		.then(function(response){
			return response.json();
		})
        //Changing this function slightly so the symbols change
		.then(function(json){

            geojsonLayer = L.geoJson(json, {

            pointToLayer: function (feature, latlng){
                return L.circleMarker(latlng, {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },

            //Made the geojsonLayer variable global
            
            //Moved the popup up to a seperate function

            }).addTo(map);
            //Trying to get map to zoom right to the data. 
            map.fitBounds(geojsonLayer.getBounds());
            //Calling the sequence controls and legend and making sure the symbols match input
            createSequenceControls();
            createLegend();
            updatePropSymbols(timestamps[currentIndex]);
        });
    }
document.addEventListener('DOMContentLoaded',createMap);