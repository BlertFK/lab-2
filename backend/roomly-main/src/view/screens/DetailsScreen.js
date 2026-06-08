// src/view/screens/DetailsScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — renders full details for a selected listing.
// Formatting and actions come from useDetailsViewModel.
// No Firebase imports. No business logic.
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { useDetailsViewModel } from "../../viewmodel/useDetailsViewModel";
import { useFavoritesViewModel } from "../../viewmodel/useFavoritesViewModel";
import { openOrCreateConversation } from "../../model/services/messages.service";
import { getCurrentUser } from "../../model/services/auth.service";
import ImageSlider from "../components/ImageSlider";
import ImageLightbox from "../components/ImageLightbox";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAP_WEBVIEW_BASE_URL = "https://roomly.local/";

export default function DetailsScreen({ route }) {
  const navigation = useNavigation();
  const { listing } = route.params;
  const {
    formattedPrice,
    formattedLocation,
    mapHtml,
    handleOpenMap,
  } =
    useDetailsViewModel(listing);
  const { isFavorite, toggleFavorite } = useFavoritesViewModel();
  const listingId = listing.id || listing.listingId;
  const favorite = isFavorite(listingId);
  const ownerName = listing.ownerName || "Roomly user";

  function openSellerProfile() {
    navigation.push("SellerProfile", {
      ownerId: listing.ownerId,
      fallback: {
        displayName: listing.ownerName,
        photoURL: listing.ownerPhotoURL,
      },
    });
  }

  const imageURLs = listing.imageURLs || [];
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const lightboxVisible = lightboxIndex !== null;

  const ownerPhone = (listing.ownerPhone || "").trim();

  async function handleMessageSeller() {
    const current = getCurrentUser();
    if (!current) return;
    if (current.uid === listing.ownerId) {
      Alert.alert("That's you", "You can't message yourself.");
      return;
    }
    try {
      const { id } = await openOrCreateConversation(
        {
          uid: current.uid,
          displayName: current.displayName,
          photoURL: current.photoURL,
        },
        {
          uid: listing.ownerId,
          displayName: listing.ownerName,
          photoURL: listing.ownerPhotoURL,
        }
      );
      navigation.navigate("Chat", {
        conversationId:   id,
        otherUid:         listing.ownerId,
        otherDisplayName: listing.ownerName,
        otherPhotoURL:    listing.ownerPhotoURL,
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleCallSeller() {
    if (!ownerPhone) return;
    const url = `tel:${ownerPhone.replace(/\s+/g, "")}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Can't place call", "This device can't make phone calls.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Full-width image slider — tap any image to open the lightbox */}
      <ImageSlider
        imageURLs={imageURLs}
        height={300}
        width={SCREEN_WIDTH}
        borderRadius={0}
        showPlaceholder={true}
        onPressImage={imageURLs.length > 0 ? (i) => setLightboxIndex(i) : undefined}
      />

      <ImageLightbox
        visible={lightboxVisible}
        imageURLs={imageURLs}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />

      <View style={styles.content}>

        {/* ─ Summary card ───────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              {listing.category && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {listing.category.toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.title}>{listing.title}</Text>
            </View>
            <TouchableOpacity
              style={styles.favoriteBtn}
              onPress={() => toggleFavorite({ ...listing, id: listingId })}
              activeOpacity={0.85}
            >
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={22}
                color={favorite ? "#dc3545" : "#2c3947"}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.price}>{formattedPrice}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#7b8794" />
            <Text style={styles.location} numberOfLines={2}>
              {formattedLocation}
            </Text>
          </View>

          {imageURLs.length > 0 && (
            <View style={styles.photoCountRow}>
              <Ionicons name="images-outline" size={14} color="#9aa5b1" />
              <Text style={styles.photoCount}>
                {imageURLs.length} photo{imageURLs.length > 1 ? "s" : ""} · tap to view fullscreen
              </Text>
            </View>
          )}
        </View>

        {/* ─ Owner card ─────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.card, styles.ownerCard]}
          onPress={openSellerProfile}
          activeOpacity={0.85}
        >
          {listing.ownerPhotoURL ? (
            <Image
              source={{ uri: listing.ownerPhotoURL }}
              style={styles.ownerAvatar}
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={[styles.ownerAvatar, styles.ownerAvatarFallback]}>
              <Ionicons name="person" size={22} color="#ffffff" />
            </View>
          )}
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerLabel}>Posted by</Text>
            <Text style={styles.ownerName} numberOfLines={1}>
              {ownerName}
            </Text>
            <Text style={styles.ownerLink}>See their other listings →</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9aa5b1" />
        </TouchableOpacity>

        {/* ─ Description card ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* ─ Location card ──────────────────────────────── */}
        {mapHtml && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Where it is</Text>
            <View style={styles.mapCard}>
              <WebView
                source={{ html: mapHtml, baseUrl: MAP_WEBVIEW_BASE_URL }}
                style={styles.map}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.mapLoading}>
                    <Text style={styles.mapLoadingText}>Loading map...</Text>
                  </View>
                )}
              />
            </View>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={handleOpenMap}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={18} color="#2563eb" />
              <Text style={styles.mapBtnText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.messageBtn}
          onPress={handleMessageSeller}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" />
          <Text style={styles.messageBtnText}>Message Seller</Text>
        </TouchableOpacity>

        {ownerPhone ? (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallSeller}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={20} color="#ffffff" />
            <Text style={styles.callBtnText}>Call {ownerPhone}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.contactBtn}
          onPress={openSellerProfile}
          activeOpacity={0.85}
        >
          <Ionicons name="person-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.contactBtnText}>View Seller's Listings</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8edf2" },
  content:   { padding: 16, paddingTop: 18, gap: 16 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#2c3947",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2933",
    lineHeight: 28,
  },
  favoriteBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 14,
  },
  location: {
    flex: 1,
    fontSize: 14,
    color: "#52606d",
    fontWeight: "600",
    lineHeight: 20,
  },
  photoCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eef2f5",
  },
  photoCount: { fontSize: 12, color: "#9aa5b1", fontWeight: "600" },

  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  ownerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: "#e8edf2",
  },
  ownerAvatarFallback: {
    backgroundColor: "#2c3947",
    justifyContent: "center",
    alignItems: "center",
  },
  ownerInfo: { flex: 1 },
  ownerLabel: {
    fontSize: 10,
    color: "#7b8794",
    fontWeight: "700",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ownerName: {
    fontSize: 16,
    color: "#1f2933",
    fontWeight: "700",
  },
  ownerLink: {
    marginTop: 4,
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2933",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#52606d",
    lineHeight: 24,
  },

  mapCard: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    marginBottom: 14,
  },
  map: { flex: 1 },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  mapLoadingText: {
    color: "#7b8794",
    fontSize: 13,
    fontWeight: "600",
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 12,
  },
  mapBtnText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },

  messageBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  messageBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  callBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  callBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  contactBtn: {
    backgroundColor: "#2c3947",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 32,
  },
  contactBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});
