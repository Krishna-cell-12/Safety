       // Global variables
let map;
let userMarker;
let accuracyCircle;
let directionsRenderer;
let dangerZones = [];
let watchPositionId = null;
let shareLocationInterval = null;
let sharedLocations = {};
let isSharingLocation = false;
let currentRoute = null;
let destinationMarker = null;
let serviceMarkers = [];
let locationAttempts = 0;
const MAX_LOCATION_ATTEMPTS = 3;

// Show loading overlay initially
document.addEventListener('DOMContentLoaded', function() {
    // Update the signin/login CSS styles directly
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.style.backgroundColor = '#5d5df7';
        ctaButton.style.color = '#fff';
        ctaButton.style.padding = '8px 16px';
        ctaButton.style.borderRadius = '6px';
        ctaButton.style.fontSize = '14px';
        ctaButton.style.fontWeight = 'bold';
        ctaButton.style.cursor = 'pointer';
        ctaButton.style.transition = 'background-color 0.3s ease';
        ctaButton.style.border = 'none';
        ctaButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        
        // Add hover effect
        ctaButton.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#4a4ae6';
        });
        
        ctaButton.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#5d5df7';
        });
    }
    
    // Simulate loading time (remove in production)
    setTimeout(() => {
        document.getElementById('loadingOverlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'none';
        }, 500);
    }, 1500);
});

// Toast notification function
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Initialize the map
function initMap() {
    // Default location (Bangalore)
    const defaultLocation = { lat: 12.971599, lng: 77.594566 };
    
    // Map styles - Dark cosmic theme
    const cosmicMapStyles = [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ];
    
    // Create the map
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: defaultLocation,
        styles: cosmicMapStyles,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
    });
    
    // Initialize directions renderer
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#7CFC00",
            strokeWeight: 6,
            strokeOpacity: 0.7
        }
    });
    directionsRenderer.setMap(map);
    
    // Try to get user's location
    locateUser();
    
    // Set up event listeners
    document.getElementById('locateButton').addEventListener('click', () => {
        locationAttempts = 0; // Reset attempts counter when manually clicked
        locateUser();
    });
    
    document.getElementById('routeButton').addEventListener('click', findSafeRoute);
    
    document.getElementById('shareButton').addEventListener('click', toggleShareLocation);
    
    document.getElementById('policeButton').addEventListener('click', () => {
        showEmergencyAlert("Police");
    });
    
    document.getElementById('ambulanceButton').addEventListener('click', () => {
        showEmergencyAlert("Ambulance");
    });
    
    document.getElementById('settingsButton').addEventListener('click', () => {
        showToast("Opening settings...");
    });
    
    // Add initial danger zones - multiple locations
    setTimeout(createDangerZones, 2000);
}

// Create multiple danger zones in different locations
function createDangerZones() {
    // Clear any existing danger zones
    clearDangerZones();
    
    if (!map) return;
    
    const center = map.getCenter();
    const bounds = map.getBounds();
    
    if (!bounds) {
        // If bounds aren't available yet, try again in a second
        setTimeout(createDangerZones, 1000);
        return;
    }
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Calculate map dimensions to place danger zones intelligently
    const latSpan = ne.lat() - sw.lat();
    const lngSpan = ne.lng() - sw.lng();
    
    // Create 5-8 danger zones at strategic positions
    const numZones = 5 + Math.floor(Math.random() * 4);
    
    // List of possible danger zone types
    const dangerTypes = [
        "High Crime Area", 
        "Reported Incident", 
        "Recent Assault", 
        "Active Investigation",
        "Low Visibility Area",
        "Unauthorized Access",
        "Reported Theft",
        "Public Warning"
    ];
    
    // Add danger zones at various positions
    for (let i = 0; i < numZones; i++) {
        // Create a somewhat random position but ensure good distribution
        // We divide the map into sections and place danger zones in different sections
        const section = i % 4; // 4 quadrants of the map
        
        let lat, lng;
        
        switch(section) {
            case 0: // Northeast
                lat = center.lat() + (Math.random() * 0.7 + 0.1) * latSpan/2;
                lng = center.lng() + (Math.random() * 0.7 + 0.1) * lngSpan/2;
                break;
            case 1: // Northwest
                lat = center.lat() + (Math.random() * 0.7 + 0.1) * latSpan/2;
                lng = center.lng() - (Math.random() * 0.7 + 0.1) * lngSpan/2;
                break;
            case 2: // Southeast
                lat = center.lat() - (Math.random() * 0.7 + 0.1) * latSpan/2;
                lng = center.lng() + (Math.random() * 0.7 + 0.1) * lngSpan/2;
                break;
            case 3: // Southwest
                lat = center.lat() - (Math.random() * 0.7 + 0.1) * latSpan/2;
                lng = center.lng() - (Math.random() * 0.7 + 0.1) * lngSpan/2;
                break;
        }
        
        // Random danger zone type
        const dangerType = dangerTypes[Math.floor(Math.random() * dangerTypes.length)];
        
        // Random size (between 100-300 meters)
        const radius = 100 + Math.random() * 200;
        
        dangerZones.push(addDangerZone(map, {lat, lng}, dangerType, radius));
    }
    
    // Add a danger zone near user's location if available
    if (userMarker) {
        const userPos = userMarker.getPosition();
        const offsetLat = (Math.random() - 0.5) * 0.003;
        const offsetLng = (Math.random() - 0.5) * 0.003;
        
        dangerZones.push(addDangerZone(map, 
            {lat: userPos.lat() + offsetLat, lng: userPos.lng() + offsetLng}, 
            "Nearby Risk", 150));
    }
}

