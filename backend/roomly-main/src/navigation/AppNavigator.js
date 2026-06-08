// src/navigation/AppNavigator.js
// Reads AuthContext for auth state — no Firebase imports here.
// Tab bar layout: Home · Messages · ＋ (post) · Favorites · Profile
// 4 regular tabs + the raised "+" Post button in the middle.

import React from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Listener: when a tab with a nested stack is pressed, reset that stack to its
// first screen. Keeps tabs from "remembering" a Details/Chat screen on next
// tab switch.
const resetNestedStackOnPress = ({ navigation, route }) => ({
  tabPress: () => {
    const state = navigation.getState();
    const tab = state.routes.find((r) => r.name === route.name);
    if (tab?.state && tab.state.routes.length > 1) {
      navigation.dispatch({
        ...CommonActions.reset({
          index: 0,
          routes: [{ name: tab.state.routes[0].name }],
        }),
        target: tab.state.key,
      });
    }
  },
});

// Views
import AuthScreen        from "../view/screens/AuthScreen";
import PostListingScreen from "../view/screens/PostListingScreen";
import HomeStack         from "./HomeStack";
import FavoritesStack    from "./FavoritesStack";
import MessagesStack     from "./MessagesStack";
import ProfileStack      from "./ProfileStack";
import { useConversationsViewModel } from "../viewmodel/useConversationsViewModel";

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR   = "#2c3947";
const INACTIVE_COLOR = "#9aa5b1";

function TabIcon({ name, color, size }) {
  return <Ionicons name={name} size={size} color={color} />;
}

// Custom raised "+" button that lives in the middle of the bar.
function PlusTabButton({ onPress, accessibilityState }) {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      style={styles.plusWrap}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.plusButton,
          focused && styles.plusButtonActive,
        ]}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { totalUnread } = useConversationsViewModel();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3947" />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab:      focused ? "home"        : "home-outline",
            MessagesTab:  focused ? "chatbubbles" : "chatbubbles-outline",
            FavoritesTab: focused ? "heart"       : "heart-outline",
            ProfileTab:   focused ? "person"      : "person-outline",
          };
          if (route.name === "Post") return null;
          return (
            <TabIcon
              name={icons[route.name]}
              focused={focused}
              color={color}
              size={size}
            />
          );
        },
        tabBarActiveTintColor:   ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor:   "#ffffff",
          borderTopColor:    "#e4e7eb",
          height:            78,
          paddingBottom:     14,
          paddingTop:        10,
          paddingHorizontal: 14,
          overflow:          "visible",
        },
        tabBarItemStyle: {
          overflow:        "visible",
          paddingHorizontal: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle:      { backgroundColor: "#ffffff" },
        headerTitleStyle: { color: "#2c3947", fontWeight: "600" },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ headerShown: false, title: "Home" }}
        listeners={resetNestedStackOnPress}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStack}
        options={{
          headerShown: false,
          title: "Inbox",
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: "#dc3545", color: "#ffffff", fontSize: 10 },
        }}
        listeners={resetNestedStackOnPress}
      />
      <Tab.Screen
        name="Post"
        component={PostListingScreen}
        options={{
          title: "Post",
          tabBarLabel: () => null,
          tabBarButton: (props) => <PlusTabButton {...props} />,
          headerTitle: "Post a Listing",
        }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStack}
        options={{ headerShown: false, title: "Favorites" }}
        listeners={resetNestedStackOnPress}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ headerShown: false, title: "Profile" }}
        listeners={resetNestedStackOnPress}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  plusWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    top: -18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  plusButtonActive: {
    backgroundColor: "#1d4ed8",
  },
});
