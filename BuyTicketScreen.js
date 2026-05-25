import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabase";
import { showMessage } from "../screens/showMessage"; 
import { Ionicons } from "@expo/vector-icons";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

export default function BuyTicketScreen({ route }) {
  const navigation = useNavigation();
  const { eventData, userId } = route.params;

  const [quantity, setQuantity] = useState("1");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchase, setPurchase] = useState(null);
  const [tickets, setTickets] = useState([]);

  const ticketsLeft =
    eventData.totalTickets - (eventData.ticketsSold || 0);
  const totalPrice =
    quantity ? parseInt(quantity) * eventData.ticketPrice : 0;

  const pickScreenshot = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setScreenshot(result.assets[0].base64);
      }
    } catch (err) {
      showMessage ("Error", "Failed to pick image");
    }
  };

  const handleSubmit = async () => {
    if (!quantity || parseInt(quantity) <= 0)
      return showMessage ("Invalid quantity");

    if (parseInt(quantity) > ticketsLeft)
      return showMessage (`Only ${ticketsLeft} tickets left`);

    if (!screenshot)
      return showMessage ("Please upload payment screenshot");

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("ticket_purchases")
        .insert({
          event_id: eventData.id,
          user_id: userId,
          quantity: parseInt(quantity),
          total_price: totalPrice,
          screenshot_url: `data:image/jpeg;base64,${screenshot}`,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setPurchase(data);
      showMessage (
        "Submitted",
        "Payment submitted successfully! Waiting for admin approval."
      );
    } catch (err) {
      showMessage ("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    if (!purchase) return;

    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("purchase_id", purchase.id)
      .order("created_at", { ascending: true });

    setTickets(data || []);
  };

  useEffect(() => {
    if (!purchase) return;

    const channel = supabase
      .channel("ticket-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ticket_purchases",
          filter: `id=eq.${purchase.id}`,
        },
        (payload) => {
          setPurchase(payload.new);

          if (payload.new.status === "approved") {
            showMessage ("Approved 🎉", "Your tickets are ready");
            fetchTickets();
          }

          if (payload.new.status === "rejected") {
            showMessage (
              "Rejected ❌",
              "Please upload a valid screenshot"
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [purchase]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B2A3B" />
        </TouchableOpacity>
        

        <Text style={styles.title}>{eventData.name}</Text>
        <Text style={styles.subtitle}>
          Tickets Available: {ticketsLeft}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Number of Tickets</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            editable={!loading && !purchase}
          />
          <Text style={styles.label}>Total Price: ${totalPrice}</Text>
        </View>

        <View style={styles.card}>
         <Text style={styles.paymentText}>
  💳 Send payment to: {eventData.payment_number}
</Text>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickScreenshot}
            disabled={!!purchase}
          >
            <Text style={styles.uploadText}>
              {screenshot
                ? "Screenshot Selected"
                : "Upload Payment Screenshot"}
            </Text>
          </TouchableOpacity>

          {screenshot && (
            <Image
              source={{ uri: `data:image/jpeg;base64,${screenshot}` }}
              style={styles.preview}
            />
          )}

          {!purchase && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? "Submitting..." : "Submit Payment"}
              </Text>
            </TouchableOpacity>
          )}

          {purchase && (
            <Text style={styles.status}>
              Status: {purchase.status}
            </Text>
          )}
        </View>

        {tickets.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Your Tickets</Text>
            {tickets.map((t) => (
              <Text key={t.id} style={styles.ticket}>
                🎫 Ticket #: {t.ticket_number}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    paddingTop: STATUS_BAR_HEIGHT,
  },
  container: { padding: 20, paddingBottom: 50 },
  backText: { color: "#556b85", fontWeight: "bold", marginBottom: 10 },
  title: { color: "#556b85", fontSize: 28, textAlign: "center", marginBottom: 5 },
  subtitle: { color: "#1B2A3B", textAlign: "center", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  label: { color: "#1B2A3B", marginBottom: 10, fontSize: 16 },
  input: {
    backgroundColor: "#556b85",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  paymentText: {
    color: "#1B2A3B",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: "#556b85",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  preview: { width: "100%", height: 150, marginVertical: 10, borderRadius: 10 },
  submitButton: {
    backgroundColor: "#556b85",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  status: { color: "#fff", textAlign: "center", marginTop: 10, fontSize: 16 },
  ticket: { color: "#fff", marginVertical: 5, fontSize: 16 },
});
