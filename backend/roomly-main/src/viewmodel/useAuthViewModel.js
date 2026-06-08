// src/viewmodel/useAuthViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — owns all login / register / Google sign-in logic.
// Calls model/services. Exposes clean state to the View.
// No Firebase imports. No JSX. No UI rendering.
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  sendPasswordReset,
} from "../model/services/auth.service";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "../model/config/google-auth.config";

WebBrowser.maybeCompleteAuthSession();

// Opens the default mail app on the device. Tries Gmail first (its URL
// scheme is supported on iOS when Gmail is installed) and falls back to
// the system's default mail handler.
async function openMailApp() {
  const candidates = ["googlegmail://", "message://", "mailto:"];
  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    } catch (_) { /* try next */ }
  }
  Alert.alert("Couldn't open mail app", "Open your email manually and find the message from Roomly.");
}

function isPlaceholder(value) {
  return !value || value.startsWith("PASTE_");
}

function getMissingGoogleClientMessage() {
  if (Platform.OS === "android" && isPlaceholder(GOOGLE_ANDROID_CLIENT_ID)) {
    return "Add your Android OAuth client ID in src/model/config/google-auth.config.js.";
  }
  if (Platform.OS === "ios" && isPlaceholder(GOOGLE_IOS_CLIENT_ID)) {
    return "Add your iOS OAuth client ID in src/model/config/google-auth.config.js.";
  }
  if (Platform.OS === "web" && isPlaceholder(GOOGLE_WEB_CLIENT_ID)) {
    return "Add your Web OAuth client ID in src/model/config/google-auth.config.js.";
  }
  return null;
}

export function useAuthViewModel() {
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    selectAccount: true,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type !== "success") return;

    const idToken = response.params?.id_token || response.authentication?.idToken;
    if (!idToken) {
      Alert.alert("Google Error", "No ID token returned. Please try again.");
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loginWithGoogle(idToken);
      } catch (e) {
        setError(e.message);
        Alert.alert("Google Sign-In Error", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [response]);

  async function handleEmailAuth() {
    if (isRegister && (!firstName.trim() || !lastName.trim())) {
      Alert.alert("Missing fields", "Please enter your name and surname.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const displayName = `${firstName.trim()} ${lastName.trim()}`;
        await registerWithEmail(email.trim(), password, displayName);
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (e) {
      setError(e.message);
      const msg =
        e.code === "auth/user-not-found"      ? "No account found with this email." :
        e.code === "auth/wrong-password"       ? "Incorrect password." :
        e.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        e.message;
      Alert.alert("Auth Error", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password ──────────────────────────────────────────────────────
  // Sends a reset email. If `targetEmail` isn't passed, uses the field value.
  async function handleForgotPassword(targetEmail) {
    const addr = (targetEmail || email).trim();
    if (!addr) {
      Alert.alert("Email needed", "Type your email above first, then tap Forgot password.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(addr);
      Alert.alert(
        "Check your inbox",
        `We sent a password reset link to ${addr}. Follow the link to choose a new password.`,
        [
          { text: "OK", style: "cancel" },
          { text: "Open Mail", onPress: openMailApp },
        ]
      );
      return true;
    } catch (e) {
      setError(e.message);
      const msg =
        e.code === "auth/user-not-found"   ? "No account uses that email." :
        e.code === "auth/invalid-email"    ? "That email address isn't valid." :
        e.message;
      Alert.alert("Reset Error", msg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    const missingMessage = getMissingGoogleClientMessage();
    if (missingMessage) {
      Alert.alert("Google setup needed", missingMessage);
      return;
    }

    if (!request) {
      Alert.alert("Google Error", "Google sign-in is still loading. Try again in a moment.");
      return;
    }

    await promptAsync();
  }

  return {
    isRegister, setIsRegister,
    firstName,  setFirstName,
    lastName,   setLastName,
    email,      setEmail,
    password,   setPassword,
    loading,
    error,
    googleRequest:    request,
    promptGoogleAsync: handleGoogleAuth,
    handleEmailAuth,
    handleForgotPassword,
  };
}
