import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { supabase } from "../supabase";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showMessage } from "../screens/showMessage"; 
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 0;

export default function DeleteEventScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [userId, setUserId] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // Fetch logged-in user
  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) setUserId(user.id);
    } catch (err) {
      console.error("Error fetching user:", err);
      showMessage("Failed to fetch user info.");
    } finally {
      setUserLoaded(true);
    }
  };

  // Fetch events created by this user
 
const fetchEvents = async () => {
  if (!userId) return;
  setLoading(true);
  try {
    const { data: eventsData, error } = await supabase
      .from("events")
      .select("*")
      .eq("organizer_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const enrichedEvents = await Promise.all(
      eventsData.map(async (event) => {
        const { data: ticketsData, error: ticketsError } = await supabase
          .from("ticket_purchases")
          .select("quantity")
          .eq("event_id", event.id)
          .eq("status", "approved");

        if (ticketsError) throw ticketsError;

        const totalSold = ticketsData.reduce((acc, t) => acc + t.quantity, 0);

        return {
          ...event,
          tickets_sold: totalSold,
        };
      })
    );

    setEvents(enrichedEvents);
  } catch (err) {
    console.error("Error fetching events:", err);
    showMessage("Failed to fetch events.");
  } finally {
    setLoading(false);
  }
};


  // Delete event function (web + mobile)
  const handleDelete = async (eventId, title) => {
    if (!userId) {
     showMessage ("User not authenticated yet. Please wait a moment and try again.");
      return;
    }

    // Confirm deletion
    let confirmed = true;
    if (Platform.OS === "web") {
      confirmed = window.confirm(
        `Are you sure you want to delete "${title}"? This cannot be undone.`
      );
    } else {
      confirmed = await new Promise((resolve) => {
        import("react-native").then(({ Alert }) => {
          showMessage (
            "Confirm Delete",
            `Are you sure you want to delete "${title}"?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) },
            ]
          );
        });
      });
    }

    if (!confirmed) return;

    setDeletingId(eventId);
    try {
      console.log("Deleting eventId:", eventId, "userId:", userId);

      const { data, error } = await supabase
        .from("events")
        .delete()
        .select("*") // ensures deleted row info is returned
        .eq("id", String(eventId))
        .eq("organizer_id", userId);

      if (error) throw error;

      // Update UI immediately
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));
     showMessage(`"${title}" deleted successfully!`);

    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + (err.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (isFocused && userId) fetchEvents();
  }, [isFocused, userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
      </SafeAreaView>
    );
  }

  const handleFooterPress = (tabName, route) => {
    if (route) navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F0F2F5" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B2A3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Events</Text>
      </View>

      {/* Event List */}
      {events.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No events found.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.cover && <Image source={{ uri: item.cover }} style={styles.cover} />}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.info}>Date: {item.date}</Text>
              <Text style={styles.info}>
                Tickets Sold: {item.tickets_sold} / {item.total_tickets}
              </Text>
              <TouchableOpacity
                style={[styles.button, deletingId === item.id && { backgroundColor: "gray" }]}
                onPress={() => handleDelete(item.id, item.title)}
                disabled={deletingId === item.id || !userLoaded}
              >
                <Text style={styles.buttonText}>
                  {deletingId === item.id ? "Deleting..." : "Delete Event"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: (Platform.OS === "ios" ? 20 : 14) + insets.bottom }]}>
        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Add", "AddEvent")}>
          <MaterialIcons name="add-circle-outline" size={20} color="#1B2A3B" />
          <Text style={styles.footerText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="trash-outline" size={20} color="#1B2A3B" />
          <Text style={styles.footerText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Tickets", "ManageTickets")}>
          <FontAwesome5 name="ticket-alt" size={18} color="#1B2A3B" />
          <Text style={styles.footerText}>Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Stats", "AdminEventStatsScreen")}>
          <Ionicons name="stats-chart" size={20} color="#1B2A3B" />
          <Text style={styles.footerText}>Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0F2F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 8,
    position: "relative",
  },
  backButton: { marginRight: 16 },
  headerTitle: { color: "#1B2A3B", fontSize: 20, fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#1B2A3B", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cover: { width: "100%", height: 150, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  info: { fontSize: 14, marginBottom: 2, color: "#333" },
  button: {
    marginTop: 12,
    backgroundColor: "#556b85",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F0F2F5",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Platform.OS === "android" ? 14 : 10,
    elevation: 8,
  },
  footerButton: { alignItems: "center" },
  footerText: { color: "#1B2A3B", fontSize: 12, marginTop: 2 },
});
