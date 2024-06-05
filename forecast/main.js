/* Wind & Wetter Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 5);

// thematische Layer
let themaLayer = {
    forecast: L.featureGroup().addTo(map),
    wind: L.featureGroup().addTo(map)
}

// Hintergrundlayer
let layerControl = L.control.layers({
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery").addTo(map)
}, {
    "Wettervorhersage MET Norway": themaLayer.forecast,
    "ECMWF Windvorhersage": themaLayer.wind,
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Wettervorhersage MET Norway
async function showForecast(url) {
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
            //Wettericons für die nächsten 24 Stunden in 3-Stunden Schritten
            for (let i = 0; i <= 24; i += 3) {
                let symbol = feature.properties.timeseries[i].data.next_1_hours.summary.symbol_code;
                content += `<img src="icons/${symbol}.svg" alt="${symbol}" style ="width:32px" title="${time.toLocaleString()}">`
            }

            //Link zum Datendownload
            content += `
            <p><a href="${url}"target="met.no">Daten downloaden</a></p>
            `;
            L.popup(latlng, {
                content: content
            }).openOn(themaLayer.forecast);
        }
    }).addTo(themaLayer.forecast);
}
//showForecast("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.267222&lon=11.392778");
//auf Kartenklick reagieren und pop up öffnen
map.on("click", function (evt) {
    showForecast(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${evt.latlng.lat}&lon=${evt.latlng.lng}`);
});
// Klick auf Innsbruck simulieren
map.fire("click", {
    latlng: ibk
});

//Windkarte
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
            speedUnit: "k/h",
            position: "bottomright",
            velocityType: "",
        }
    }).addTo(themaLayer.wind);

    // Vorhersagezeitpunkt ermitteln
    let forecastDate = new Date(jsondata[0].header.refTime);
    forecastDate.setHours(forecastDate.getHours() + jsondata[0].header.forecastTime);

    document.querySelector("#forecast-date").innerHTML = `
    (<a href="${url}" target="met.no">Stand ${forecastDate.toLocaleString()}
    `;

        //document.querySelector("#map").innerHTML = "heute keine Karte";

       //document.querySelector("body").innerHTML = "das war's für heute";
}
loadWind("https://geographie.uibk.ac.at/data/ecmwf/data/wind-10u-10v-europe.json");