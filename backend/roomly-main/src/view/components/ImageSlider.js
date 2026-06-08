// src/view/components/ImageSlider.js
// ─────────────────────────────────────────────
// VIEW LAYER — reusable image slider with dot indicators.
// Used in ListingCard (compact), DetailsScreen (full-width), and the
// fullscreen lightbox.
// Pure render. Receives props only. No logic, no Firebase.
// ─────────────────────────────────────────────

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ImageSlider({
  imageURLs = [],
  height = 220,
  width = SCREEN_WIDTH,
  borderRadius = 0,
  showPlaceholder = true,
  initialIndex = 0,
  onPressImage,
  contentFit = "cover",
  showCount = true,
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollRef = useRef(null);

  // Scroll to the requested initial position once layout is ready.
  useEffect(() => {
    if (
      initialIndex > 0 &&
      imageURLs.length > 1 &&
      scrollRef.current
    ) {
      // Defer slightly so the ScrollView has measured.
      const id = setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: initialIndex * width,
          animated: false,
        });
      }, 0);
      return () => clearTimeout(id);
    }
  }, [initialIndex, imageURLs.length, width]);

  // No images — show placeholder
  if (!imageURLs || imageURLs.length === 0) {
    if (!showPlaceholder) return null;
    return (
      <View style={[styles.placeholder, { height, width, borderRadius }]}>
        <Text style={styles.placeholderIcon}>🏠</Text>
      </View>
    );
  }

  // Single image — no slider needed
  if (imageURLs.length === 1) {
    const single = (
      <Image
        source={{ uri: imageURLs[0] }}
        style={{ width, height, borderRadius }}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        transition={150}
      />
    );
    if (!onPressImage) return single;
    return (
      <TouchableOpacity activeOpacity={0.95} onPress={() => onPressImage(0)}>
        {single}
      </TouchableOpacity>
    );
  }

  function handleScroll(event) {
    const offsetX  = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex !== activeIndex) setActiveIndex(newIndex);
  }

  function goToIndex(index) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  }

  return (
    <View style={{ width, height }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        directionalLockEnabled
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ width, height, borderRadius }}
      >
        {imageURLs.map((uri, index) => {
          const img = (
            <Image
              source={{ uri }}
              style={{ width, height, borderRadius }}
              contentFit={contentFit}
              cachePolicy="memory-disk"
              transition={150}
            />
          );
          if (!onPressImage) {
            return <View key={index} style={{ width, height }}>{img}</View>;
          }
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.95}
              onPress={() => onPressImage(index)}
              style={{ width, height }}
            >
              {img}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {showCount && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {activeIndex + 1} / {imageURLs.length}
          </Text>
        </View>
      )}

      <View style={styles.dotsRow}>
        {imageURLs.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToIndex(index)}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: { fontSize: 48 },

  countBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  dotsRow: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotActive:   { backgroundColor: "#ffffff" },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.45)" },
});
