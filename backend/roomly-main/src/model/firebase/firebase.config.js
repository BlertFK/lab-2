// src/model/firebase/firebase.config.js
// ─────────────────────────────────────────────
// MODEL LAYER — Firebase initialisation only.
// Exports auth, db, storage.
// Only model/services files may import from here.
// ViewModels and Views must NEVER import this directly.
// ─────────────────────────────────────────────

import { Platform } from "react-native";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQKMWWlszlpwsoiSvS2pTVskFh1uFh7QI",
  authDomain: "roomly-8f0a8.firebaseapp.com",
  projectId: "roomly-8f0a8",
  storageBucket: "roomly-8f0a8.firebasestorage.app",
  messagingSenderId: "1090430376819",
  appId: "1:1090430376819:web:b8b14bb1b70d4be4af4306",
  measurementId: "G-604BMD2RXD"
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// React Native needs initializeAuth + AsyncStorage so sessions survive reloads.
// On web, the SDK already persists to localStorage via getAuth().
function makeAuth() {
  if (Platform.OS === "web") return getAuth(app);
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if already called on this app (e.g. fast refresh).
    return getAuth(app);
  }
}

export const auth    = makeAuth();
export const db      = getFirestore(app);
export const storage = getStorage(app);
