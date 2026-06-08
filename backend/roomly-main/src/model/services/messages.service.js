// src/model/services/messages.service.js
// ─────────────────────────────────────────────
// MODEL LAYER — Firestore "conversations" + "messages" subcollection.
//
// Schema:
//   conversations/{conversationId}
//     - participantIds:   [uidA, uidB]      (sorted ascending — id derives from this)
//     - participantInfo:  { [uid]: { displayName, photoURL } }
//     - lastMessage:      string
//     - lastMessageAt:    Timestamp
//     - lastSenderId:     string
//     - unread:           { [uid]: number } — receiver's count grows; sender stays 0
//     - createdAt:        Timestamp
//
//   conversations/{conversationId}/messages/{messageId}
//     - senderId:  string
//     - text:      string
//     - createdAt: Timestamp
// ─────────────────────────────────────────────

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/firebase.config";
import { sendPushNotification } from "./notifications.service";

// Build a deterministic conversation id from two uids so the same pair always
// resolves to the same doc — no need to query "is there already a chat between A and B?".
function buildConversationId(uidA, uidB) {
  return [uidA, uidB].sort().join("__");
}

// ── CREATE / GET — open a conversation between currentUser and otherUser ──
//
// Returns { id, conversation } — caller can immediately route into the chat.
// Safe to call repeatedly: it merges info each time so participantInfo stays fresh.

export async function openOrCreateConversation(currentUser, otherUser) {
  if (!currentUser?.uid || !otherUser?.uid) {
    throw new Error("openOrCreateConversation: both users required");
  }
  if (currentUser.uid === otherUser.uid) {
    throw new Error("You can't message yourself.");
  }

  const id = buildConversationId(currentUser.uid, otherUser.uid);
  const ref = doc(db, "conversations", id);
  const snap = await getDoc(ref);

  const participantInfo = {
    [currentUser.uid]: {
      displayName: currentUser.displayName || "Roomly user",
      photoURL:    currentUser.photoURL    || null,
    },
    [otherUser.uid]: {
      displayName: otherUser.displayName || "Roomly user",
      photoURL:    otherUser.photoURL    || null,
    },
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      participantIds: [currentUser.uid, otherUser.uid].sort(),
      participantInfo,
      lastMessage:    "",
      lastSenderId:   "",
      lastMessageAt:  serverTimestamp(),
      unread:         { [currentUser.uid]: 0, [otherUser.uid]: 0 },
      createdAt:      serverTimestamp(),
    });
  } else {
    // Keep participantInfo fresh in case names/photos changed.
    await setDoc(ref, { participantInfo }, { merge: true });
  }

  const fresh = await getDoc(ref);
  return { id, conversation: { id, ...fresh.data() } };
}

// ── SEND ─────────────────────────────────────────────────────────────────

export async function sendMessage({ conversationId, senderId, receiverId, text }) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  const convRef = doc(db, "conversations", conversationId);
  const msgsRef = collection(convRef, "messages");

  await addDoc(msgsRef, {
    senderId,
    text:      trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(convRef, {
    lastMessage:    trimmed,
    lastSenderId:   senderId,
    lastMessageAt:  serverTimestamp(),
    [`unread.${receiverId}`]: increment(1),
  });

  // Fire-and-forget push to the recipient. Read fresh conversation + recipient
  // user doc to get the sender's display name and the recipient's push token.
  // Any failure here must not bubble up — the message has already been saved.
  (async () => {
    try {
      const convSnap = await getDoc(convRef);
      const recipientSnap = await getDoc(doc(db, "users", receiverId));
      const expoPushToken = recipientSnap.exists()
        ? recipientSnap.data()?.expoPushToken
        : null;
      if (!expoPushToken) return;

      const senderInfo =
        convSnap.data()?.participantInfo?.[senderId] || {};
      const recipientInfo =
        convSnap.data()?.participantInfo?.[receiverId] || {};

      await sendPushNotification({
        to:    expoPushToken,
        title: senderInfo.displayName || "New message",
        body:  trimmed,
        data: {
          type:             "message",
          conversationId,
          otherUid:         senderId,
          otherDisplayName: senderInfo.displayName || "",
          otherPhotoURL:    senderInfo.photoURL || null,
        },
      });
    } catch (e) {
      console.warn("[sendMessage] push:", e?.message);
    }
  })();
}

// ── READ — live subscribe to all conversations for one user ───────────────

export function subscribeToConversations(uid, onData, onError) {
  if (!uid) return () => {};
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", uid)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      onData(list);
    },
    onError
  );
}

// ── READ — live subscribe to messages inside one conversation ─────────────

export function subscribeToMessages(conversationId, onData, onError) {
  if (!conversationId) return () => {};
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limit(500)
  );

  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

// ── WRITE — reset the unread count for the current user in this convo ─────

export async function markConversationRead(conversationId, uid) {
  if (!conversationId || !uid) return;
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unread.${uid}`]: 0,
  });
}
