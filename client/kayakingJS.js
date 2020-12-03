Template.kayaking_map.onRendered(function(){
	GoogleMaps.load({'key': 'AIzaSyBxdV3tMkI-8b514F9GvOB-sZHjAOZ9ahc',
		'libraries': 'places, geometry'});
	GoogleMaps.ready('KayakMap', function(map) {
		// This code is for geolocation
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
		    var pos = {
		      lat: position.coords.latitude,
		      lng: position.coords.longitude
		    };

		    map.instance.setCenter(pos);
		  }, function() {
		    handleLocationError(true, infoWindow, map.instance.getCenter());
		  });
		} else {
		  // Browser doesn't support Geolocation
		  handleLocationError(false, infoWindow, map.instance.getCenter());
		}

		function handleLocationError(browserHasGeolocation, infoWindow, pos) {
		infoWindow.setPosition(pos);
		infoWindow.setContent(browserHasGeolocation ?
		                      'Error: The Geolocation service failed.' :
		                      'Error: Your browser doesn\'t support geolocation.');
		}

		// the code below is for the search box feature
		var input = document.getElementById('pac-input');
		var searchBox = new google.maps.places.SearchBox(input);
		map.instance.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

		// Bias the SearchBox results towards current map's viewport.
		map.instance.addListener('bounds_changed', function() {
		  searchBox.setBounds(map.instance.getBounds());
		});
		markers = []
		// Listen for the event fired when the user selects a prediction and retrieve
		// more details for that place.
		searchBox.addListener('places_changed', function() {
			var places = searchBox.getPlaces();

			if (places.length == 0) {
				return;
			}
			// Clear out the old markers.
			markers.forEach(function(marker) {
				marker.setMap(null);
			});
			markers = [];
			deleteMarkers();
			// For each place, get the icon, name and location.
			var bounds = new google.maps.LatLngBounds();
			places.forEach(function(place) {
				if (!place.geometry) {
				  console.log("Returned place contains no geometry");
				  return;
				}
				var icon = {
				  url: place.icon,
				  size: new google.maps.Size(71, 71),
				  origin: new google.maps.Point(0, 0),
				  anchor: new google.maps.Point(17, 34),
				  scaledSize: new google.maps.Size(25, 25)
				};

				// Create a marker for each place.
				markers.push(new google.maps.Marker({
				  map: map.instance,
				  icon: icon,
				  title: place.name,
				  position: place.geometry.location
				}));

				if (place.geometry.viewport) {
				  // Only geocodes have viewport.
				  bounds.union(place.geometry.viewport);
				} else {
				  bounds.extend(place.geometry.location);
				}
			});
			map.instance.fitBounds(bounds);
			var map_center = GoogleMaps.maps.KayakMap.instance.getCenter().toJSON();
			Session.set('map_center',map_center);
		});
	});	
	Session.setDefault('map_radius',0);
	Session.setDefault('map_center',{lat: 42.733861499999996, lng: -73.68201099999999});
});

Template.kayaking_map.helpers({
	kayakmapoptions: function() {
	    // Make sure the maps API has loaded
	    if (GoogleMaps.loaded()) {
	      // Map initialization options
	      return {
	        center: new google.maps.LatLng(43.2045, -73.274243),
	        zoom: 7
	      };
	    }
    }
});

Template.kayaking_map.events({
	'keyup .input': function(event){
		var radius = $('input[name="radius"]').val();
		var map_center = GoogleMaps.maps.KayakMap.instance.getCenter().toJSON();
		Session.set('map_radius',radius);
		//loadData();
	}
});

// Tracker.autorun(function() {
// 	Meteor.subscribe('River_geoJSON',Session.get('map_radius'),Session.get('map_center'));
// 	river_locations = River_geoJSON.find({}).fetch();
// 	debugger;
// 	//setMarkers(river_locations);
// });

markers = [];

function deleteMarkers(){
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];
};

function loadData(){
	var radius = $('input[name="radius"]:checked').val();
	var map_center = GoogleMaps.maps.KayakMap.instance.getCenter().toJSON();	
	// Meteor.subscribe('River_geoJSON',radius,map_center);
	river_locations = River_geoJSON.find({}).fetch();
	setMarkers(river_locations);
	debugger;		
};

function setMarkers() {
	deleteMarkers();
	markers = [];
	var infowindow = new google.maps.InfoWindow()
	for (var i = 0; i < river_locations.length; i++){
		var locations = river_locations[i];
		var longitude = parseFloat(locations.location.coordinates[0]);
		var latitude = parseFloat(locations.location.coordinates[1]); 
		var name = locations.name	
		var rating = locations.rating
		var description = locations.description.replace('>AW',"target='_blank'>AW")
		var state = locations.state
		var contentString = '<div class="infocontent">' + '<h3 class="firstHeading">' + name + ': ' + rating + '</h3>' + 
			'<p>' + description + '</p>' + '</div>'
		// var infowindow = new google.maps.InfoWindow({
  //         content: contentString,
  //         maxWidth: 200
  //       });
		var marker = new google.maps.Marker({
			position: {lat: latitude, lng: longitude},
			map: GoogleMaps.maps.KayakMap.instance,
			title: name
		});		
        google.maps.event.addListener(marker,'click', (function(marker,contentString,infowindow) {
        	return function(){
        		infowindow.setContent(contentString);
        		infowindow.open(GoogleMaps.maps.KayakMap.instance, this);
        	};          
        })(marker,contentString,infowindow));
        markers.push(marker);
	};
};

Template.kayaking_map.onCreated(function(){
	this.autorun(()=>{	
		var subscription = Meteor.subscribe('River_geoJSON',Session.get('map_radius'),Session.get('map_center'));
		if(subscription.ready()){
			river_locations = River_geoJSON.find({}).fetch();
			setMarkers(river_locations)
		}
	});	
});