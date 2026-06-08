// src/view/screens/ConversationsScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — inbox of all conversations for the current user.
// Tap a row → Chat screen.
// ─────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useConversationsViewModel } from "../../viewmodel/useConversationsViewModel";

function formatTime(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString();
}

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const { conversations, loading } = useConversationsViewModel();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3947" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="chatbubbles-outline" size={48} color="#9aa5b1" />
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyText}>
          Tap "Message Seller" on a listing to start a conversation.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("Chat", {
              conversationId:   item.id,
              otherUid:         item.otherUid,
              otherDisplayName: item.otherDisplayName,
              otherPhotoURL:    item.otherPhotoURL,
            })
          }
        >
          {item.otherPhotoURL ? (
            <Image source={{ uri: item.otherPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={22} color="#ffffff" />
            </View>
          )}

          <View style={styles.body}>
            <View style={styles.headerRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.otherDisplayName}
              </Text>
              <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text
                style={[
                  styles.preview,
                  item.unreadCount > 0 && styles.previewUnread,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage || "Conversation started"}
              </Text>
              {item.unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unreadCount}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#e8edf2" },
  empty: {
    flex: 1,
    backgroundColor: "#e8edf2",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: { marginTop: 10, fontSize: 17, fontWeight: "700", color: "#1f2933" },
  emptyText:  { marginTop: 6, fontSize: 13, color: "#7b8794", textAlign: "center", lineHeight: 19 },

  list: { backgroundColor: "#e8edf2", paddingVertical: 8 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: "#e8edf2",
  },
  avatarFallback: {
    backgroundColor: "#2c3947",
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1f2933" },
  time: { fontSize: 11, color: "#9aa5b1", fontWeight: "600", marginLeft: 8 },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  preview:       { flex: 1, fontSize: 13, color: "#7b8794" },
  previewUnread: { color: "#1f2933", fontWeight: "700" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563eb",
    paddingHorizontal: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
});
