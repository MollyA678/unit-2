
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

    //create the map
    map = L.map('map', {
        center: [0, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

// To scale the proportional symbols reasonably
function calcPropRadius(attValue){
    var scaleFactor = 0.00005;
    var area = attValue * scaleFactor;
    return Math.sqrt(area / Math.PI);
}

// Updating the proportional symbol radius to the input
function updatePropSymbols(timestamp){
    geojsonLayer.eachLayer(function(layer){
        var props = layer.feature.properties;
        var value = Number(props[timestamp]);

        if (!value) value = 0;

        var radius = calcPropRadius(value);
        layer.setRadius(radius);
       // New spot for popup
        var popupContent =
            "<p><b>City:</b> " + props.City + "</p>" +
            "<p><b>Year:</b> " + timestamp + "</p>" +
            "<p><b>Population:</b> " + value.toLocaleString() + "</p>";

        layer.bindPopup(popupContent);
    });
}

// Creating the sequence controls
function createSequenceControls(){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'sequence-control-container');

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

    // Slider settings
    document.querySelector(".range-slider").max = timestamps.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").step = 1;
    document.querySelector(".range-slider").value = currentIndex;

    // Slider input
    document.querySelector(".range-slider").addEventListener('input', function(){
        currentIndex = Number(this.value);
        updatePropSymbols(timestamps[currentIndex]);
    });

    // Figuring out the wrap around
    document.querySelector("#forward").addEventListener("click", function(){
        currentIndex++;
        if (currentIndex > timestamps.length - 1) {
            currentIndex = 0; // Loop to start
        }
        document.querySelector(".range-slider").value = currentIndex;
        updatePropSymbols(timestamps[currentIndex]);
    });

    document.querySelector("#reverse").addEventListener("click", function(){
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = timestamps.length - 1; // Loop to end
        }
        document.querySelector(".range-slider").value = currentIndex;
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
            //Calling the sequence controls and making sure the symbols match input
            createSequenceControls();
            updatePropSymbols(timestamps[currentIndex]);
        });
    }
document.addEventListener('DOMContentLoaded',createMap);