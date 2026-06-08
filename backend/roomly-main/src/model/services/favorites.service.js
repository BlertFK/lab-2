// src/model/services/favorites.service.js
// ─────────────────────────────────────────────
// MODEL LAYER — Firestore operations for user favorites.
// Favorites are stored per user with a lightweight listing snapshot.
// ─────────────────────────────────────────────

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase.config";

function favoriteDocId(userId, listingId) {
  return `${userId}_${listingId}`;
}

function sortNewestFirst(favorites) {
  return [...favorites].sort((a, b) => {
    const aTime = a.favoritedAt?.toMillis?.() || 0;
    const bTime = b.favoritedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export function subscribeToFavorites(userId, onData, onError) {
  const q = query(
    collection(db, "favorites"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const favorites = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(sortNewestFirst(favorites));
    },
    onError
  );
}

export async function addFavorite(userId, listing) {
  const listingId = listing.id || listing.listingId;
  await setDoc(doc(db, "favorites", favoriteDocId(userId, listingId)), {
    userId,
    listingId,
    title: listing.title || "",
    description: listing.description || "",
    price: listing.price ?? null,
    address: listing.address || "",
    city: listing.city || "",
    category: listing.category || "other",
    imageURLs: listing.imageURLs || [],
    ownerId: listing.ownerId || "",
    ownerName: listing.ownerName || "",
    ownerPhotoURL: listing.ownerPhotoURL || null,
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    available: listing.available ?? true,
    createdAt: listing.createdAt || null,
    favoritedAt: serverTimestamp(),
  });
}

export async function removeFavorite(userId, listingId) {
  await deleteDoc(doc(db, "favorites", favoriteDocId(userId, listingId)));
}
