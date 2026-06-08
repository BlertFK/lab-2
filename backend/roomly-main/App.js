// App.js — entry point
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { usePushNotifications } from "./src/viewmodel/usePushNotifications";

// usePushNotifications uses useNavigation() and useAuth() — must be mounted
// inside both NavigationContainer and AuthProvider.
function AppShell() {
  usePushNotifications();
  return <AppNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppShell />
      </NavigationContainer>
    </AuthProvider>
  );
}
