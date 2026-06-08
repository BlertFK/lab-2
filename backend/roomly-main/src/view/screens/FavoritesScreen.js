// src/view/screens/FavoritesScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — renders the current user's favorite listings.
// ─────────────────────────────────────────────

import React from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ListingCard from "../components/ListingCard";
import { useFavoritesViewModel } from "../../viewmodel/useFavoritesViewModel";

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={54} color="#9aa5b1" />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the heart on listings you want to save.
      </Text>
    </View>
  );
}

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const {
    favoriteListings,
    loading,
    error,
    isFavorite,
    toggleFavorite,
  } = useFavoritesViewModel();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c3947" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteListings}
        keyExtractor={(item) => item.listingId || item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.header}>Favorites</Text>}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => {
          const listing = { ...item, id: item.listingId || item.id };
          return (
            <ListingCard
              listing={listing}
              isFavorite={isFavorite(listing.id)}
              onToggleFavorite={toggleFavorite}
              onPress={() => navigation.navigate("FavoriteDetails", { listing })}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8edf2",
  },
  list: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 18,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2933",
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8edf2",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: "#dc3545",
    textAlign: "center",
    marginTop: 8,
  },
  empty: {
    alignItems: "center",
    paddingTop: 90,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2933",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#7b8794",
    textAlign: "center",
  },
});
