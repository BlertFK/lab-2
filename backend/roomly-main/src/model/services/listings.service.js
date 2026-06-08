// src/model/services/listings.service.js
// ─────────────────────────────────────────────
// MODEL LAYER — all Firestore + Firebase Storage operations for listings.
// Pure data functions. No JSX. No React. No UI.
// ViewModel calls these; View never touches Firebase.
// ─────────────────────────────────────────────

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import * as ImageManipulator from "expo-image-manipulator";
import { db, storage } from "../firebase/firebase.config";

// ── PRIVATE HELPER — resize + re-encode (WebP, JPEG fallback) ─────────────
// Returns { uri, format } where format ∈ "webp" | "jpeg".

async function compressForUpload(uri, { maxDim = 1024, quality = 0.6 } = {}) {
  const tryFormat = async (format) =>
    ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxDim } }],
      { compress: quality, format }
    );

  try {
    const out = await tryFormat(ImageManipulator.SaveFormat.WEBP);
    return { uri: out.uri, format: "webp" };
  } catch {
    try {
      const out = await tryFormat(ImageManipulator.SaveFormat.JPEG);
      return { uri: out.uri, format: "jpeg" };
    } catch {
      // Last resort — upload the original URI untouched.
      return { uri, format: "jpeg" };
    }
  }
}

// ── PRIVATE HELPER — upload one image, return download URL ────────────────

async function uploadImage(uri, storagePath) {
  const response = await fetch(uri);
  const blob     = await response.blob();
  const fileRef  = ref(storage, storagePath);

  await new Promise((resolve, reject) => {
    uploadBytesResumable(fileRef, blob).on("state_changed", null, reject, resolve);
  });

  return getDownloadURL(fileRef);
}

async function compressAndUpload(uri, storagePathNoExt, opts) {
  const { uri: compressedUri, format } = await compressForUpload(uri, opts);
  const ext  = format === "webp" ? "webp" : "jpg";
  return uploadImage(compressedUri, `${storagePathNoExt}.${ext}`);
}

function sortNewestFirst(listings) {
  return [...listings].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

// ── READ — all available listings, newest first (real-time) ───────────────

export function subscribeToListings(onData, onError) {
  const q = query(
    collection(db, "listings"),
    where("available", "==", true)
  );

  return onSnapshot(
    q,
    (snap) => onData(sortNewestFirst(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError
  );
}

// ── READ — listings owned by one user (real-time) ─────────────────────────

export function subscribeToUserListings(ownerId, onData, onError) {
  const q = query(
    collection(db, "listings"),
    where("ownerId", "==", ownerId)
  );

  return onSnapshot(
    q,
    (snap) => onData(sortNewestFirst(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError
  );
}

// ── CREATE ─────────────────────────────────────────────────────────────────
// imageUris is now an array of local URIs (up to 5).
// All images are uploaded in parallel before the Firestore document is written.

export async function createListing(fields, imageUris = []) {
  const {
    title,
    description,
    price,
    address,
    city,
    category,
    ownerId,
    ownerName,
    ownerPhotoURL,
    ownerPhone,
    latitude,
    longitude,
  } = fields;

  // Compress + upload all images in parallel
  const stamp = Date.now();
  const imageURLs = await Promise.all(
    imageUris.map((uri, index) =>
      compressAndUpload(uri, `listings/${ownerId}/${stamp}_${index}`)
    )
  );

  const docRef = await addDoc(collection(db, "listings"), {
    title,
    description,
    price:     Number(price),
    address,
    city:      city || "",
    category:  category || "other",
    ownerName: ownerName || "",
    ownerPhotoURL: ownerPhotoURL || null,
    ownerPhone: ownerPhone || "",
    latitude,
    longitude,
    imageURLs,           // array — may be empty, 1, or up to 5 URLs
    ownerId,
    available: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(docRef, { listingId: docRef.id });
  return docRef.id;
}

// ── UPDATE ─────────────────────────────────────────────────────────────────

export async function updateListing(listingId, fields) {
  await updateDoc(doc(db, "listings", listingId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

// ── UPDATE WITH IMAGES ─────────────────────────────────────────────────────
// Used by the edit flow. Caller passes:
//   - listingId
//   - fields:      same shape as createListing's `fields`
//   - keptURLs:    array of existing cloud URLs the user wants to keep
//   - newURIs:     array of newly-picked local URIs to upload
//   - removedURLs: array of existing cloud URLs the user removed
//                  (deleted from Storage)
//
// Final imageURLs on the doc = [...keptURLs, ...uploadedNewURLs].
// Order is preserved from how the caller passes them.

export async function updateListingWithImages(
  listingId,
  fields,
  { keptURLs = [], newURIs = [], removedURLs = [] } = {}
) {
  const { ownerId } = fields;

  // Delete removed images from Storage (best-effort).
  await Promise.allSettled(
    removedURLs.map(async (url) => {
      try { await deleteObject(ref(storage, url)); } catch { /* already gone */ }
    })
  );

  // Upload new images in parallel.
  const stamp = Date.now();
  const uploadedURLs = await Promise.all(
    newURIs.map((uri, index) =>
      compressAndUpload(uri, `listings/${ownerId}/${stamp}_${index}`)
    )
  );

  const imageURLs = [...keptURLs, ...uploadedURLs];

  await updateDoc(doc(db, "listings", listingId), {
    ...fields,
    price:     Number(fields.price),
    imageURLs,
    updatedAt: serverTimestamp(),
  });

  return imageURLs;
}

// ── DELETE ─────────────────────────────────────────────────────────────────

export async function deleteListing(listingId, imageURLs = []) {
  await Promise.allSettled(
    imageURLs.map(async (url) => {
      try { await deleteObject(ref(storage, url)); } catch { /* already gone */ }
    })
  );
  await deleteDoc(doc(db, "listings", listingId));
}

// ── UPLOAD — profile avatar ────────────────────────────────────────────────

export async function uploadAvatar(userId, uri) {
  return compressAndUpload(uri, `avatars/${userId}`, { maxDim: 512, quality: 0.8 });
}
