// src/viewmodel/useSellerProfileViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — owns SellerProfileScreen state.
// Uses only the listings collection: the seller's name & photo come from
// the listing snapshot the user just opened (passed in as `fallback`),
// and the seller's other listings come from subscribeToUserListings.
// ─────────────────────────────────────────────

import { useEffect, useState } from "react";
import { subscribeToUserListings } from "../model/services/listings.service";
import { subscribeToUserProfile } from "../model/services/users.service";

export function useSellerProfileViewModel({ ownerId, fallback = {} }) {
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sellerDoc, setSellerDoc] = useState(null);

  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToUserListings(
      ownerId,
      (data) => {
        setListings(data);
        setLoading(false);
      },
      (err) => {
        console.error("[SellerVM] listings:", err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [ownerId]);

  useEffect(() => {
    if (!ownerId) return;
    const unsubscribe = subscribeToUserProfile(
      ownerId,
      (doc) => setSellerDoc(doc),
      (err) => console.error("[SellerVM] profile:", err.message)
    );
    return () => unsubscribe();
  }, [ownerId]);

  // Prefer fresh info from the most recent listing (e.g. updated avatar/name)
  // before falling back to whatever was passed in from DetailsScreen.
  const fromListings = listings[0]
    ? {
        displayName: listings[0].ownerName,
        photoURL:    listings[0].ownerPhotoURL,
        phone:       listings[0].ownerPhone,
      }
    : {};

  const profile = {
    displayName: fromListings.displayName || fallback.displayName || "Roomly user",
    photoURL:    fromListings.photoURL    || fallback.photoURL    || null,
    phone:       sellerDoc?.phone || fromListings.phone || "",
  };

  return { profile, listings, loading };
}
