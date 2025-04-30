document.getElementById("traffic-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const destination = document.getElementById("destination").value.trim();
  const timeInput = document.getElementById("time").value.trim();
  const weather = document.getElementById("weather").value.toLowerCase();
  const time = parseInt(timeInput.split(":")[0], 10);

  // Congestion logic
  let congestion = "Low";
  if ((time >= 7 && time <= 9) || (time >= 17 && time <= 19)) {
    congestion = "High";
  } else if (time >= 12 && time <= 14) {
    congestion = "Medium";
  }
  if (["rain", "fog", "snow", "storm", "drizzle"].some(w => weather.includes(w))) {
    congestion = increaseCongestion(congestion);
  }

  const emoji = congestion === "High" ? "🚧" : congestion === "Medium" ? "🚗" : "✅";
  document.getElementById("result").innerText = `${emoji} ${congestion} Congestion Expected`;

  // Get current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const sourceCoords = [position.coords.latitude, position.coords.longitude];
      const destCoords = await getCoordinates(destination);
      if (destCoords) {
        drawRouteOnMap(sourceCoords, destCoords);
      }
    }, (error) => {
      alert("Unable to access location. Please enable GPS or location services.");
      console.error(error);
    });
  } else {
    alert("Geolocation not supported by your browser.");
  }
});

function increaseCongestion(level) {
  if (level === "Low") return "Medium";
  if (level === "Medium") return "High";
  return "High";
}

async function getCoordinates(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place + ', Karnataka, India')}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartRouteAI/1.0 (youremail@example.com)',
        'Referer': location.origin
      }
    });
    const data = await response.json();
    if (!data || data.length === 0) {
      alert(`Location not found: ${place}`);
      return null;
    }
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (err) {
    console.error("Error fetching coordinates:", err);
    return null;
  }
}

function drawRouteOnMap(sourceCoords, destCoords) {
  const mapDiv = document.getElementById("dynamic-map") || document.createElement("div");
  mapDiv.id = "dynamic-map";
  mapDiv.style.height = "400px";
  mapDiv.style.marginTop = "20px";

  if (!document.getElementById("dynamic-map")) {
    document.querySelector(".card").appendChild(mapDiv);
  }

  const map = L.map("dynamic-map").setView(sourceCoords, 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  L.marker(sourceCoords).addTo(map).bindPopup("You are here").openPopup();
  L.marker(destCoords).addTo(map).bindPopup("Destination");

  const routeLine = L.polyline([sourceCoords, destCoords], { color: "blue", weight: 5 }).addTo(map);
  map.fitBounds(routeLine.getBounds());
}
