// MyTicketsScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { supabase } from "../supabase";
import { showMessage } from "../screens/showMessage"; 
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

const SafeText = ({ label, value }) => {
  if (value === null || value === undefined) return null;
  return (
    <Text style={styles.label}>
      <Text style={styles.labelBold}>{label}:</Text> {value}
    </Text>
  );
};

export default function MyTicketsScreen({ userId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: purchasesData, error } = await supabase
        .from("ticket_purchases")
        .select("*, tickets(*)")
        .eq("user_id", userId);

      if (error) throw error;

      if (!purchasesData || purchasesData.length === 0) {
        setTickets([]);
        return;
      }

      const eventIds = purchasesData.map((p) => p.event_id).filter(Boolean);
      const { data: eventsData } = await supabase
        .from("events")
        .select("id,title")
        .in("id", eventIds);

      const mergedTickets = purchasesData.map((p) => ({
        id: p.id,
        ticket_number: p.tickets?.ticket_number ?? null,
        created_at: p.tickets?.created_at ?? p.created_at,
        ticket_purchases: {
          ...p,
          event_name:
            eventsData.find((e) => e.id === p.event_id)?.title ?? "N/A",
        },
      }));

      setTickets(mergedTickets);
    } catch (err) {
      console.log(err);
     showMessage("Error", "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async (purchaseId) => {
    setProcessingId(purchaseId);
    try {
      const { error } = await supabase
        .from("ticket_purchases")
        .delete()
        .eq("id", purchaseId);
      if (error) throw error;
      setTickets((prev) => prev.filter((t) => t.id !== purchaseId));
      showMessage("Deleted", "Ticket deleted successfully.");
    } catch (err) {
      console.log(err);
      showMessage("Error", "Failed to delete ticket.");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
      </SafeAreaView>
    );
  }

  if (!tickets.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#F0F2F5" barStyle="light-content" />
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            🎫 You haven’t purchased any tickets yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F0F2F5" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <SafeText label="Ticket ID" value={item.id} />
            {item.ticket_number && (
              <SafeText label="Ticket Number" value={item.ticket_number} />
            )}
            <SafeText label="Created At" value={item.created_at} />
            <SafeText
              label="Event Name"
              value={item.ticket_purchases.event_name}
            />
            <SafeText label="Purchase ID" value={item.ticket_purchases.id} />
            <SafeText label="Event ID" value={item.ticket_purchases.event_id} />
            <SafeText
              label="Quantity"
              value={item.ticket_purchases.quantity}
            />
            <SafeText
              label="Total Price"
              value={item.ticket_purchases.total_price}
            />
            <SafeText label="Status" value={item.ticket_purchases.status} />

            <TouchableOpacity
              style={[
                styles.deleteButton,
                processingId === item.id && { backgroundColor: "gray" },
              ]}
              onPress={() => deleteTicket(item.id)}
              disabled={processingId === item.id}
            >
              <Text style={styles.buttonText}>Delete Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#1B2A3B", textAlign: "center" },

  header: {
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: 15,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1B2A3B" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: 14, marginBottom: 6, color: "#333" },
  labelBold: { fontWeight: "bold", color: "#000" },
  deleteButton: {
    backgroundColor: "#556b85",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
