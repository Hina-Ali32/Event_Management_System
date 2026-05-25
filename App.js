import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/HomeScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AddEventScreen from "./screens/AddEventScreen";
import ManageTickets from "./screens/ManageTickets";
import DeleteEvents from "./screens/DeleteEvents";
import FavoriteScreen from "./screens/FavoriteScreen";
import MyProfileScreen from "./screens/MyProfileScreen";
import MyTicketScreen from "./screens/MyTicketScreen";
import AddEventDetails from "./screens/AddEventDetails";
import BuyTicketScreen from "./screens/BuyTicketScreen";

// 🔹 Import EventStats screen
import AdminEventStatsScreen from "./screens/AdminEventStatsScreen";

import { supabase } from "./supabase";
import { EventProvider } from "./screens/EventContext";

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    init();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1B2A3B" }}>
        <ActivityIndicator size="large" color="#E1D9CC" />
      </View>
    );
  }

  return (
    <EventProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            // PUBLIC STACK
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : (
            // AUTHENTICATED STACK
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="AddEvent" component={AddEventScreen} />
              <Stack.Screen name="ManageTickets" component={ManageTickets} />
              <Stack.Screen name="DeleteEvents" component={DeleteEvents} />
              <Stack.Screen name="Favorite" component={FavoriteScreen} />
              <Stack.Screen name="MyTicketScreen" component={MyTicketScreen} />
              <Stack.Screen name="MyProfile" component={MyProfileScreen} />
              <Stack.Screen name="AddEventDetails" component={AddEventDetails} />
              <Stack.Screen name="BuyTicketScreen" component={BuyTicketScreen} />
              {/* 🔹 Add EventStats screen */}
              <Stack.Screen name="AdminEventStatsScreen" component={AdminEventStatsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </EventProvider>
  );
}