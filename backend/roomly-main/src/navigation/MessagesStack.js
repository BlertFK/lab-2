// src/navigation/MessagesStack.js
// Stack navigator: Inbox (Conversations) → Chat

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ConversationsScreen from "../view/screens/ConversationsScreen";
import ChatScreen          from "../view/screens/ChatScreen";

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: "#ffffff" },
        headerTintColor:  "#2c3947",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ title: "Messages" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Chat" }}
      />
    </Stack.Navigator>
  );
}
