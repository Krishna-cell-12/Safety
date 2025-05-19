async function getLocationData() {
    try {
        const response = await fetch('https://iplocate.io/api/lookup/17.253.0.0?apikey=00cc0170128212af4a1db51c5b4a7d51');
        const data = await response.json();
        console.log('Location Data:', data);

        // Find the location display element
        const locationElement = document.getElementById('userLocation');
        
        // If locationElement exists, update it
        if (locationElement && data.city && data.country) {
            locationElement.textContent = ` ${data.city}, ${data.country}`;
        } else if (locationElement) {
            locationElement.textContent = ` Location Unavailable`;
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        const locationElement = document.getElementById('userLocation');
        if (locationElement) {
            locationElement.textContent = ` Error fetching location`;
        }
    }
}

// Call location fetch when page loads
window.addEventListener('load', getLocationData);
