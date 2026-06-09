// B38: Frontend socket layer.
// One io() instance is shared across the app; useSocket() hook gives
// components a way to attach event listeners that auto-cleanup.
//
// The socket re-authenticates with the latest access token on every
// connect, so a token rotation (silent refresh on 401) is transparent.

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../utils/api";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_BASE?.replace(/\/api$/, "") ||
  process.env.REACT_APP_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:5001";

let socket = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    auth: (cb) => cb({ token: getAccessToken() }),
  });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) socket.disconnect();
}

export function emit(event, payload) {
  const s = getSocket();
  if (!s.connected) s.connect();
  return new Promise((resolve) => {
    s.emit(event, payload, (ack) => resolve(ack));
  });
}

// Hook: subscribes to a list of socket events; auto-unsubscribes on unmount.
//   useSocket({ "notification:new": handler, "session:revoked": handler2 })
export function useSocket(handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    if (!s.connected) s.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    const wrapped = {};
    for (const [event] of Object.entries(handlersRef.current)) {
      wrapped[event] = (...args) => {
        const h = handlersRef.current[event];
        if (h) h(...args);
      };
      s.on(event, wrapped[event]);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      for (const [event, fn] of Object.entries(wrapped)) {
        s.off(event, fn);
      }
    };
    // eslint-disable-next-line
  }, []);

  return { socket: getSocket(), connected };
}
