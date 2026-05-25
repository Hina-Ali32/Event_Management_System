import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 0;

export default function AdminEventStatsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const [activeTab, setActiveTab] = useState("Stats");

  const fetchAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");
      setAdminId(user.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchEventStats = async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      // Get events organized by admin
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", adminId);
      if (eventsError) throw eventsError;

      // Fetch ticket purchases for each event
      const enrichedEvents = await Promise.all(
        eventsData.map(async (event) => {
          const { data: ticketsData, error: ticketsError } = await supabase
            .from("ticket_purchases")
            .select("*")
            .eq("event_id", event.id)
            .eq("status", "approved");
          if (ticketsError) throw ticketsError;

          const totalSold = ticketsData.reduce((acc, t) => acc + t.quantity, 0);
          const totalRevenue = ticketsData.reduce((acc, t) => acc + t.total_price, 0);

          return {
            ...event,
            totalSold,
            totalRevenue,
            totalPurchases: ticketsData.length,
          };
        })
      );

      setEvents(enrichedEvents);
    } catch (err) {
      console.log("Error fetching stats:", err);
      alert("Failed to fetch event stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (adminId) fetchEventStats();
  }, [adminId]);

  const handleFooterPress = (tab, route) => {
    setActiveTab(tab);
    if (route) navigation.navigate(route);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
      </SafeAreaView>
    );
  }

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#1B2A3B" barStyle="light-content" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1B2A3B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Stats</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.emptyText}>You have not organized any events yet.</Text>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: (Platform.OS === "ios" ? 20 : 14) + insets.bottom }]}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleFooterPress("Add", "AddEvent")}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={20}
              color={activeTab === "Add" ? "#fff" : "#1B2A3B"}
            />
            <Text style={styles.footerText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleFooterPress("Delete", "DeleteEvents")}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={activeTab === "Delete" ? "#fff" : "#1B2A3B"}
            />
            <Text style={styles.footerText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleFooterPress("Tickets", "ManageTickets")}
          >
            <FontAwesome5
              name="ticket-alt"
              size={18}
              color={activeTab === "Tickets" ? "#fff" : "#1B2A3B"}
            />
            <Text style={styles.footerText}>Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => handleFooterPress("Stats", "EventStats")}
          >
            <FontAwesome5
              name="chart-line"
              size={18}
              color={activeTab === "Stats" ? "#fff" : "#1B2A3B"}
            />
            <Text style={styles.footerText}>Stats</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F0F2F5" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B2A3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Stats</Text>
      </View>

      {/* Event Stats List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.info}>Date: {item.date}</Text>
            <Text style={styles.info}>Time: {item.time}</Text>
            <Text style={styles.info}>Total Tickets: {item.total_tickets}</Text>
            <Text style={styles.info}>Tickets Sold: {item.totalSold}</Text>
            <Text style={styles.info}>Total Revenue: ${item.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.info}>Purchases: {item.totalPurchases}</Text>
          </View>
        )}
      />

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: (Platform.OS === "ios" ? 20 : 14) + insets.bottom }]}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleFooterPress("Add", "AddEvent")}
        >
          <MaterialIcons
            name="add-circle-outline"
            size={20}
            color={activeTab === "Add" ? "#1B2A3B" : "#556b85"}
          />
          <Text style={styles.footerText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleFooterPress("Delete", "DeleteEvents")}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={activeTab === "Delete" ? "#1B2A3B" : "#556b85"}
          />
          <Text style={styles.footerText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleFooterPress("Tickets", "ManageTickets")}
        >
          <FontAwesome5
            name="ticket-alt"
            size={18}
            color={activeTab === "Tickets" ? "#1B2A3B" : "#556b85"}
          />
          <Text style={styles.footerText}>Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleFooterPress("Stats", "EventStats")}
        >
          <FontAwesome5
            name="chart-line"
            size={18}
            color={activeTab === "Stats" ? "#1B2A3B" : "#556b85"}
          />
          <Text style={styles.footerText}>Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  emptyText: { color: "#556b85", fontSize: 16, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 16,
  },
  title: { color: "#1B2A3B", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  info: { color: "#556b85", fontSize: 16, marginBottom: 4 },
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
  footerText: { color: "#556b85", fontSize: 12, marginTop: 2 },
});