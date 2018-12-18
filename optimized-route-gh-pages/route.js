/**
allLoc = {
    'route': [{
        'name': 'customer A',
        'address': 'address A',  // not sure if needed in the infoWindow
        'coordinates': [22.308319, 114.225608], //should be better if the LatLng object is also stored
        'status': 'incomplete or finished'
    }]
}
**/


var allLoc = {
    'route': [{
        'name': 'customer A',
        'address': 'address A',
        'coordinates': [22.3868235, 114.2040794],
        'status': 'finished'
    },
    {
        'name': 'customer B',
        'address': 'address B',
        'coordinates': [22.322371, 114.218600],
        'status': 'incomplete'
    },
    {
        'name': 'customer C',
        'address': 'address C',
        'coordinates': [22.3073879, 114.2240354],
        'status': 'incomplete'
    },
    {
        'name': 'customer D',
        'address': 'address D',
        'coordinates': [22.308319, 114.225608],
        'status': 'incomplete'
    }]
};

var todoLoc = []; // array for incomplete points
var doneLoc = []; // array for finished points

function initMap() {
    // status to indicate whether the location list has finished points
    // default = true means all points are incomplete (all green route)
    // false means grey or green + grey route
    var allGreen = true; 
    
    var myOptions = {  // a center must be defined when calling the Map class
            zoom: 13,
            center: {lat: 22.4513604, lng: 114.1618337},
            disableDefaultUI: true, // hide all default google maps buttons
        }
    var map = new google.maps.Map(document.getElementById('map'), myOptions);

    // add traffic condition to the map
    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
   
    var directionsService = new google.maps.DirectionsService;
   
    var directionsDisplay = new google.maps.DirectionsRenderer({  // render green route
            map: map,
            polylineOptions: {
            strokeColor: "#1386DD",
            strokeWeight: 7,
            strokeOpacity: 0.7,
            }, 
            suppressMarkers: true  // suppress directions default markers and show ours
        });

    var finishedDirections = new google.maps.DirectionsRenderer({  // render grey route
            map: map,
            polylineOptions: {
            strokeColor: "grey",
            strokeWeight: 7,
            strokeOpacity: 0.6,
            }, 
            suppressMarkers: true
        });
    
    var infowindow = new google.maps.InfoWindow();
    
    var hunghing = new google.maps.LatLng(22.4539818, 114.1919158); // convert coor into latlng obj
    var start = new google.maps.Marker({  // grey marker
                            position: hunghing, // this param requires a latlng obj i/o coor
                            title: 'start',
                            map: map,
                            icon: "http://www.googlemapsmarkers.com/v1/CACDCE"
                        });

    for (var i in allLoc['route']){
            var coordinates = allLoc['route'][i]['coordinates'];
            var wayPoint = new google.maps.LatLng(coordinates[0], coordinates[1]); 
   
            if (allLoc['route'][i]['status'] === 'incomplete' && todoLoc.length == 0){
                var marker = new google.maps.Marker({  // green marker for incomplete points
                        position: wayPoint,
                        title: `point${i}`,
                        map: map,
                        icon: "http://www.googlemapsmarkers.com/v1/00FF00"
                    });
                todoLoc.push({
                            location: wayPoint, 
                            stopover: true
                        });
            } else if (allLoc['route'][i]['status'] === 'incomplete' && todoLoc.length > 0) {
                    var marker = new google.maps.Marker({  // green marker for incomplete points
                            position: wayPoint,
                            title: `point${i}`,
                            map: map,
                            icon: "http://www.googlemapsmarkers.com/v1/D82E22"
                        });
                    // addListener('click', function(){
                    //             new google.maps.InfoWindow({
                    //                 content: allLoc['route'][i]['name']
                    //         }).open(map, this);
                    //     });
                    todoLoc.push({
                        location: wayPoint, 
                        stopover: true
                    });
                } else {
                    allGreen = false; // need grey route of there are finished points in the list
                    var marker = new google.maps.Marker({ // grey marker for finished points
                            position: wayPoint,
                            title: `point${i}`,
                            map: map,
                            icon: "http://www.googlemapsmarkers.com/v1/CACDCE"
                        });
                    doneLoc.push({
                        location: wayPoint, 
                        stopover: true
                    });
                }
                             
                google.maps.event.addListener(marker, 'click', (function (marker, i) {
                    return function () {
                        infowindow.setContent(allLoc['route'][i]['name']);
                        infowindow.open(map, marker);
                    }
                })(marker, i)); 
                // https://stackoverflow.com/questions/32798480/assign-infowindow-for-each-marker-in-google-maps
                // closure ??
                // google.maps.event.addListener(marker[i], 'click', function () {
                // infowindow.setContent('<div>' + allLoc['route'][i]['name'] + '</div>');
                // infowindow.open(map, this);
                // });
        }

    getRoute(directionsService, directionsDisplay, finishedDirections, allGreen);
}


function getRoute(directionsService, directionsDisplay, finishedDirections, allGreen) {

    // waypoint is an array of dictionaries
    // waypoint = [{'location': LatLng obj, 'stopover': true}, {}, {} ...]
    var company = new google.maps.LatLng(22.4539818, 114.1919158); // company coor (17, dai hei street)
    
    if (allGreen === true) {  // from company to the last of the waypoints
        var greenRequest  = {
            origin: company,
            destination: todoLoc[todoLoc.length - 1]['location'],
            waypoints: todoLoc,
            travelMode: google.maps.TravelMode.DRIVING
        };
    } else { 
        var grayRequest  = { // gray route is from company to the last finished location
            origin: company,
            destination: doneLoc[doneLoc.length - 1]['location'],
            waypoints: doneLoc,
            travelMode: google.maps.TravelMode.DRIVING
        };
    }

    if (todoLoc.length > 0 && allGreen === false) {
        var greenRequest = { // green route is from last finished location to the last of the waypoints
            origin: doneLoc[doneLoc.length - 1]['location'],
            destination: todoLoc[todoLoc.length - 1]['location'],
            waypoints: todoLoc,
            travelMode: google.maps.TravelMode.DRIVING
        };
    }
    
    if (grayRequest) { // get the grey route if required
        directionsService.route(grayRequest, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    finishedDirections.setDirections(response);
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
    }

    if (greenRequest) {
        directionsService.route(greenRequest, function (response, status) { 
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }
}