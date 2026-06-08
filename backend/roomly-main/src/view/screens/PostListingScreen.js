// src/view/screens/PostListingScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — dedicated screen for creating a new listing.
// Reached from the center "+" button in the tab bar.
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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { usePostListingViewModel } from "../../viewmodel/usePostListingViewModel";

const CATEGORIES   = ["studio", "room", "1br", "2br", "house", "other"];
const SCREEN_WIDTH = Dimensions.get("window").width;
const THUMB_SIZE   = (SCREEN_WIDTH - 48 - 8 * 2) / 3;
const MAP_WEBVIEW_BASE_URL = "https://roomly.local/";

export default function PostListingScreen({ route }) {
  const navigation = useNavigation();
  const editingListing = route?.params?.editingListing || null;

  const {
    title,       setTitle,
    address,
    city,
    price,       setPrice,
    category,    setCategory,
    description, setDescription,
    listingLocation,
    locationPickerHtml,
    handleListingLocationMessage,
    clearListingLocation,
    listingImages,
    pickListingImages,
    removeListingImage,
    maxImages,
    phone, setPhone, profilePhone,
    handlePostListing,
    submitting,
    isEditing,
  } = usePostListingViewModel({
    editingListing,
    onPosted: () => {
      if (editingListing) navigation.goBack();
      else navigation.navigate("ProfileTab", { screen: "Profile" });
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#e8edf2" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Listing" : "New Listing"}
          </Text>
          <Text style={styles.headerHint}>
            {isEditing
              ? "Update any field, add or remove photos, then save."
              : "Fill the basics — post in seconds."}
          </Text>
        </View>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Title *"
            placeholderTextColor="#9aa5b1"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.locationHeader}>
            <Text style={styles.fieldLabel}>Address *</Text>
            {listingLocation && (
              <TouchableOpacity
                style={styles.clearLocationBtn}
                onPress={clearListingLocation}
                activeOpacity={0.8}
              >
                <Text style={styles.clearLocationText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.locationPicker}>
            <WebView
              source={{ html: locationPickerHtml, baseUrl: MAP_WEBVIEW_BASE_URL }}
              originWhitelist={["*"]}
              style={styles.locationPickerMap}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handleListingLocationMessage}
            />
          </View>
          <View style={styles.locationStatusRow}>
            <Ionicons
              name={listingLocation ? "location" : "location-outline"}
              size={16}
              color={listingLocation ? "#2563eb" : "#7b8794"}
            />
            <Text
              style={[
                styles.locationStatusText,
                listingLocation && styles.locationStatusTextActive,
              ]}
            >
              {listingLocation
                ? "Pin selected from Google Maps"
                : "Type an address in the map search bar and choose a suggestion."}
            </Text>
          </View>
          {address ? (
            <View style={styles.selectedAddressBox}>
              <Text style={styles.selectedAddressLabel}>Selected address</Text>
              <Text style={styles.selectedAddressText}>{address}</Text>
              {!!city && <Text style={styles.selectedCityText}>{city}</Text>}
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Monthly price e.g. 850 *"
            placeholderTextColor="#9aa5b1"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsRow}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.pill, category === cat && styles.pillActive]}
              >
                <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description *"
            placeholderTextColor="#9aa5b1"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.fieldLabel}>Contact phone (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder={profilePhone || "+383 49 123 456"}
            placeholderTextColor="#9aa5b1"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCorrect={false}
          />

          <View style={styles.photoHeader}>
            <Text style={styles.fieldLabel}>
              Photos ({listingImages.length}/{maxImages})
            </Text>
            {listingImages.length < maxImages && (
              <TouchableOpacity onPress={pickListingImages} style={styles.addPhotoBtn}>
                <Text style={styles.addPhotoBtnText}>+ Add Photos</Text>
              </TouchableOpacity>
            )}
          </View>

          {listingImages.length > 0 && (
            <View style={styles.thumbGrid}>
              {listingImages.map((uri, index) => (
                <View key={index} style={styles.thumbWrap}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, { width: THUMB_SIZE, height: THUMB_SIZE }]}
                  />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeListingImage(index)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.mainLabel}>
                      <Text style={styles.mainLabelText}>Main</Text>
                    </View>
                  )}
                </View>
              ))}

              {listingImages.length < maxImages && (
                <TouchableOpacity
                  onPress={pickListingImages}
                  style={[styles.addSlot, { width: THUMB_SIZE, height: THUMB_SIZE }]}
                >
                  <Text style={styles.addSlotIcon}>+</Text>
                  <Text style={styles.addSlotText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {listingImages.length === 0 && (
            <TouchableOpacity
              style={styles.emptyPhotoArea}
              onPress={pickListingImages}
            >
              <Text style={styles.emptyPhotoIcon}>📷</Text>
              <Text style={styles.emptyPhotoText}>
                Tap to add up to {maxImages} photos
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.postBtn, submitting && styles.postBtnDisabled]}
            onPress={handlePostListing}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.postBtnText}>
                {isEditing ? "Save Changes" : "Post Listing"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#e8edf2",
    padding: 24,
  },
  headerRow:    { marginBottom: 16 },
  headerTitle:  { fontSize: 24, fontWeight: "800", color: "#1f2933" },
  headerHint:   { fontSize: 13, color: "#7b8794", marginTop: 4 },

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
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#52606d", marginBottom: 8 },
  input: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 15,
    color: "#1f2933",
  },
  textArea:   { height: 100, textAlignVertical: "top" },
  pillsRow:   { flexDirection: "row", marginBottom: 16 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#d1d9e0",
  },
  pillActive:     { backgroundColor: "#2c3947", borderColor: "#2c3947" },
  pillText:       { fontSize: 13, color: "#52606d", fontWeight: "600", textTransform: "capitalize" },
  pillTextActive: { color: "#ffffff" },

  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addPhotoBtn: {
    backgroundColor: "#e8edf2",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addPhotoBtnText: { fontSize: 13, fontWeight: "600", color: "#2c3947" },

  thumbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  thumbWrap: { position: "relative" },
  thumb: { borderRadius: 10 },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  removeBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  mainLabel: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mainLabelText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  addSlot: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#d1d9e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addSlotIcon: { fontSize: 22, color: "#9aa5b1" },
  addSlotText: { fontSize: 11, color: "#9aa5b1", marginTop: 2 },

  emptyPhotoArea: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#d1d9e0",
    borderStyle: "dashed",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyPhotoIcon: { fontSize: 28, marginBottom: 6 },
  emptyPhotoText: { fontSize: 13, color: "#9aa5b1", fontWeight: "500" },

  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  clearLocationBtn: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  clearLocationText: { color: "#52606d", fontSize: 12, fontWeight: "700" },
  locationPicker: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    marginBottom: 8,
  },
  locationPickerMap: { flex: 1 },
  locationStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  locationStatusText: {
    flex: 1,
    color: "#7b8794",
    fontSize: 12,
    fontWeight: "600",
  },
  locationStatusTextActive: { color: "#2563eb" },
  selectedAddressBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  selectedAddressLabel: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  selectedAddressText: {
    color: "#1f2933",
    fontSize: 13,
    fontWeight: "700",
  },
  selectedCityText: {
    color: "#52606d",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  postBtn:         { backgroundColor: "#2563eb", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 4 },
  postBtnDisabled: { backgroundColor: "#93b4f0" },
  postBtnText:     { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});
