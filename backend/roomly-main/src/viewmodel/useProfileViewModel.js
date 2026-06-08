// src/viewmodel/useProfileViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — account screen: avatar, profile edit (name/email),
// "my listings" feed, delete-listing, logout.
// Post-listing flow lives in usePostListingViewModel.
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Open the device's default mail app — tries Gmail first, then iOS Mail,
// then falls back to the generic mailto: handler.
async function openMailApp() {
  const candidates = ["googlegmail://", "message://", "mailto:"];
  for (const url of candidates) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) { await Linking.openURL(url); return; }
    } catch (_) { /* try next */ }
  }
  Alert.alert("Couldn't open mail app", "Open your email manually and find the message from Roomly.");
}
import {
  logOut,
  updateUserProfile,
  updateUserEmail,
  getCurrentUser,
  resendVerificationEmail,
  reloadCurrentUser,
} from "../model/services/auth.service";
import {
  deleteListing,
  subscribeToUserListings,
  uploadAvatar,
} from "../model/services/listings.service";
import {
  subscribeToUserProfile,
  saveUserPhone,
} from "../model/services/users.service";

export function useProfileViewModel() {
  const user = getCurrentUser();

  // Profile photo
  const [profileImage, setProfileImage] = useState(user?.photoURL || null);

  // Editable account fields
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail]             = useState(user?.email || "");
  const [phone, setPhone]             = useState("");
  const [savedPhone, setSavedPhone]   = useState("");
  const [savingName, setSavingName]   = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  // User's own listings (live)
  const [myListings, setMyListings] = useState([]);
  const [deletingListingId, setDeletingListingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserListings(
      user.uid,
      (data) => setMyListings(data),
      (err) => console.error("[ProfileVM]", err.message)
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // Live profile doc (phone, push token, etc.)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserProfile(
      user.uid,
      (profile) => {
        const next = profile?.phone || "";
        setSavedPhone(next);
        setPhone((cur) => (cur === "" ? next : cur));
      },
      (err) => console.error("[ProfileVM] profile:", err.message)
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // ── Permission ─────────────────────────────────────────────────────────────

  async function requestGalleryPermission() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission needed", "Please allow gallery access in Settings.");
    }
    return granted;
  }

  // ── Profile photo ──────────────────────────────────────────────────────────

  async function pickProfileImage() {
    if (!(await requestGalleryPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    try {
      const downloadURL = await uploadAvatar(user.uid, result.assets[0].uri);
      await updateUserProfile({ photoURL: downloadURL });
      setProfileImage(downloadURL);
      Alert.alert("Success", "Profile picture updated!");
    } catch (e) {
      Alert.alert("Upload Error", e.message);
    }
  }

  // ── Save display name ──────────────────────────────────────────────────────

  async function handleSaveDisplayName() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert("Empty name", "Username can't be empty.");
      return;
    }
    if (trimmed === user?.displayName) {
      Alert.alert("No changes", "That's already your username.");
      return;
    }
    setSavingName(true);
    try {
      await updateUserProfile({ displayName: trimmed });
      Alert.alert("Saved", "Username updated.");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingName(false);
    }
  }

  // ── Save email ─────────────────────────────────────────────────────────────

  async function handleSaveEmail() {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Empty email", "Email can't be empty.");
      return;
    }
    if (trimmed === user?.email) {
      Alert.alert("No changes", "That's already your email.");
      return;
    }
    setSavingEmail(true);
    try {
      await updateUserEmail(trimmed);
      Alert.alert("Saved", "Email updated.");
    } catch (e) {
      // Firebase often requires recent login to change email.
      Alert.alert(
        "Could not update email",
        e.code === "auth/requires-recent-login"
          ? "For security, please log out and log back in, then try again."
          : e.message
      );
    } finally {
      setSavingEmail(false);
    }
  }

  // ── Resend email verification ──────────────────────────────────────────────
  // Firebase rate-limits this to roughly one email per minute. We add a
  // local 60-second cooldown so the button blocks repeat taps before
  // Firebase rejects them — and translate auth/too-many-requests into
  // a message the user actually understands.

  const [verifyingEmail, setVerifyingEmail]   = useState(false);
  const [verifyCooldown, setVerifyCooldown]   = useState(0); // seconds remaining
  const [checkingVerified, setCheckingVerified] = useState(false);
  // Mirrors auth.currentUser.emailVerified locally so a reload() actually
  // re-renders this screen — Firebase mutates the same object reference,
  // so React wouldn't otherwise notice.
  const [verifiedNow, setVerifiedNow] = useState(Boolean(user?.emailVerified));

  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const t = setTimeout(() => setVerifyCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [verifyCooldown]);

  async function handleCheckVerification() {
    setCheckingVerified(true);
    try {
      const refreshed = await reloadCurrentUser();
      if (refreshed?.emailVerified) {
        setVerifiedNow(true);
        Alert.alert("Verified ✓", "Thanks — your email is confirmed.");
      } else {
        Alert.alert(
          "Not verified yet",
          "We haven't seen the verification yet. Open the link in the email we sent, then tap this button again."
        );
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setCheckingVerified(false);
    }
  }

  async function handleResendVerification() {
    if (verifyCooldown > 0) {
      Alert.alert(
        "Please wait",
        `You can request another verification email in ${verifyCooldown}s.`
      );
      return;
    }
    setVerifyingEmail(true);
    try {
      await resendVerificationEmail();
      setVerifyCooldown(60);
      Alert.alert(
        "Verification sent",
        `We sent a verification email to ${user?.email}. Check your inbox and follow the link.`,
        [
          { text: "OK", style: "cancel" },
          { text: "Open Mail", onPress: openMailApp },
        ]
      );
    } catch (e) {
      const friendly =
        e.code === "auth/too-many-requests"
          ? "Too many requests. Wait a few minutes and try again — Firebase limits how often verification emails can be sent."
          : e.code === "auth/network-request-failed"
            ? "Network error. Check your internet connection."
            : e.message;
      Alert.alert("Error", friendly);
      // Even on failure, prevent immediate retry so we don't spam.
      if (e.code === "auth/too-many-requests") setVerifyCooldown(60);
    } finally {
      setVerifyingEmail(false);
    }
  }

  // ── Save phone ─────────────────────────────────────────────────────────────

  async function handleSavePhone() {
    const trimmed = phone.trim();
    if (trimmed === savedPhone) {
      Alert.alert("No changes", "That's already your phone number.");
      return;
    }
    setSavingPhone(true);
    try {
      await saveUserPhone(user.uid, trimmed);
      Alert.alert("Saved", trimmed ? "Phone number updated." : "Phone number removed.");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingPhone(false);
    }
  }

  // ── Delete listing ─────────────────────────────────────────────────────────

  function handleDeleteListing(listing) {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${listing.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingListingId(listing.id);
            try {
              await deleteListing(listing.id, listing.imageURLs || []);
            } catch (e) {
              console.error("[ProfileVM] deleteListing:", e.message);
              Alert.alert("Error", "Could not delete listing. Please try again.");
            } finally {
              setDeletingListingId(null);
            }
          },
        },
      ]
    );
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try { await logOut(); } catch (e) { Alert.alert("Error", e.message); }
        },
      },
    ]);
  }

  return {
    user,
    profileImage,
    pickProfileImage,
    // Editable fields
    displayName, setDisplayName, handleSaveDisplayName, savingName,
    email,       setEmail,       handleSaveEmail,       savingEmail,
    phone,       setPhone,       handleSavePhone,       savingPhone, savedPhone,
    // Email verification
    emailVerified: verifiedNow,
    handleResendVerification, verifyingEmail, verifyCooldown,
    handleCheckVerification, checkingVerified,
    // My listings
    myListings,
    handleDeleteListing,
    deletingListingId,
    // Logout
    handleLogout,
  };
}
