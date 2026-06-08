// src/view/screens/ChatScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — one open conversation: message bubbles + composer.
// ─────────────────────────────────────────────

import React, { useEffect, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useChatViewModel } from "../../viewmodel/useChatViewModel";

function formatBubbleTime(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen({ route }) {
  const navigation = useNavigation();
  const { conversationId, otherUid, otherDisplayName } = route.params || {};

  const {
    user,
    messages,
    loading,
    draft, setDraft,
    handleSend,
    sending,
  } = useChatViewModel({ conversationId, otherUid });

  useLayoutEffect(() => {
    navigation.setOptions({ title: otherDisplayName || "Chat" });
  }, [navigation, otherDisplayName]);

  const listRef = useRef(null);
  useEffect(() => {
    if (messages.length > 0) {
      // Auto-scroll to newest message.
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2c3947" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.uid;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                    {formatBubbleTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>
                Say hi to {otherDisplayName} 👋
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          placeholderTextColor="#9aa5b1"
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8edf2" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },

  list: { padding: 14, paddingBottom: 8, flexGrow: 1 },

  bubbleRow:  { flexDirection: "row", marginBottom: 8 },
  rowMine:    { justifyContent: "flex-end" },
  rowTheirs:  { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
  },
  bubbleText:     { fontSize: 15, color: "#1f2933", lineHeight: 20 },
  bubbleTextMine: { color: "#ffffff" },
  bubbleTime: {
    marginTop: 3,
    fontSize: 10,
    color: "#9aa5b1",
    alignSelf: "flex-end",
  },
  bubbleTimeMine: { color: "rgba(255,255,255,0.7)" },

  emptyChat:     { padding: 24, alignItems: "center" },
  emptyChatText: { color: "#7b8794", fontSize: 14, fontWeight: "600" },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e4e7eb",
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: "#f1f5f9",
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1f2933",
  },
  sendBtn: {
    marginLeft: 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#93b4f0" },
});
