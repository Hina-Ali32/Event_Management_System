import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { supabase } from "../supabase";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

const BOTTOM_SAFE_SPACE = Platform.OS === "android" ? 20 : 0;

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;

  const [eventData, setEventData] = useState({
    ...event,
    totalTickets: parseInt(event.total_tickets ?? 0),
    ticketsSold: parseInt(event.tickets_sold ?? 0),
    ticketPrice: parseFloat(event.ticket_price ?? 0),
     organizerEmail: event.organizeremail, 
  });
// Event date check
const eventDate = new Date(eventData.date);
const today = new Date();
today.setHours(0,0,0,0); // ignore time

const isPastEvent = eventDate < today;

// Check if tickets can be bought (not sold out & event not passed)
const canBuyTickets = eventData.ticketsSold < eventData.totalTickets && !isPastEvent;

  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const loadEventTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", event.id)
        .single();

      if (error) throw error;

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("ticket_purchases")
        .select("quantity")
        .eq("event_id", event.id)
        .eq("status", "approved");

      if (ticketsError) throw ticketsError;

      const totalSold = ticketsData.reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      setEventData({
        ...data,
        totalTickets: parseInt(data.total_tickets ?? 0),
        ticketsSold: totalSold,
        ticketPrice: parseFloat(data.ticket_price ?? 0),
      });
    } catch (err) {
      console.log("Error loading event:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) loadEventTickets();

    const subscription = supabase
      .channel("realtime:event_tickets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_purchases",
          filter: `event_id=eq.${event.id}`,
        },
        async () => {
          try {
            const { data: ticketsData, error: ticketsError } = await supabase
              .from("ticket_purchases")
              .select("quantity")
              .eq("event_id", event.id)
              .eq("status", "approved");

            if (ticketsError) throw ticketsError;

            const totalSold = ticketsData.reduce(
              (acc, item) => acc + item.quantity,
              0
            );

            setEventData((prev) => ({ ...prev, ticketsSold: totalSold }));
          } catch (err) {
            console.log("Error updating tickets sold:", err);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [isFocused]);

  const handleBuyTicket = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Login Required", "Please login to buy tickets.");
        return;
      }

      navigation.navigate("BuyTicketScreen", {
        eventData,
        userId: user.id,
      });
    } catch (err) {
      console.log("Error getting user:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: BOTTOM_SAFE_SPACE }}
    >
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B2A3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
      </View>
      {eventData.cover && (
        <Image source={{ uri: eventData.cover }} style={styles.coverImage} />
      )}

      <View style={styles.card}>
        <Text style={styles.title}>{eventData.title}</Text>
        <Text style={styles.info}>Organizer: {eventData.organizer}</Text>
       {eventData.organizeremail && (
  <Text style={styles.info}>For any query, contact: {eventData.organizeremail}</Text>
)}


        <Text style={styles.info}>Date: {eventData.date}</Text>
        <Text style={styles.info}>Time: {eventData.time}</Text>
        <Text style={styles.info}>
          Price: ${eventData.ticketPrice.toFixed(2)}
        </Text>
        <Text style={styles.info}>
          Total Tickets: {eventData.totalTickets}
        </Text>
        <Text style={styles.info}>
          Tickets Sold: {eventData.ticketsSold}
        </Text>

        {/* ===== New Description Field ===== */}
        {eventData.description ? (
          <Text style={styles.description}>{eventData.description}</Text>
        ) : null}

       <TouchableOpacity
  style={[
    styles.button,
    !canBuyTickets && { backgroundColor: "gray" },
  ]}
  disabled={!canBuyTickets}
  onPress={handleBuyTicket}
>
  <Text style={styles.buttonText}>
    {!canBuyTickets
      ? isPastEvent
        ? "Event Passed"
        : "Sold Out"
      : "Buy Ticket"}
  </Text>
</TouchableOpacity>

      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5" },

   header: { height: 60, backgroundColor: "#F0F2F5", justifyContent: "center", alignItems: "center", elevation: 4 },

  
backButton: { position: "absolute", left: 16, top: 18 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1B2A3B" },
  
  loadingText: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    marginTop: 50,
  },

  coverImage: { width: "100%", height: 220 },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B2A3B",
    marginBottom: 10,
  },

  info: { color: "#556b85", fontSize: 16, marginBottom: 6 },

  description: {
    color: "#556b85",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#556b85",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },

  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});