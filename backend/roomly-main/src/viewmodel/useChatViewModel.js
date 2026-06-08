// src/viewmodel/useChatViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — owns the chat screen for one conversation:
// live message list, composer, send, mark-as-read on focus.
// ─────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "../model/services/auth.service";
import {
  subscribeToMessages,
  sendMessage,
  markConversationRead,
} from "../model/services/messages.service";

export function useChatViewModel({ conversationId, otherUid }) {
  const user = getCurrentUser();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft]       = useState("");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);

  // Live messages
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    const unsubscribe = subscribeToMessages(
      conversationId,
      (data) => {
        setMessages(data);
        setLoading(false);
      },
      (err) => {
        console.error("[ChatVM] messages:", err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [conversationId]);

  // Reset unread on open + whenever a new message lands while screen is open.
  useEffect(() => {
    if (!conversationId || !user?.uid) return;
    markConversationRead(conversationId, user.uid).catch((e) =>
      console.error("[ChatVM] markRead:", e.message)
    );
  }, [conversationId, user?.uid, messages.length]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !conversationId || !user?.uid || !otherUid) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId,
        senderId:   user.uid,
        receiverId: otherUid,
        text,
      });
      setDraft("");
    } catch (e) {
      console.error("[ChatVM] send:", e.message);
    } finally {
      setSending(false);
    }
  }, [draft, conversationId, user?.uid, otherUid]);

  return {
    user,
    messages,
    loading,
    draft, setDraft,
    handleSend,
    sending,
  };
}
