// src/viewmodel/useFavoritesViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — owns favorite listings and toggle behavior.
// ─────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { getCurrentUser } from "../model/services/auth.service";
import {
  addFavorite,
  removeFavorite,
  subscribeToFavorites,
} from "../model/services/favorites.service";

export function useFavoritesViewModel() {
  const user = getCurrentUser();
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setFavoriteListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToFavorites(
      user.uid,
      (data) => {
        setFavoriteListings(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[FavoritesVM]", err.message);
        setError("Could not load favorites. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const favoriteIds = useMemo(
    () => new Set(favoriteListings.map((listing) => listing.listingId || listing.id)),
    [favoriteListings]
  );

  function isFavorite(listingId) {
    return favoriteIds.has(listingId);
  }

  async function toggleFavorite(listing) {
    if (!user) {
      Alert.alert("Login required", "Please log in to favorite listings.");
      return;
    }

    const listingId = listing.id || listing.listingId;
    try {
      if (favoriteIds.has(listingId)) {
        await removeFavorite(user.uid, listingId);
      } else {
        await addFavorite(user.uid, listing);
      }
    } catch (e) {
      console.error("[FavoritesVM] toggleFavorite:", e.message);
      Alert.alert("Error", "Could not update favorites. Please try again.");
    }
  }

  return {
    favoriteListings,
    favoriteIds,
    loading,
    error,
    isFavorite,
    toggleFavorite,
  };
}
