// src/navigation/FavoritesStack.js
// Stack navigator: Favorites list → Listing detail

import React from "react";
import { Image, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FavoritesScreen      from "../view/screens/FavoritesScreen";
import DetailsScreen        from "../view/screens/DetailsScreen";
import SellerProfileScreen  from "../view/screens/SellerProfileScreen";
import ChatScreen           from "../view/screens/ChatScreen";

const Stack = createNativeStackNavigator();

const HeaderLogo = () => (
  <Image
    source={require("../../assets/logo.png")}
    style={styles.logo}
    resizeMode="contain"
  />
);

export default function FavoritesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#2c3947",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ headerTitle: () => <HeaderLogo /> }}
      />
      <Stack.Screen
        name="FavoriteDetails"
        component={DetailsScreen}
        options={{ title: "Listing Details" }}
      />
      <Stack.Screen
        name="SellerProfile"
        component={SellerProfileScreen}
        options={{ title: "Seller" }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ title: "Listing Details" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Chat" }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  logo: { width: 100, height: 32 },
});
