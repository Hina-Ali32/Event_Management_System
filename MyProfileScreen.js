import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { supabase } from "../supabase";
import { useNavigation } from "@react-navigation/native";
import { showMessage } from "../screens/showMessage"; 
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

export default function MyProfileScreen() {
  const navigation = useNavigation();
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
const [myEvents, setMyEvents] = useState([]);

const fetchUserEvents = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("title, organizerPhone, organizerEmail")
      .eq("organizer_id", userId);

    if (error) throw error;
    setMyEvents(data || []);
  } catch (err) {
    console.log("Error fetching user events:", err.message);
  }
};
  // Fetch user email and role
  const fetchUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.log("Error fetching user:", error);
      return;
    }
    if (user) {
      setUserEmail(user.email);
fetchUserEvents(user.id);
      // Fetch role from users table
      const { data, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (roleError) {
        console.log("Error fetching role:", roleError.message);
      } else {
        setUserRole(data.role);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogoutAndDelete = async () => {
    try {
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();
      if (getUserError || !user) {
       showMessage("Error", "User not found.");
        return;
      }

      // Delete user from 'users' table
      const { error: tableError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);

      if (tableError) {
        Alert.alert("Error", tableError.message);
        return;
      }

      // Delete user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      // Note: admin.deleteUser requires service role key on server-side
      if (authError) {
        console.log(
          "Auth deletion error (client cannot delete auth user directly):",
          authError.message
        );
        await supabase.auth.signOut();
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Signup" }],
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerText}>Profile</Text>
    </View>

    <View style={styles.content}>
      {/* My Account */}
      <TouchableOpacity style={styles.optionCard}>
        <Icon name="account-circle" size={28} color="#1B2A3B" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.optionTitle}>My Account</Text>
          <Text style={styles.optionSubtitle}>
            {userEmail || "Loading..."} {userRole ? `(${userRole})` : ""}
          </Text>
        </View>
      </TouchableOpacity>

      {/* App Info */}
      <TouchableOpacity style={styles.optionCard}>
        <Icon name="info" size={28} color="#1B2A3B" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.optionTitle}>App Info</Text>
          <Text style={styles.optionSubtitle}>
            Event Management System v1.0
          </Text>
        </View>
      </TouchableOpacity>

      {/* Logout & Delete */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={handleLogoutAndDelete}
      >
        <Icon name="logout" size={28} color="#1B2A3B" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.optionTitle}>Logout & Delete</Text>
          <Text style={styles.optionSubtitle}>
            Sign out and remove your account
          </Text>
        </View>
      </TouchableOpacity>

      {/* ✅ Add user events contact info here */}
      {myEvents.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
            Your Events Contact Info
          </Text>
          {myEvents.map((event) => (
            <View
              key={event.title}
              style={{
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontWeight: "600" }}>{event.title}</Text>
              {event.organizerPhone && <Text>📞 {event.organizerPhone}</Text>}
              {event.organizerEmail && <Text>✉️ {event.organizerEmail}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  </View>
);
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    height: 56 + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
  },
  content: {
    padding: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B2A3B",
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#1B2A3B",
    marginTop: 4,
  },
});
