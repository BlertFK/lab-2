// src/view/screens/AuthScreen.js
// ─────────────────────────────────────────────
// VIEW LAYER — pure render only.
// All auth logic lives in useAuthViewModel.
// No Firebase imports. No business logic. No async operations.
// ─────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuthViewModel } from "../../viewmodel/useAuthViewModel";

export default function AuthScreen() {
  const {
    isRegister, setIsRegister,
    firstName,  setFirstName,
    lastName,   setLastName,
    email,      setEmail,
    password,   setPassword,
    loading,
    googleRequest,
    promptGoogleAsync,
    handleEmailAuth,
    handleForgotPassword,
  } = useAuthViewModel();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          {isRegister ? "Create Account" : "Welcome Back"}
        </Text>
        <Text style={styles.subtitle}>
          {isRegister
            ? "Sign up to find your perfect place"
            : "Sign in to continue"}
        </Text>

        {isRegister && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#9aa5b1"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Surname"
              placeholderTextColor="#9aa5b1"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#9aa5b1"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9aa5b1"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" color="#2c3947" style={styles.loader} />
        ) : (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEmailAuth}>
              <Text style={styles.primaryBtnText}>
                {isRegister ? "Create Account" : "Login"}
              </Text>
            </TouchableOpacity>

            {!isRegister && (
              <TouchableOpacity
                onPress={() => handleForgotPassword()}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.googleBtn}
              disabled={!googleRequest}
              onPress={() => promptGoogleAsync()}
            >
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => setIsRegister(!isRegister)}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            {isRegister ? "Already have an account?  " : "Don't have an account?  "}
            <Text style={styles.switchLink}>
              {isRegister ? "Login" : "Register"}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#e8edf2",
  },
  logo: {
    width: 160,
    height: 60,
    alignSelf: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2933",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#7b8794",
    textAlign: "center",
    marginBottom: 28,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 14,
    fontSize: 16,
    color: "#1f2933",
    borderWidth: 1,
    borderColor: "#d1d9e0",
  },
  loader: { marginVertical: 20 },
  primaryBtn: {
    backgroundColor: "#2c3947",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  primaryBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  googleBtn: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d9e0",
    marginBottom: 24,
  },
  googleBtnText: { color: "#1f2933", fontWeight: "600", fontSize: 15 },
  forgotRow: {
    alignItems: "center",
    marginTop: -4,
    marginBottom: 16,
  },
  forgotText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  switchRow:  { alignItems: "center" },
  switchText: { color: "#7b8794", fontSize: 14 },
  switchLink: { color: "#2563eb", fontWeight: "700" },
});
