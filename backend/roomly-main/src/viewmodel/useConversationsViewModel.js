// src/viewmodel/useConversationsViewModel.js
// ─────────────────────────────────────────────
// VIEWMODEL LAYER — inbox: list of all conversations the user is part of.
// ─────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../model/services/auth.service";
import { subscribeToConversations } from "../model/services/messages.service";

export function useConversationsViewModel() {
  const user = getCurrentUser();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToConversations(
      user.uid,
      (data) => {
        setConversations(data);
        setLoading(false);
      },
      (err) => {
        console.error("[ConversationsVM]", err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // Decorate each convo with the *other* participant's display info and the
  // unread count for the current user — so the View doesn't have to know about
  // the participantInfo / unread maps.
  const decorated = useMemo(() => {
    if (!user?.uid) return [];
    return conversations.map((c) => {
      const otherUid = (c.participantIds || []).find((uid) => uid !== user.uid);
      const other    = otherUid ? (c.participantInfo?.[otherUid] || {}) : {};
      return {
        ...c,
        otherUid,
        otherDisplayName: other.displayName || "Roomly user",
        otherPhotoURL:    other.photoURL    || null,
        unreadCount:      c.unread?.[user.uid] || 0,
      };
    });
  }, [conversations, user?.uid]);

  const totalUnread = useMemo(
    () => decorated.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [decorated]
  );

  return {
    user,
    conversations: decorated,
    loading,
    totalUnread,
  };
}
