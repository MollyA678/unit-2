
//declare map variable globally so all functions have access
var map;

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

//function to retrieve the data and place it on the map
function getData(map){
    fetch("./data/population_cities.geojson")
		.then(function(response){
			return response.json();
		})
		.then(function(json){
            var geojsonMarkerOptions = {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            //create a Leaflet GeoJSON layer and add it to the map. Added a variable for the zoom to
            var geojsonLayer =L.geoJson(json, {
                pointToLayer: function (feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
            //Making it so the properties show up when you hover
            onEachFeature: function(feature, layer){
                var popupContent = 
                  "<b>City:</b> " + feature.properties.City + "<br>" +
                  "<b>Country:</b> " + feature.properties.Country + "<br>" +
                  "<b>Population:</b> " + feature.properties.Population;

                layer.bindPopup(popupContent);

                layer.on({
                    mouseover: function () {
                        this.openPopup();
                    },
                    mouseout: function () {
                        this.closePopup();
                    }
                });
            }

            }).addTo(map);
            //Trying to get map to zoom right to the data. 
            map.fitBounds(geojsonLayer.getBounds());
        })
};

document.addEventListener('DOMContentLoaded',createMap)