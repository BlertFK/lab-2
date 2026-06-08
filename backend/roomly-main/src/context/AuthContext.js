// src/context/AuthContext.js
// Global auth state provider.
// Calls model/services — never Firebase directly.
// Any screen or ViewModel can call useAuth() to get the current user.

import React, { createContext, useContext, useEffect, useState } from "react";
import { subscribeToAuthState } from "../model/services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