// Clear all danger zones
function clearDangerZones() {
    dangerZones.forEach(zone => {
        zone.setMap(null);
    });
    dangerZones = [];
}

// Locate user function with improved error handling
function locateUser() {
    if (navigator.geolocation) {
        showToast("Finding your location...");
        
        // Stop any previous watch
        if (watchPositionId) {
            navigator.geolocation.clearWatch(watchPositionId);
        }
        
        // Get current position and watch for changes with improved timeout handling
        watchPositionId = navigator.geolocation.watchPosition(
            (position) => {
                // Reset attempts on success
                locationAttempts = 0;
                
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                
                // Center map on user location
                map.setCenter(userLocation);
                map.setZoom(16);
                
                // Update or create user marker
                if (!userMarker) {
                    userMarker = new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: "Your Location",
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: "#00FFFF",
                            fillOpacity: 0.8,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF",
                        },
                    });
                } else {
                    userMarker.setPosition(userLocation);
                }
                
                // Update or create accuracy circle
                if (!accuracyCircle) {
                    accuracyCircle = new google.maps.Circle({
                        map: map,
                        center: userLocation,
                        radius: position.coords.accuracy,
                        strokeColor: "#1E90FF",
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: "#00FFFF",
                        fillOpacity: 0.2,
                    });
                } else {
                    accuracyCircle.setCenter(userLocation);
                    accuracyCircle.setRadius(position.coords.accuracy);
                }
                
                showToast("Location updated");
                
                // Create danger zones around user location
                createDangerZones();
            },
            (error) => {
                // Increase attempts counter
                locationAttempts++;
                
                // Handle location error
                let errorMessage = "Could not access your location";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access was denied. Please enable location services in your browser settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get your location timed out.";
                        break;
                }
                
                // If we've had multiple failures, provide more help
                if (locationAttempts >= MAX_LOCATION_ATTEMPTS) {
                    errorMessage += " Using default location instead.";
                    // Use default location if we can't get the user's
                    fallbackToDefaultLocation();
                } else {
                    // Try again with higher timeout before giving up
                    showToast(errorMessage + " Retrying...", 2000);
                    setTimeout(locateUser, 2000);
                    return;
                }
                
                showToast(errorMessage, 5000);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,  // Accept cache up to 10 seconds old
                timeout: 15000      // Wait 15 seconds before timing out
            }
        );
    } else {
        // Browser doesn't support geolocation
        showToast("Your browser doesn't support geolocation. Using default location.", 5000);
        fallbackToDefaultLocation();
    }
}

// Fallback to default location if user location can't be determined
function fallbackToDefaultLocation() {
    // Use Bangalore as default
    const defaultLocation = { lat: 12.971599, lng: 77.594566 };
    
    map.setCenter(defaultLocation);
    map.setZoom(14);
    
    // Create user marker at default location
    if (!userMarker) {
        userMarker = new google.maps.Marker({
            position: defaultLocation,
            map: map,
            title: "Default Location",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#FFFF00", // Yellow to indicate this is not the actual location
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
            },
        });
    } else {
        userMarker.setPosition(defaultLocation);
    }
    
    // Update or create accuracy circle
    if (!accuracyCircle) {
        accuracyCircle = new google.maps.Circle({
            map: map,
            center: defaultLocation,
            radius: 500, // Larger accuracy circle to indicate uncertainty
            strokeColor: "#FFA500",
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: "#FFFF00",
            fillOpacity: 0.2,
        });
    } else {
        accuracyCircle.setCenter(defaultLocation);
        accuracyCircle.setRadius(500);
    }
    
    // Create danger zones around default location
    createDangerZones();
}

