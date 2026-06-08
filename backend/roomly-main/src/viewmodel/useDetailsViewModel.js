// src/viewmodel/useDetailsViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — owns formatting and actions for DetailsScreen.
// No Firebase imports. No JSX. No UI rendering.
// ─────────────────────────────────────────────

import { Alert, Linking } from "react-native";
import { GOOGLE_MAPS_API_KEY } from "../model/config/maps.config";

function buildStaticDetailsMapHtml(listing) {
  const hasApiKey =
    GOOGLE_MAPS_API_KEY &&
    GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";
  const hasCoordinates =
    typeof listing?.latitude === "number" &&
    typeof listing?.longitude === "number";

  if (!hasApiKey || !hasCoordinates) return null;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function initMap() {
            const position = { lat: ${listing.latitude}, lng: ${listing.longitude} };
            const map = new google.maps.Map(document.getElementById("map"), {
              center: position,
              zoom: 16,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              draggable: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
              gestureHandling: "none"
            });
            new google.maps.Marker({
              position,
              map,
              draggable: false
            });
          }
        </script>
        <script
          src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"
          async
          defer
        ></script>
      </body>
    </html>
  `;
}

export function useDetailsViewModel(listing) {
  const formattedPrice =
    listing?.price != null
      ? `$${Number(listing.price).toLocaleString()}/mo`
      : "Price TBD";

  const formattedLocation =
    listing?.city
      ? `${listing.address}, ${listing.city}`
      : listing?.address || "";

  const hasCoordinates =
    typeof listing?.latitude === "number" &&
    typeof listing?.longitude === "number";
  const mapQuery = hasCoordinates
    ? `${listing.latitude},${listing.longitude}`
    : formattedLocation;
  const encodedLocation = encodeURIComponent(mapQuery);
  const mapUrl = mapQuery
    ? `https://maps.google.com/maps?q=${encodedLocation}&z=15&output=embed`
    : null;
  const mapHtml = buildStaticDetailsMapHtml(listing) || (mapUrl
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
          <style>
            html, body, iframe {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
              border: 0;
            }
          </style>
        </head>
        <body>
          <iframe src="${mapUrl}" allowfullscreen loading="lazy"></iframe>
        </body>
      </html>
    `
    : null);
  const googleMapsUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
    : null;

  function handleContact() {
    Alert.alert(
      "Contact Owner",
      "Real-time messaging is coming in the next update!"
    );
  }

  async function handleOpenMap() {
    if (!googleMapsUrl) {
      Alert.alert("Location missing", "This listing does not have an address yet.");
      return;
    }
    await Linking.openURL(googleMapsUrl);
  }

  return {
    formattedPrice,
    formattedLocation,
    mapHtml,
    handleContact,
    handleOpenMap,
  };
}
