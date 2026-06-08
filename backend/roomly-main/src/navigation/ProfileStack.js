// src/navigation/ProfileStack.js
// Stack navigator: Profile → EditListing
// EditListing reuses PostListingScreen — the screen flips into edit mode
// based on route.params.editingListing.

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen     from "../view/screens/ProfileScreen";
import PostListingScreen from "../view/screens/PostListingScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: "#ffffff" },
        headerTintColor:  "#2c3947",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="EditListing"
        component={PostListingScreen}
        options={{ title: "Edit Listing" }}
      />
    </Stack.Navigator>
  );
}