// Add a danger zone to the map with variable radius
function addDangerZone(map, location, title, radius = 200) {
    const dangerZone = new google.maps.Circle({
        map: map,
        center: location,
        radius: radius, // variable radius in meters
        strokeColor: "#DC143C",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF6347",
        fillOpacity: 0.35,
    });
    
    const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color: #333; font-weight: bold;">${title}</div>`,
    });
    
    google.maps.event.addListener(dangerZone, 'click', function() {
        infoWindow.setPosition(location);
        infoWindow.open(map);
    });
    
    return dangerZone;
}

// Find safe route function
function findSafeRoute() {
    if (!userMarker) {
        showToast("Please enable location services first");
        return;
    }
    
    showToast("Finding safe route to nearest emergency center...");
    
    const userLocation = userMarker.getPosition();
    
    // Clear previous route if exists
    if (currentRoute) {
        directionsRenderer.setDirections({routes: []});
        currentRoute = null;
    }
    
    // Remove previous destination marker if exists
    if (destinationMarker) {
        destinationMarker.setMap(null);
        destinationMarker = null;
    }
    
    // Get map bounds to place destinations realistically
    const bounds = map.getBounds();
    if (!bounds) {
        showToast("Map is not fully loaded. Please try again.");
        return;
    }
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latSpan = ne.lat() - sw.lat();
    const lngSpan = ne.lng() - sw.lng();
    
    // Calculate a reasonable destination (not too close, not too far)
    const destination = {
        lat: userLocation.lat() + (Math.random() - 0.5) * latSpan * 0.6,
        lng: userLocation.lng() + (Math.random() - 0.5) * lngSpan * 0.6
    };
    
    // Add destination marker
    destinationMarker = new google.maps.Marker({
        position: destination,
        map: map,
        title: "Emergency Center",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#7CFC00",
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
        },
    });
    
    // Calculate route
    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
        {
            origin: userLocation,
            destination: destination,
            travelMode: google.maps.TravelMode.WALKING,
            avoidHighways: true,
            avoidTolls: true,
            provideRouteAlternatives: true
        },
        function (response, status) {
            if (status === 'OK') {
                // Find the safest route (in a real app, this would use actual safety data)
                let safestRoute = response.routes[0];
                let minDangerScore = calculateDangerScore(response.routes[0], userLocation);
                
                // Check all alternative routes for safer options
                for (let i = 1; i < response.routes.length; i++) {
                    const route = response.routes[i];
                    const dangerScore = calculateDangerScore(route, userLocation);
                    
                    // Prefer routes with less danger, but not significantly longer
                    if (dangerScore < minDangerScore || 
                        (dangerScore === minDangerScore && 
                         route.legs[0].duration.value < safestRoute.legs[0].duration.value)) {
                        safestRoute = route;
                        minDangerScore = dangerScore;
                    }
                }
                
                directionsRenderer.setDirections({
                    routes: [safestRoute],
                    request: response.request
                });
                
                currentRoute = safestRoute;
                
                const leg = safestRoute.legs[0];
                showToast(`Safe route found: ${leg.distance.text}, ${leg.duration.text}`);
            } else {
                showToast('Could not calculate route: ' + status);
            }
        }
    );
}

// Calculate danger score for a route with improved accuracy
function calculateDangerScore(route, userLocation) {
    let dangerScore = 0;
    
    // Check each step of the route against danger zones
    for (let j = 0; j < route.legs[0].steps.length; j++) {
        const step = route.legs[0].steps[j];
        const stepPath = step.path;
        
        for (let k = 0; k < dangerZones.length; k++) {
            const dangerZone = dangerZones[k];
            
            // Weighted scoring - closer zones are more dangerous
            let zoneScore = 0;
            
            // Check each point in the step path
            for (let m = 0; m < stepPath.length; m++) {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    stepPath[m], 
                    dangerZone.getCenter()
                );
                
                // Calculate score based on proximity to danger zone
                if (distance < dangerZone.getRadius()) {
                    // Inside the danger zone - highest danger
                    zoneScore += 5;
                } else if (distance < dangerZone.getRadius() + 100) {
                    // Within 100m of danger zone - moderate danger
                    zoneScore += 3;
                } else if (distance < dangerZone.getRadius() + 200) {
                    // Within 200m of danger zone - slight danger
                    zoneScore += 1;
                }
            }
            
            // Apply the maximum score from this danger zone
            dangerScore += Math.min(5, zoneScore); // Cap score per zone
        }
    }
    
    return dangerScore;
}

