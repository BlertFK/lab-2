// src/view/components/ListingCard.js
// ─────────────────────────────────────────────
// VIEW LAYER — compact half-width card designed for a 2-column grid.
// Pure render. Receives props only. No logic, no Firebase.
// ─────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import ImageSlider from "./ImageSlider";

const SCREEN_WIDTH    = Dimensions.get("window").width;
const HORIZONTAL_PAD  = 16; // grid container left/right padding
const COLUMN_GAP      = 14; // gap between the two columns
export const CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PAD * 2 - COLUMN_GAP) / 2
);
const IMAGE_HEIGHT = 170;

function formatPrice(price) {
  if (price == null) return "Price TBD";
  return `$${Number(price).toLocaleString()}/mo`;
}

export default function ListingCard({
  listing,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}) {
  const location = listing.city
    ? `${listing.city}`
    : listing.address;
  const ownerName = listing.ownerName || "Roomly user";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <ImageSlider
          imageURLs={listing.imageURLs || []}
          height={IMAGE_HEIGHT}
          width={CARD_WIDTH}
          borderRadius={0}
          showCount={false}
        />
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => onToggleFavorite(listing)}
            activeOpacity={0.85}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={16}
              color={isFavorite ? "#dc3545" : "#ffffff"}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.location} numberOfLines={1}>{location}</Text>

        {listing.category && (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {listing.category}
            </Text>
          </View>
        )}

        <View style={styles.ownerRow}>
          {listing.ownerPhotoURL ? (
            <Image
              source={{ uri: listing.ownerPhotoURL }}
              style={styles.ownerAvatar}
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={[styles.ownerAvatar, styles.ownerAvatarFallback]}>
              <Ionicons name="person" size={10} color="#ffffff" />
            </View>
          )}
          <Text style={styles.ownerName} numberOfLines={1}>
            {ownerName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: { position: "relative" },
  favoriteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(31,41,51,0.62)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  info: { padding: 12 },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2933",
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: "#7b8794",
    marginBottom: 8,
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "#e8edf2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: "100%",
  },
  categoryText: {
    color: "#2c3947",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
    lineHeight: 14,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
    backgroundColor: "#e8edf2",
  },
  ownerAvatarFallback: {
    backgroundColor: "#2c3947",
    justifyContent: "center",
    alignItems: "center",
  },
  ownerName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#52606d",
  },
});
