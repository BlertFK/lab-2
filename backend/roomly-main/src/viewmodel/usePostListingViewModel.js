// src/viewmodel/usePostListingViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — owns the "post a listing" flow.
// Extracted from useProfileViewModel so a dedicated PostListingScreen
// can use it from the center "+" tab button.
// ─────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getCurrentUser } from "../model/services/auth.service";
import {
  createListing,
  updateListingWithImages,
} from "../model/services/listings.service";
import { getUserProfile } from "../model/services/users.service";
import { GOOGLE_MAPS_API_KEY } from "../model/config/maps.config";

// Cloud images are persisted Firebase Storage URLs (https://...).
// Local images are device URIs picked via ImagePicker (file://..., content://..., etc.)
function isExistingURL(uri) {
  return typeof uri === "string" && /^https?:\/\//i.test(uri);
}

const MAX_IMAGES = 10;
const DEFAULT_MAP_CENTER = { latitude: 44.7866, longitude: 20.4489 };

function buildLocationPickerHtml(selectedLocation, address) {
  const hasApiKey =
    GOOGLE_MAPS_API_KEY &&
    GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";
  const center = selectedLocation || DEFAULT_MAP_CENTER;
  const initialAddress = (address || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  if (!hasApiKey) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
          <style>
            html, body {
              height: 100%;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f1f5f9;
              color: #52606d;
            }
            .message {
              height: 100%;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 18px;
              text-align: center;
              font-size: 14px;
              line-height: 20px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="message">
            Add your Google Maps API key in src/model/config/maps.config.js to enable address suggestions and pin selection.
          </div>
        </body>
      </html>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
        <style>
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          #map { width: 100%; height: 100%; }
          #search {
            position: absolute;
            top: 12px;
            left: 12px;
            right: 12px;
            z-index: 5;
            height: 42px;
            box-sizing: border-box;
            border: 0;
            border-radius: 10px;
            padding: 0 14px;
            font-size: 15px;
            color: #1f2933;
            background: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
            outline: none;
          }
          .pac-container { z-index: 9999; }
        </style>
      </head>
      <body>
        <input id="search" type="text" placeholder="Search real street address" value="${initialAddress}" />
        <div id="map"></div>
        <script>
          let map;
          let marker = null;
          let geocoder = null;
          const initialLocation = ${selectedLocation ? JSON.stringify(selectedLocation) : "null"};

          function getCity(components) {
            const cityTypes = ["locality", "postal_town", "administrative_area_level_2", "administrative_area_level_1"];
            for (const type of cityTypes) {
              const match = components.find((component) => component.types.includes(type));
              if (match) return match.long_name;
            }
            return "";
          }

          function sendLocation(payload) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }

          function setMarker(latitude, longitude, shouldCenter) {
            const position = { lat: latitude, lng: longitude };
            if (marker) {
              marker.setPosition(position);
            } else {
              marker = new google.maps.Marker({ position, map, draggable: false });
            }
            if (shouldCenter) map.panTo(position);
          }

          function initMap() {
            geocoder = new google.maps.Geocoder();
            const center = { lat: ${center.latitude}, lng: ${center.longitude} };
            map = new google.maps.Map(document.getElementById("map"), {
              center,
              zoom: initialLocation ? 16 : 13,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false
            });

            const input = document.getElementById("search");
            const autocomplete = new google.maps.places.Autocomplete(input, {
              fields: ["address_components", "formatted_address", "geometry", "name"],
              types: ["address"]
            });

            autocomplete.bindTo("bounds", map);
            autocomplete.addListener("place_changed", function() {
              const place = autocomplete.getPlace();
              if (!place.geometry || !place.geometry.location) return;

              const latitude = place.geometry.location.lat();
              const longitude = place.geometry.location.lng();
              const formattedAddress = place.formatted_address || input.value;
              const city = getCity(place.address_components || []);

              input.value = formattedAddress;
              setMarker(latitude, longitude, true);
              map.setZoom(16);
              sendLocation({ latitude, longitude, address: formattedAddress, city });
            });

            map.addListener("click", function(event) {
              const latitude = event.latLng.lat();
              const longitude = event.latLng.lng();
              setMarker(latitude, longitude, true);

              geocoder.geocode({ location: event.latLng }, function(results, status) {
                const bestResult = status === "OK" && results && results[0] ? results[0] : null;
                const formattedAddress = bestResult ? bestResult.formatted_address : input.value;
                const city = bestResult ? getCity(bestResult.address_components || []) : "";
                input.value = formattedAddress;
                sendLocation({ latitude, longitude, address: formattedAddress, city });
              });
            });

            if (initialLocation) {
              setMarker(initialLocation.latitude, initialLocation.longitude, false);
            }
          }
        </script>
        <script
          src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap"
          async
          defer
        ></script>
      </body>
    </html>
  `;
}

export function usePostListingViewModel({ onPosted, editingListing } = {}) {
  const user = getCurrentUser();
  const isEditing = Boolean(editingListing?.id || editingListing?.listingId);
  const editingListingId = editingListing?.id || editingListing?.listingId || null;

  const [title, setTitle]               = useState(editingListing?.title || "");
  const [address, setAddress]           = useState(editingListing?.address || "");
  const [city, setCity]                 = useState(editingListing?.city || "");
  const [price, setPrice]               = useState(
    editingListing?.price != null ? String(editingListing.price) : ""
  );
  const [category, setCategory]         = useState(editingListing?.category || "studio");
  const [description, setDescription]   = useState(editingListing?.description || "");
  const [listingLocation, setListingLocation] = useState(
    editingListing && editingListing.latitude != null && editingListing.longitude != null
      ? { latitude: editingListing.latitude, longitude: editingListing.longitude }
      : null
  );
  // For edit: starts with the listing's existing cloud URLs.
  // For new: empty. Newly picked local URIs are appended.
  const [listingImages, setListingImages] = useState(editingListing?.imageURLs || []);
  // Existing URLs the user explicitly removed during this edit session.
  // Used so we can delete them from Storage when saving.
  const [removedExistingURLs, setRemovedExistingURLs] = useState([]);
  const [submitting, setSubmitting]     = useState(false);
  const [phone, setPhone]               = useState(editingListing?.ownerPhone || "");
  const [profilePhone, setProfilePhone] = useState("");

  // Prefill phone with the seller's profile phone (they can override per
  // listing). In edit mode we DON'T overwrite — the listing's existing
  // ownerPhone is already set as the initial state above.
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    getUserProfile(user.uid)
      .then((p) => {
        if (!active) return;
        const next = p?.phone || "";
        setProfilePhone(next);
        if (!isEditing) {
          setPhone((cur) => (cur === "" ? next : cur));
        }
      })
      .catch((e) => console.error("[PostListingVM] profile:", e.message));
    return () => { active = false; };
  }, [user?.uid, isEditing]);

  async function requestGalleryPermission() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission needed", "Please allow gallery access in Settings.");
    }
    return granted;
  }

  async function pickListingImages() {
    if (!(await requestGalleryPermission())) return;

    const remaining = MAX_IMAGES - listingImages.length;
    if (remaining <= 0) {
      Alert.alert("Limit reached", `You can add up to ${MAX_IMAGES} photos per listing.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) return;
    const newUris = result.assets.map((a) => a.uri);
    setListingImages((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
  }

  function removeListingImage(index) {
    setListingImages((prev) => {
      const target = prev[index];
      // If we're removing a previously-saved cloud URL, remember it so we
      // can delete the underlying Storage object on save.
      if (isExistingURL(target)) {
        setRemovedExistingURLs((curr) =>
          curr.includes(target) ? curr : [...curr, target]
        );
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleListingLocationMessage(event) {
    try {
      const location = JSON.parse(event.nativeEvent.data);
      if (
        typeof location.latitude === "number" &&
        typeof location.longitude === "number"
      ) {
        if (location.address) setAddress(location.address);
        if (location.city) setCity(location.city);
        setListingLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    } catch (e) {
      console.error("[PostListingVM] map location:", e.message);
    }
  }

  function clearListingLocation() {
    setListingLocation(null);
    setAddress("");
    setCity("");
  }

  function resetForm() {
    setTitle(""); setAddress(""); setCity(""); setPrice("");
    setCategory("studio"); setDescription(""); setListingImages([]);
    setListingLocation(null);
    setPhone(profilePhone);
    setRemovedExistingURLs([]);
  }

  async function handlePostListing() {
    if (!title.trim() || !address.trim() || !price.trim() || !description.trim()) {
      Alert.alert("Missing fields", "Title, Address, Price and Description are required.");
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Invalid price", "Price must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        const keptURLs = listingImages.filter(isExistingURL);
        const newURIs  = listingImages.filter((u) => !isExistingURL(u));

        await updateListingWithImages(
          editingListingId,
          {
            title,
            description,
            price,
            address,
            city,
            category,
            ownerId: user.uid,
            ownerName: user.displayName || "Roomly user",
            ownerPhotoURL: user.photoURL || null,
            ownerPhone: phone.trim(),
            latitude: listingLocation?.latitude ?? null,
            longitude: listingLocation?.longitude ?? null,
          },
          { keptURLs, newURIs, removedURLs: removedExistingURLs }
        );

        // Don't reset the form on edit — the user may want to keep tweaking.
        setRemovedExistingURLs([]);
        Alert.alert("Saved", "Your listing has been updated.");
        if (typeof onPosted === "function") onPosted();
      } else {
        await createListing(
          {
            title,
            description,
            price,
            address,
            city,
            category,
            ownerId: user.uid,
            ownerName: user.displayName || "Roomly user",
            ownerPhotoURL: user.photoURL || null,
            ownerPhone: phone.trim(),
            latitude: listingLocation?.latitude ?? null,
            longitude: listingLocation?.longitude ?? null,
          },
          listingImages
        );

        resetForm();
        Alert.alert("Posted!", "Your listing is now live.");
        if (typeof onPosted === "function") onPosted();
      }
    } catch (e) {
      console.error("[PostListingVM] save:", e.message);
      Alert.alert("Error", isEditing
        ? "Could not save changes. Please try again."
        : "Could not post your listing. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    user,
    title,       setTitle,
    address,     setAddress,
    city,        setCity,
    price,       setPrice,
    category,    setCategory,
    description, setDescription,
    listingLocation,
    locationPickerHtml: buildLocationPickerHtml(listingLocation, address),
    handleListingLocationMessage,
    clearListingLocation,
    listingImages,
    pickListingImages,
    removeListingImage,
    maxImages: MAX_IMAGES,
    phone,        setPhone,
    profilePhone,
    handlePostListing,
    submitting,
    resetForm,
    isEditing,
    editingListingId,
  };
}
