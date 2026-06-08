// src/viewmodel/usePushNotifications.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — global push lifecycle.
//
// Mount this once at the top of the app (after AuthProvider).
// On sign-in:
//   1. Request push permission
//   2. Get the Expo push token for this device
//   3. Save it to users/{uid}.expoPushToken so other clients can target it
//
// Also wires up a "tap a notification" handler that routes to the right
// Chat screen when the user taps a message notification.
// ─────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  registerForPushNotificationsAsync,
  addNotificationResponseListener,
} from "../model/services/notifications.service";
import { saveUserPushToken } from "../model/services/users.service";

export function usePushNotifications() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const responseSubRef = useRef(null);

  // Register the device's push token to this user's profile on sign-in.
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (cancelled || !token) return;
        await saveUserPushToken(user.uid, token);
      } catch (e) {
        console.warn("[usePush] register:", e?.message);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.uid]);

  // Wire up notification tap → navigate to the right Chat.
  useEffect(() => {
    responseSubRef.current = addNotificationResponseListener((response) => {
      const data = response?.notification?.request?.content?.data || {};
      if (data?.type === "message" && data?.conversationId && data?.otherUid) {
        try {
          navigation.navigate("MessagesTab", {
            screen: "Chat",
            params: {
              conversationId:   data.conversationId,
              otherUid:         data.otherUid,
              otherDisplayName: data.otherDisplayName,
              otherPhotoURL:    data.otherPhotoURL,
            },
          });
        } catch (e) {
          console.warn("[usePush] navigate:", e?.message);
        }
      }
    });

    return () => {
      try { responseSubRef.current?.remove(); } catch { /* noop */ }
    };
  }, [navigation]);
}
