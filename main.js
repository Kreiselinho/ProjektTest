let austriaBounds = [[46.372276, 9.530952], [49.020608, 17.160776]]; // Bounding box for Austria
let mapCenter = [48.245556, 12.522778]; // Center the map on Mühldorf am Inn, damit Hohe Tauern zentral ist und Popup sichtbar ist
let initialZoom = 7;

// Liste der Nationalparks in Österreich
let nationalParks = [
    {
        name: "Nationalpark Hohe Tauern",
        lat: 47.121201,
        lng: 12.713109,
        image: "images/hohetauern.jpg",
        credit: "@WeAppU https://pixabay.com/de/photos/maltatal-malta-stausee-kraftwerk-578207/"
    },
    {
        name: "Nationalpark Neusiedler See - Seewinkel",
        lat: 47.773514,
        lng: 16.769231,
        image: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Neusiedler_See_-_Seewinkel.jpg",
        credit: "By Thomas Ledl - Own work, CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=20408732"
    },
    {
        name: "Nationalpark Gesäuse",
        lat: 47.569953,
        lng: 14.615875,
        image: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Ges%C3%A4use_Johnsbach_01.jpg",
        credit: "By Uoaei1 - Own work, CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=31282630"
    },
    {
        name: "Nationalpark Thayatal",
        lat: 48.859317,
        lng: 15.898437,
        image: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Thayatal_2008_PD_018.JPG",
        credit: "By Petr Dlouhý - Own work, CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=5261295"
    },
    {
        name: "Nationalpark Kalkalpen",
        lat: 47.805639,
        lng: 14.307364,
        image: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Kalkalpen_01.jpg",
        credit: "By Peter Gugerell - Own work, CC0, https://commons.wikimedia.org/w/index.php?curid=34192072"
    },
    {
        name: "Nationalpark Donau-Auen",
        lat: 48.155263,
        lng: 16.816245,
        image: "https://upload.wikimedia.org/wikipedia/commons/1/15/Donau_Auen_Nationalpark.jpg",
        credit: "By GuentherZ - Own work, CC BY-SA 4.0, https://commons.wikimedia.org/w/index.php?curid=47158696"
    }
];

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView(mapCenter, initialZoom);

// thematische Layer
let themaLayer = {
    forecast: L.featureGroup().addTo(map),
    wind: L.featureGroup().addTo(map),
    parks: L.featureGroup().addTo(map)
};

// Hintergrundlayer
let layerControl = L.control.layers({
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery").addTo(map)
}, {
    "Wettervorhersage MET Norway": themaLayer.forecast,
    "ECMWF Windvorhersage": themaLayer.wind,
    "Nationalparks": themaLayer.parks
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Leaflet Search Control
let searchControl = new L.Control.Search({
    layer: L.layerGroup(Object.values(themaLayer)),
    initial: false,
    zoom: 10,
    marker: false,
    textPlaceholder: "Suchen...",
    moveToLocation: function(latlng) {
        if (isInAustria(latlng)) {
            map.setView(latlng, initialZoom);
            showForecast(latlng.lat, latlng.lng);
        } else {
            alert("Bitte innerhalb Österreichs suchen.");
        }
    }
}).addTo(map);

// Wettervorhersage MET Norway
async function showForecast(lat, lon) {
    let url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    let response = await fetch(url);
    let jsondata = await response.json();

    // aktuelles Wetter und Wettervorhersage implementieren
    console.log(jsondata);
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng) {
            let details = feature.properties.timeseries[0].data.instant.details;
            let time = new Date(feature.properties.timeseries[0].time);
            let symbol = feature.properties.timeseries[0].data.next_1_hours.summary.symbol_code;
            let content = `
            <h4>Wettervorhersage für ${time.toLocaleString()}</h4>
            <ul>
                <li>Luftdruck Meereshöhe (hPa): ${details.air_pressure_at_sea_level}</li>
                <li>Lufttemperatur (°C): ${details.air_temperature} </li>
                <li>Bewölkungsgrad (%): ${details.cloud_area_fraction}</li>
                <li>Niederschlagsmenge (mm): ${details.precipitation_amount}</li>
                <li>Luftfeuchtigkeit(%): ${details.relative_humidity}</li>
                <li>Windrichtung (°): ${details.wind_from_direction}</li>
                <li>Windgeschwindigkeit (km/h): ${Math.round(details.wind_speed * 3.6)}</li>
            </ul>
            `;

            // Wettericons für die nächsten 24 Stunden in 3-Stunden Schritten
            for (let i = 0; i <= 24; i += 3) {
                if (i < feature.properties.timeseries.length) {
                    let forecastTime = new Date(feature.properties.timeseries[i].time);
                    let symbol = feature.properties.timeseries[i].data.next_1_hours.summary.symbol_code;
                    content += `<img src="icons/${symbol}.svg" alt="${symbol}" style="width:32px" title="${forecastTime.toLocaleString()}">`;
                }
            }

            // Link zum Datendownload
            content += `<p><a href="${url}" target="met.no">Daten downloaden</a></p>`;
            L.popup(latlng, {
                content: content
            }).openOn(themaLayer.forecast);
        }
    }).addTo(themaLayer.forecast);
}

// Karte auf Klick aktualisieren, nur wenn innerhalb der österreichischen Grenzen
map.on("click", function (evt) {
    if (isInAustria(evt.latlng)) {
        showForecast(evt.latlng.lat, evt.latlng.lng);
    } else {
        alert("Bitte innerhalb Österreichs klicken.");
    }
});

// Klick auf Innsbruck simulieren
map.fire("click", {
    latlng: mapCenter
});

// Überprüfen, ob der Punkt in Österreich liegt
function isInAustria(latlng) {
    return latlng.lat >= austriaBounds[0][0] && latlng.lat <= austriaBounds[1][0] &&
           latlng.lng >= austriaBounds[0][1] && latlng.lng <= austriaBounds[1][1];
}

// Windkarte
async function loadWind(url) {
    const response = await fetch(url);
    const jsondata = await response.json();
    console.log(jsondata);
    L.velocityLayer({
        data: jsondata,
        lineWidth: 2,
        displayOptions: {
            directionString: "Windrichtung",
            speedString: "Windgeschwindigkeit",
            speedUnit: "km/h",
            position: "bottomright",
            velocityType: "",
        }
    }).addTo(themaLayer.wind);

    // Vorhersagezeitpunkt ermitteln
    let forecastDate = new Date(jsondata[0].header.refTime);
    forecastDate.setHours(forecastDate.getHours() + jsondata[0].header.forecastTime);

    document.querySelector("#forecast-date").innerHTML = `
    (<a href="${url}" target="met.no">Stand ${forecastDate.toLocaleString()}</a>)
    `;
}

// Beispielhafte Winddaten laden
loadWind("https://geographie.uibk.ac.at/data/ecmwf/data/wind-10u-10v-europe.json");

// Nationalparks Marker hinzufügen
nationalParks.forEach(park => {
    let marker = L.marker([park.lat, park.lng]).addTo(themaLayer.parks);
    let popupContent = `
        <div class="popup-content">
            <h4>${park.name}</h4>
            <img src="${park.image}" alt="${park.name}" style="width:100%;"><br>
            <small>Bildnachweis: <a href="${park.credit.split(', ')[2]}" target="_blank">${park.credit}</a></small>
        </div>
    `;
    marker.bindPopup(popupContent);
});
