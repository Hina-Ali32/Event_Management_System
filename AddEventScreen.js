import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { EventContext } from "../screens/EventContext";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showMessage } from "../screens/showMessage"; 
const DEFAULT_COVER = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200";
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 0;

export default function AddEventScreen() {
  const navigation = useNavigation();
  const { addEvent } = useContext(EventContext);
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState({
    coverBase64: "", // Picked from gallery
    coverUrl: "",    // Paste URL
    title: "",
    organizer: "",
    organizerEmail:"",
    location: "",
    date: "",
    time: "",
    category: "Sports",
    totalTickets: "",
    ticketPrice: "",
    paymentNumber: "", //  PAYMENT NUMBER
    description: "",
  });

  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("Add");

  const handleChange = (key, value) => setEvent(prev => ({ ...prev, [key]: value }));

  // 🔹 Pick image from gallery (base64) - safe for mobile & Snack
  const pickCoverPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showMessage("Permission required", "Allow gallery access.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true, // 🔹 base64 avoids device hang
      });

      if (!result.canceled && result.assets?.length > 0) {
        setEvent(prev => ({ ...prev, coverBase64: result.assets[0].base64 }));
      }
    } catch (err) {
      console.log("Pick image error:", err);
      showMessage("Error", "Failed to pick image.");
    }
  };

  // 🔹 Save event
  const saveEvent = async () => {
    const { title, organizer, organizerEmail, date, time, totalTickets, ticketPrice, paymentNumber, description, coverBase64, coverUrl, category, location } = event;

    if (!title.trim() || !organizer.trim() ||  !organizerEmail.trim() ||!date.trim() || !time.trim() || !totalTickets.trim() || !ticketPrice.trim() || !paymentNumber.trim()) {
      showMessage("Missing Info", "Please fill all required fields *");
      return;
    }

    setUploading(true);

    try {
      // 🔹 Priority: picked image > URL > default
      let finalCover = DEFAULT_COVER;
      if (coverBase64) {
        finalCover = `data:image/jpeg;base64,${coverBase64}`;
      } else if (coverUrl) {
        finalCover = coverUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const [day, month, year] = date.split("/");
      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      const newEvent = {
        title: title.trim(),
        organizer: organizer.trim(),
        organizer_id: user.id,
        category,
      
 organizeremail: organizerEmail.trim(),
        location: location || "",
        date: formattedDate,
        time: time.trim(),
        cover: finalCover,
        total_tickets: parseInt(totalTickets),
        tickets_sold: 0,
        ticket_price: parseFloat(ticketPrice),
        payment_number: paymentNumber.trim(), 
        description: description.trim(),
      };

      const { data: insertedEvent, error } = await supabase
        .from("events")
        .insert([newEvent])
        .select()
        .single();

      if (error) throw error;

      addEvent(insertedEvent);
      showMessage("Success", "Event saved successfully!");

      // Reset form
      setEvent({
        coverBase64: "",
        coverUrl: "",
        title: "",
        organizer: "",
        
  organizerEmail: "", 
        location: "",
        date: "",
        time: "",
        category: "Sports",
        totalTickets: "",
        ticketPrice: "",
          paymentNumber: "", 
        description: "",
      });

      navigation.navigate("Dashboard");

    } catch (err) {
      console.log(err);
      showMessage("Error", "Failed to save event. Check console.");
    } finally {
      setUploading(false);
    }
  };

  const handleFooterPress = (tab, route) => {
    setActiveTab(tab);
    if (route) navigation.navigate(route);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <StatusBar backgroundColor="#F0F2F5" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B2A3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Event</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Cover */}
        <View style={styles.card}>
          <TouchableOpacity onPress={pickCoverPhoto}>
            {uploading ? (
              <View style={[styles.coverPlaceholder, { justifyContent: "center" }]}>
                <ActivityIndicator size="large" color="#1B2A3B" />
                <Text style={{ color: "#999", marginTop: 8 }}>Uploading...</Text>
              </View>
            ) : event.coverBase64 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${event.coverBase64}` }} style={styles.coverImage} />
            ) : event.coverUrl ? (
              <Image source={{ uri: event.coverUrl }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={32} color="#999" />
                <Text style={styles.placeholderText}>Pick from gallery or paste image URL</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Paste cover image URL (https://...)"
            style={styles.input}
            value={event.coverUrl}
            onChangeText={t => handleChange("coverUrl", t)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Event Details */}
        <View style={styles.card}>
          <TextInput placeholder="Event Title *" style={styles.input} value={event.title} onChangeText={t => handleChange("title", t)} />
          <TextInput placeholder="Organizer Name *" style={styles.input} value={event.organizer} onChangeText={t => handleChange("organizer", t)} />
     

<TextInput
  placeholder="Organizer Email"
  style={styles.input}
  value={event.organizerEmail}
  onChangeText={t => handleChange("organizerEmail", t)}
/>

          <TextInput placeholder="Location" style={styles.input} value={event.location} onChangeText={t => handleChange("location", t)} />
          <TextInput placeholder="DD/MM/YYYY *" style={styles.input} value={event.date} onChangeText={t => handleChange("date", t)} />
          <TextInput placeholder="HH:MM AM/PM *" style={styles.input} value={event.time} onChangeText={t => handleChange("time", t)} />
          <TextInput placeholder="Total Tickets *" style={styles.input} keyboardType="numeric" value={event.totalTickets} onChangeText={t => handleChange("totalTickets", t.replace(/\D/g, ""))} />
          <TextInput placeholder="Ticket Price *" style={styles.input} keyboardType="numeric" value={event.ticketPrice} onChangeText={t => handleChange("ticketPrice", t.replace(/\D/g, ""))} />
          <TextInput
  placeholder="Payment Number (Easypaisa / JazzCash / Card) *"
  style={styles.input}
  keyboardType="number-pad"
  value={event.paymentNumber}
  onChangeText={t =>
    handleChange("paymentNumber", t.replace(/\D/g, ""))
  }
/>

          <TextInput placeholder="Event Description (optional)" style={[styles.input, { height: 80 }]} multiline numberOfLines={4} value={event.description} onChangeText={t => handleChange("description", t)} />
          <Picker selectedValue={event.category} onValueChange={v => handleChange("category", v)}>
            <Picker.Item label="Sports" value="Sports" />
            <Picker.Item label="Food" value="Food" />
            <Picker.Item label="Music" value="Music" />
            <Picker.Item label="Education" value="Education" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={saveEvent}>
          <Text style={styles.buttonText}>{uploading ? "Saving..." : "Save Event"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: (Platform.OS === "web" ? 10 : 20) + insets.bottom }]}>
        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Add", "AddEvent")}>
          <MaterialIcons name="add-circle-outline" size={20} color={activeTab === "Add" ? "#1B2A3B" : "#556b85"} />
          <Text style={styles.footerText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Delete", "DeleteEvents")}>
          <Ionicons name="trash-outline" size={20} color={activeTab === "Delete" ? "#1B2A3B" : "#556b85"} />
          <Text style={styles.footerText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Tickets", "ManageTickets")}>
          <FontAwesome5 name="ticket-alt" size={18} color={activeTab === "Tickets" ? "#1B2A3B" : "#556b85"} />
          <Text style={styles.footerText}>Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => handleFooterPress("Stats", "AdminEventStatsScreen")}>
          <Ionicons name="stats-chart" size={20} color={activeTab === "Stats" ? "#1B2A3B" : "#556b85"} />
          <Text style={styles.footerText}>Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0F2F5" },
  header: { height: 60, backgroundColor: "#F0F2F5", justifyContent: "center", alignItems: "center", elevation: 4 },
  backButton: { position: "absolute", left: 16, top: 18 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1B2A3B" },
  card: { backgroundColor: "#fff", borderRadius: 15, padding: 18, marginBottom: 16, elevation: 2 },
  coverImage: { height: 180, borderRadius: 12, marginBottom: 12 },
  coverPlaceholder: { height: 180, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: "#ccc", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  placeholderText: { color: "#999", marginTop: 8, textAlign: "center" },
  input: { borderBottomWidth: 1, borderColor: "#ddd", paddingVertical: 8, marginBottom: 12 },
  button: { backgroundColor: "#556b85", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#1B2A3B", fontSize: 16, fontWeight: "600" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#F0F2F5", flexDirection: "row", justifyContent: "space-around", paddingVertical: 14, elevation: 8 },
  footerButton: { alignItems: "center" },
  footerText: { color: "#556b85", fontSize: 12, marginTop: 2 },
});
