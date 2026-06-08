// src/model/services/users.service.js
// ─────────────────────────────────────────────
// MODEL LAYER — Firestore "users" collection.
// Stores fields that Firebase Auth doesn't (phone, push token, etc.).
// ─────────────────────────────────────────────

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase.config";

// ── READ — get one user's profile doc (one-shot) ──────────────────────────

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── READ — live subscribe to one user's profile doc ───────────────────────

export function subscribeToUserProfile(uid, onData, onError) {
  if (!uid) return () => {};
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  );
}

// ── WRITE — create or merge fields into users/{uid} ───────────────────────

export async function upsertUserProfile(uid, fields) {
  if (!uid) throw new Error("upsertUserProfile: missing uid");
  await setDoc(
    doc(db, "users", uid),
    { ...fields, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ── WRITE — save phone number on profile ──────────────────────────────────

export async function saveUserPhone(uid, phone) {
  await upsertUserProfile(uid, { phone: (phone || "").trim() });
}

// ── WRITE — save Expo push token on profile (used later for notifications)

export async function saveUserPushToken(uid, expoPushToken) {
  await upsertUserProfile(uid, { expoPushToken: expoPushToken || null });
}
