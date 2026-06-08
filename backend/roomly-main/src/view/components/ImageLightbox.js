// src/view/components/ImageLightbox.js
// ─────────────────────────────────────────────
// VIEW LAYER — fullscreen modal that shows a swipeable image gallery
// with a close button. Used in DetailsScreen.
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
  Modal,
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ImageLightbox({
  visible,
  imageURLs = [],
  initialIndex = 0,
  onClose,
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Re-sync when reopened at a different index.
  React.useEffect(() => {
    if (visible) setActiveIndex(initialIndex);
  }, [visible, initialIndex]);

  function handleViewableItemsChanged({ viewableItems }) {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      if (typeof idx === "number") setActiveIndex(idx);
    }
  }

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 60 };
  const viewabilityCallbackPairs = React.useRef([
    { viewabilityConfig, onViewableItemsChanged: handleViewableItemsChanged },
  ]);

  const getItemLayout = (_, index) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.backdrop}>
        <FlatList
          data={imageURLs}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(initialIndex, Math.max(0, imageURLs.length - 1))}
          getItemLayout={getItemLayout}
          viewabilityConfigCallbackPairs={viewabilityCallbackPairs.current}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                source={{ uri: item }}
                style={styles.image}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={150}
              />
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.85}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="close" size={26} color="#ffffff" />
        </TouchableOpacity>

        {imageURLs.length > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {activeIndex + 1} / {imageURLs.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000000",
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  counter: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  counterText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
