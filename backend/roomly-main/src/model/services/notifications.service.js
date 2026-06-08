// src/model/services/notifications.service.js
// ─────────────────────────────────────────────
// MODEL LAYER — Expo Push notifications.
// Handles registering for permissions, fetching the device's Expo push
// token, and POSTing notification payloads to Expo's push API.
//
// Sender (the user composing a message) calls sendPushNotification with
// the recipient's expoPushToken (fetched from users/{recipientUid}.expoPushToken).
// Works on iOS + Android — push doesn't fire on web or in iOS simulator.
// ─────────────────────────────────────────────

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

// Foreground notifications: how to display them when app is open.
// (Without this, iOS swallows incoming notifications while the app is foregrounded.)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:    true,
    shouldPlaySound:    true,
    shouldSetBadge:     true,
    shouldShowBanner:   true,
    shouldShowList:     true,
  }),
});

// ── Permission + token registration ───────────────────────────────────────
// Returns the Expo push token string on success, or null when:
//   - running on web / iOS simulator (no push there)
//   - permission denied
//   - no EAS projectId in app config

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  // Android needs a notification channel set up.
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563eb",
      });
    } catch (e) {
      console.warn("[push] channel:", e?.message);
    }
  }

  // Ask for permission if not already granted.
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  // Need the EAS projectId so Expo knows which app this token is for.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("[push] missing EAS projectId in app.json");
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse?.data || null;
  } catch (e) {
    console.warn("[push] getExpoPushTokenAsync:", e?.message);
    return null;
  }
}

// ── Send one push via Expo's API ──────────────────────────────────────────
// Fire-and-forget: caller should NOT await this in a critical path. Push
// failure must never block the actual message send.

export async function sendPushNotification({ to, title, body, data }) {
  if (!to || typeof to !== "string" || !to.startsWith("ExponentPushToken")) {
    return;
  }
  try {
    await fetch(EXPO_PUSH_API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        title: title || "Roomly",
        body:  body  || "",
        sound: "default",
        data:  data  || {},
      }),
    });
  } catch (e) {
    console.warn("[push] send:", e?.message);
  }
}

// ── Notification tap listener ─────────────────────────────────────────────
// Returns the subscription so caller can remove() on unmount.

export function addNotificationResponseListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
