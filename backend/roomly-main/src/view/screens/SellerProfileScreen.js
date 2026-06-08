// src/view/screens/SellerProfileScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — public profile for a listing's owner.
// Shows their photo, name, and live grid of their other listings.
// Reached from DetailsScreen's owner card.
// ─────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSellerProfileViewModel } from "../../viewmodel/useSellerProfileViewModel";
import { useFavoritesViewModel } from "../../viewmodel/useFavoritesViewModel";
import ListingCard from "../components/ListingCard";

export default function SellerProfileScreen({ route }) {
  const navigation = useNavigation();
  const { ownerId, fallback } = route.params || {};
  const { profile, listings, loading } = useSellerProfileViewModel({
    ownerId,
    fallback,
  });
  const { isFavorite, toggleFavorite } = useFavoritesViewModel();

  async function handleCall() {
    if (!profile.phone) return;
    const url = `tel:${profile.phone.replace(/\s+/g, "")}`;
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
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.headerCard}>
            <View style={styles.avatarRing}>
              {profile.photoURL ? (
                <Image
                  source={{ uri: profile.photoURL }}
                  style={styles.avatar}
                  cachePolicy="memory-disk"
                  transition={150}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={40} color="#ffffff" />
                </View>
              )}
            </View>
            <Text style={styles.name}>{profile.displayName}</Text>
            <View style={styles.countPill}>
              <Ionicons name="home" size={12} color="#ffffff" />
              <Text style={styles.countPillText}>
                {loading
                  ? "Loading…"
                  : `${listings.length} listing${listings.length === 1 ? "" : "s"}`}
              </Text>
            </View>
            {profile.phone ? (
              <TouchableOpacity
                style={styles.callPill}
                onPress={handleCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={14} color="#ffffff" />
                <Text style={styles.callPillText}>{profile.phone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>
            Listings by {profile.displayName}
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2c3947" />
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="home-outline" size={42} color="#9aa5b1" />
            <Text style={styles.emptyText}>
              {profile.displayName} has no active listings yet.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={toggleFavorite}
          onPress={() => navigation.push("Details", { listing: item })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: "#e8edf2",
    paddingBottom: 24,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  headerCard: {
    backgroundColor: "#2c3947",
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 18,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#3a4a5c",
  },
  avatarFallback: {
    backgroundColor: "#3a4a5c",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 14,
    textAlign: "center",
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  countPillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  callPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  callPillText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2933",
  },

  centered: {
    paddingVertical: 60,
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7b8794",
    fontWeight: "600",
    textAlign: "center",
  },
});