// Toggle location sharing
function toggleShareLocation() {
    if (isSharingLocation) {
        // Stop sharing
        clearInterval(shareLocationInterval);
        shareLocationInterval = null;
        isSharingLocation = false;
        showToast("Location sharing stopped");
        document.getElementById('shareButton').innerHTML = '<i class="fas fa-share-alt"></i>';
        
        // Remove all shared location markers
        for (const id in sharedLocations) {
            sharedLocations[id].setMap(null);
        }
        sharedLocations = {};
    } else {
        // Start sharing
        if (!userMarker) {
            showToast("Please enable location services first");
            return;
        }
        
        showToast("Sharing your location with trusted contacts...");
        isSharingLocation = true;
        document.getElementById('shareButton').innerHTML = '<i class="fas fa-stop"></i>';
        
        // In a real app, this would send to a server and contacts would see updates
        // For demo, we'll simulate receiving shared locations
        shareLocationInterval = setInterval(() => {
            // Simulate receiving shared locations from others
            if (Math.random() > 0.7) {
                const offsetLat = (Math.random() - 0.5) * 0.002;
                const offsetLng = (Math.random() - 0.5) * 0.002;
                
                const sharedLocation = {
                    lat: userMarker.getPosition().lat() + offsetLat,
                    lng: userMarker.getPosition().lng() + offsetLng
                };
                
                const id = 'simulated-' + Date.now();
                
                if (!sharedLocations[id]) {
                    sharedLocations[id] = new google.maps.Marker({
                        position: sharedLocation,
                        map: map,
                        title: "Friend's Location",
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#FFA500",
                            fillOpacity: 0.8,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF",
                        },
                    });
                }
            }
        }, 5000);
    }
}

// Show emergency alert
function showEmergencyAlert(serviceType) {
    if (!userMarker) {
        showToast("Please enable location services first");
        return;
    }
    
    const userLocation = userMarker.getPosition();
    
    // Create pulsing effect around user location
    const alertCircle = new google.maps.Circle({
        map: map,
        center: userLocation,
        radius: 50,
        strokeColor: serviceType === "Police" ? "#0033cc" : "#cc0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: serviceType === "Police" ? "#0033cc" : "#cc0000",
        fillOpacity: 0.3,
    });
    
    // Animate the circle
    let radius = 50;
    const animationInterval = setInterval(() => {
        radius += 10;
        alertCircle.setRadius(radius);
        alertCircle.setOptions({
            fillOpacity: Math.max(0.05, 0.3 - radius/1000)
        });
        
        if (radius > 500) {
            clearInterval(animationInterval);
            setTimeout(() => {
                alertCircle.setMap(null);
            }, 1000);
        }
    }, 50);
    
    // Find the nearest service location
    const nearestService = findNearestService(serviceType, userLocation);
    
    if (nearestService) {
        showToast(`${serviceType} alert sent! Help is arriving from ${nearestService.distance.text} away.`, 5000);
        
        // Clear previous service markers
        clearServiceMarkers();
        
        // Show the service location
        const serviceMarker = new google.maps.Marker({
            position: nearestService.location,
            map: map,
            title: `${serviceType} Station`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: serviceType === "Police" ? "#0033cc" : "#cc0000",
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
            },
        });
        
        serviceMarkers.push(serviceMarker);
        
        // Draw a line to the service
        const serviceLine = new google.maps.Polyline({
            path: [userLocation, nearestService.location],
            geodesic: true,
            strokeColor: serviceType === "Police" ? "#0033cc" : "#cc0000",
            strokeOpacity: 0.5,
            strokeWeight: 3,
            map: map
        });
        
        serviceMarkers.push(serviceLine);
        
        // Remove after some time
        setTimeout(() => {
            clearServiceMarkers();
        }, 10000);
    } else {
        showToast(`${serviceType} alert sent! Help is on the way.`, 5000);
    }
}

// Clear all service markers and lines
function clearServiceMarkers() {
    for (let i = 0; i < serviceMarkers.length; i++) {
        serviceMarkers[i].setMap(null);
    }
    serviceMarkers = [];
}

// Find nearest emergency service (simulated)
function findNearestService(serviceType, userLocation) {
    // In a real app, this would use Places API to find actual services
    // For demo, we'll simulate some nearby locations
    
    const services = [];
    
    // Generate 3-5 random service locations
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 500 + Math.random() * 2000; // 0.5-2.5km
        
        const dx = distance * Math.cos(angle) / 111320; // approx meters to degrees
        const dy = distance * Math.sin(angle) / (111320 * Math.cos(userLocation.lat() * Math.PI / 180));
        
        services.push({
            location: new google.maps.LatLng(
                userMarker.getPosition().lat() + dx,
                userMarker.getPosition().lng() + dy
            ),
            name: `${serviceType} Station ${i+1}`
        });
    }
    
    // Calculate distances and find nearest
    let nearest = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < services.length; i++) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            userLocation,
            services[i].location
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearest = services[i];
        }
    }
    
    if (nearest) {
        return {
            location: nearest.location,
            name: nearest.name,
            distance: {
                value: minDistance,
                text: Math.round(minDistance / 100) / 10 + ' km'
            }
        };
    }
    
    return null;
}