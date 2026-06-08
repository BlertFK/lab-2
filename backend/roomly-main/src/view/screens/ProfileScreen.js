// src/view/screens/ProfileScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — Account screen. Edit username/email, manage own listings.
// Post-listing form lives in PostListingScreen (opened via the center "+" tab).
// ─────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useProfileViewModel } from "../../viewmodel/useProfileViewModel";
import ImageSlider from "../components/ImageSlider";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const {
    user,
    profileImage,
    pickProfileImage,
    displayName, setDisplayName, handleSaveDisplayName, savingName,
    email,       setEmail,       handleSaveEmail,       savingEmail,
    phone,       setPhone,       handleSavePhone,       savingPhone, savedPhone,
    emailVerified, handleResendVerification, verifyingEmail, verifyCooldown,
    handleCheckVerification, checkingVerified,
    myListings,
    handleDeleteListing,
    deletingListingId,
    handleLogout,
  } = useProfileViewModel();

  const nameDirty  = displayName.trim() !== (user?.displayName || "");
  const emailDirty = email.trim() !== (user?.email || "");
  const phoneDirty = phone.trim() !== (savedPhone || "");

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* ── Avatar ─────────────────────────────────────────── */}
      <TouchableOpacity onPress={pickProfileImage} style={styles.avatarWrap}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        )}
        <View style={styles.avatarEditDot}>
          <Ionicons name="camera" size={14} color="#ffffff" />
        </View>
      </TouchableOpacity>
      <Text style={styles.changePhoto}>Tap to change photo</Text>
      <Text style={styles.name}>{user?.displayName || "User"}</Text>
      <Text style={styles.emailDisplay}>{user?.email}</Text>

      {/* ── Email verification banner ──────────────────────── */}
      {!emailVerified && user?.email ? (
        <View style={styles.verifyBanner}>
          <View style={styles.verifyTopRow}>
            <Ionicons name="alert-circle" size={20} color="#92400e" />
            <View style={styles.verifyTextWrap}>
              <Text style={styles.verifyTitle}>Email not verified</Text>
              <Text style={styles.verifyBody}>
                Open the link we sent to your inbox, then tap "I've verified".
              </Text>
            </View>
          </View>

          <View style={styles.verifyActions}>
            <TouchableOpacity
              style={[
                styles.verifyPrimaryBtn,
                checkingVerified && styles.verifyBtnDisabled,
              ]}
              disabled={checkingVerified}
              onPress={handleCheckVerification}
              activeOpacity={0.85}
            >
              {checkingVerified ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.verifyPrimaryBtnText}>I've verified</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.verifyBtn,
                (verifyingEmail || verifyCooldown > 0) && styles.verifyBtnDisabled,
              ]}
              disabled={verifyingEmail || verifyCooldown > 0}
              onPress={handleResendVerification}
              activeOpacity={0.85}
            >
              {verifyingEmail ? (
                <ActivityIndicator color="#1f2933" size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>
                  {verifyCooldown > 0 ? `Wait ${verifyCooldown}s` : "Resend"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* ── Account details (editable) ─────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>

        <Text style={styles.fieldLabel}>Username</Text>
        <View style={styles.rowField}>
          <TextInput
            style={styles.input}
            placeholder="Your username"
            placeholderTextColor="#9aa5b1"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!nameDirty || savingName) && styles.saveBtnDisabled,
            ]}
            disabled={!nameDirty || savingName}
            onPress={handleSaveDisplayName}
            activeOpacity={0.85}
          >
            {savingName ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Email</Text>
        <View style={styles.rowField}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9aa5b1"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!emailDirty || savingEmail) && styles.saveBtnDisabled,
            ]}
            disabled={!emailDirty || savingEmail}
            onPress={handleSaveEmail}
            activeOpacity={0.85}
          >
            {savingEmail ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          Changing your email may ask you to log in again for security.
        </Text>

        <Text style={styles.fieldLabel}>Phone</Text>
        <View style={styles.rowField}>
          <TextInput
            style={styles.input}
            placeholder="+383 49 123 456"
            placeholderTextColor="#9aa5b1"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!phoneDirty || savingPhone) && styles.saveBtnDisabled,
            ]}
            disabled={!phoneDirty || savingPhone}
            onPress={handleSavePhone}
            activeOpacity={0.85}
          >
            {savingPhone ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          Shown on your listings so buyers can call you. Leave empty to hide it.
        </Text>
      </View>

      {/* ── My Listings ────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Listings</Text>
        {myListings.length === 0 ? (
          <View style={styles.emptyListingsBox}>
            <Ionicons name="home-outline" size={26} color="#9aa5b1" />
            <Text style={styles.emptyListingsText}>
              Your posted listings will show here. Tap the + button at the bottom to post one.
            </Text>
          </View>
        ) : (
          myListings.map((item) => (
            <View key={item.id} style={styles.myListingRow}>
              {deletingListingId === item.id && (
                <View style={styles.myListingDeletingOverlay}>
                  <ActivityIndicator color="#dc3545" />
                </View>
              )}

              <View style={styles.myListingThumbWrap}>
                <ImageSlider
                  imageURLs={item.imageURLs || []}
                  height={56}
                  width={56}
                  borderRadius={8}
                  showPlaceholder={true}
                />
              </View>

              <View style={styles.myListingInfo}>
                <Text style={styles.myListingTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.myListingPrice}>${item.price}/mo</Text>
                {item.imageURLs?.length > 0 && (
                  <Text style={styles.myListingPhotoCount}>
                    {item.imageURLs.length} photo{item.imageURLs.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>

              <View style={styles.myListingActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    navigation.navigate("EditListing", { editingListing: item })
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color="#2563eb" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    deletingListingId === item.id && styles.deleteBtnDisabled,
                  ]}
                  onPress={() => handleDeleteListing(item)}
                  disabled={deletingListingId === item.id}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc3545" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Logout ─────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#e8edf2",
    alignItems: "center",
    padding: 24,
  },
  avatarWrap: { marginTop: 16, position: "relative" },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarFallback: {
    backgroundColor: "#2c3947",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarIcon:  { fontSize: 42 },
  avatarEditDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e8edf2",
  },
  changePhoto: {
    marginTop: 8,
    marginBottom: 12,
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 13,
  },
  name:         { fontSize: 22, fontWeight: "700", color: "#1f2933", marginBottom: 4 },
  emailDisplay: { fontSize: 14, color: "#7b8794", marginBottom: 16 },

  verifyBanner: {
    width: "100%",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  verifyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  verifyTextWrap: { flex: 1 },
  verifyTitle:    { fontSize: 13, fontWeight: "700", color: "#92400e" },
  verifyBody:     { fontSize: 12, color: "#92400e", marginTop: 2 },
  verifyActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  verifyPrimaryBtn: {
    flex: 1,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#92400e",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyPrimaryBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  verifyBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fde68a",
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnText:     { fontSize: 13, fontWeight: "700", color: "#92400e" },
  verifyBtnDisabled: { opacity: 0.55 },

  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle:  { fontSize: 18, fontWeight: "700", color: "#1f2933", marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#52606d", marginBottom: 8 },

  rowField: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    color: "#1f2933",
  },
  saveBtn: {
    marginLeft: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 72,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: "#93b4f0" },
  saveBtnText:     { color: "#ffffff", fontWeight: "700", fontSize: 14 },
  helperText: {
    fontSize: 11,
    color: "#9aa5b1",
    marginTop: 4,
    marginBottom: 2,
  },

  // My listings
  emptyListingsBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyListingsText: {
    marginTop: 8,
    color: "#7b8794",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  myListingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    position: "relative",
  },
  myListingDeletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  myListingThumbWrap:  { marginRight: 12 },
  myListingInfo:       { flex: 1 },
  myListingTitle:      { fontSize: 14, fontWeight: "600", color: "#1f2933", marginBottom: 2 },
  myListingPrice:      { fontSize: 13, color: "#2c3947", fontWeight: "700", marginBottom: 1 },
  myListingPhotoCount: { fontSize: 11, color: "#9aa5b1" },
  myListingActions: {
    flexDirection: "column",
    gap: 6,
    marginLeft: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#eef5ff",
  },
  editBtnText: { fontSize: 12, color: "#2563eb", fontWeight: "700" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fff0f0",
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText:     { fontSize: 12, color: "#dc3545", fontWeight: "700" },

  logoutBtn: {
    marginTop: 4,
    backgroundColor: "#dc3545",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 40,
  },
  logoutText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});
