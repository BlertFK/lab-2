// src/viewmodel/useListingsViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — owns real-time Firestore subscription for listings.
// Calls model/services. Exposes clean state to the View.
// No Firebase imports. No JSX. No UI rendering.
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { subscribeToListings } from "../model/services/listings.service";

export function useListingsViewModel() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToListings(
      (data) => {
        setListings(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[ListingsVM]", err.message);
        setError("Could not load listings. Check your internet connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { listings, loading, error };
}
