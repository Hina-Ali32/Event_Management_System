import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { supabase } from "../supabase";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showMessage } from "../screens/showMessage"; 
export default function ManageTicketsScreen({ navigation }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("Tickets");
  const insets = useSafeAreaInsets();

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: eventsData, error: eError } = await supabase
        .from("events")
        .select("id,title")
        .eq("organizer_id", user.id);
      if (eError) throw eError;

      if (!eventsData || eventsData.length === 0) {
        setPurchases([]);
        return;
      }

      const eventIds = eventsData.map((e) => e.id);

      const { data: purchasesData, error: pError } = await supabase
        .from("ticket_purchases")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: true });
      if (pError) throw pError;

      const mergedPurchases = purchasesData.map((p) => ({
        ...p,
        event_name: eventsData.find((e) => e.id === p.event_id)?.title ?? "N/A",
      }));

      setPurchases(mergedPurchases);
    } catch (err) {
      console.log("Error fetching purchases:", err);
      showMessage("Error", "Failed to fetch purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const approvePurchase = async (purchase) => {
    setProcessingId(purchase.id);
    try {
      if (purchase.status === "approved") return;
      const { error } = await supabase
        .from("ticket_purchases")
        .update({ status: "approved" })
        .eq("id", purchase.id);
      if (error) throw error;

      showMessage("Purchase Approved", "Now you can generate tickets.");
      fetchPurchases();
    } catch (err) {
      console.log(err);
      showMessage("Error", "Failed to approve purchase.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectPurchase = async (purchase) => {
    setProcessingId(purchase.id);
    try {
      if (purchase.status === "rejected") return;
      const { error } = await supabase
        .from("ticket_purchases")
        .update({ status: "rejected" })
        .eq("id", purchase.id);
      if (error) throw error;

      showMessage("Rejected", "Purchase rejected successfully.");
      fetchPurchases();
    } catch (err) {
      console.log(err);
      showMessage("Error", "Failed to reject purchase.");
    } finally {
      setProcessingId(null);
    }
  };

  const generateTickets = async (purchase) => {
    setProcessingId(purchase.id);
    try {
      if (purchase.status !== "approved") {
        return showMessage("Error", "Purchase must be approved first.");
      }

      const tickets = Array.from({ length: purchase.quantity }, (_, i) => ({
        purchase_id: purchase.id,
        ticket_number: `${purchase.event_id}-${purchase.user_id}-${Date.now()}-${i + 1}`,
      }));

      const { error } = await supabase.from("tickets").insert(tickets);
      if (error) throw error;

      showMessage("Tickets Generated", "Tickets are now visible to the user.");
      fetchPurchases();
    } catch (err) {
      console.log(err);
      showMessage("Error", "Failed to generate tickets.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFooterPress = (tabName, route) => {
    setActiveTab(tabName);
    if (route) navigation.navigate(route);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#1B2A3B" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Manage Tickets</Text>
      </View>

      {purchases.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No purchases available for your events.</Text>
        </View>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.label}><Text style={styles.bold}>Event:</Text> {item.event_name}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Purchase ID:</Text> {item.id}</Text>
              <Text style={styles.label}><Text style={styles.bold}>User ID:</Text> {item.user_id}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Quantity:</Text> {item.quantity}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Total Price:</Text> ${item.total_price}</Text>
              <Text style={styles.label}><Text style={styles.bold}>Status:</Text> {item.status}</Text>

              {item.screenshot_url && <Image source={{ uri: item.screenshot_url }} style={styles.screenshot} />}

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#1B2A3B" }]}
                  onPress={() => approvePurchase(item)}
                  disabled={processingId === item.id}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#1B2A3B" }]}
                  onPress={() => rejectPurchase(item)}
                  disabled={processingId === item.id}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#1B2A3B" }]}
                  onPress={() => generateTickets(item)}
                  disabled={processingId === item.id || item.status !== "approved"}
                >
                  <Text style={styles.buttonText}>Generate Tickets</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: (Platform.OS === "ios" ? 20 : 14) + insets.bottom },
        ]}
      >
        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Add", "AddEvent")}>
          <MaterialIcons name="add-circle-outline" size={20} color={activeTab === "Add" ? "#1B2A3B" : "#556b85"} />
          <Text style={[styles.footerText, activeTab === "Add" && { color: "#1B2A3B" }]}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Delete", "DeleteEvents")}>
          <Ionicons name="trash-outline" size={20} color={activeTab === "Delete" ? "#1B2A3B" : "#556b85"} />
          <Text style={[styles.footerText, activeTab === "Delete" && { color: "#1B2A3B" }]}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton}>
          <FontAwesome5 name="ticket-alt" size={18} color={activeTab === "Tickets" ? "#1B2A3B" : "#556b85"} />
          <Text style={[styles.footerText, activeTab === "Tickets" && { color: "#1B2A3B" }]}>Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Stats", "AdminEventStatsScreen")}>
          <MaterialIcons name="bar-chart" size={20} color={activeTab === "Stats" ? "#1B2A3B" : "#556b85"} />
          <Text style={[styles.footerText, activeTab === "Stats" && { color: "#1B2A3B" }]}>Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0F2F5" },
  header: { padding: 15, backgroundColor: "#F0F2F5", alignItems: "center", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1B2A3B" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#556b85", fontSize: 16, textAlign: "center", marginTop: 50 },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginVertical: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 14, marginBottom: 6, color: "#333" },
  bold: { fontWeight: "bold" },
  screenshot: { width: "100%", height: 150, borderRadius: 10, marginVertical: 10 },
  buttonsContainer: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
  actionButton: { padding: 12, borderRadius: 8, margin: 5, flex: 1, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#F0F2F5", flexDirection: "row", justifyContent: "space-around", paddingVertical: Platform.OS === "android" ? 14 : 10, elevation: 8 },
  footerButton: { alignItems: "center" },
  footerText: { color: "#556b85", fontSize: 12, marginTop: 2 },
});