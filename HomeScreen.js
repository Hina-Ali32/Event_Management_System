import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";

export default function HomeScreen({ navigation }) {
  return (
  <ImageBackground
  source={require("../assets/bg.jpg")}
  style={styles.background}
  resizeMode="cover"
>
  <View style={styles.centerContent}>
  <Text style={styles.title}>
    <Text style={styles.titleEvent}>Event </Text>
    <Text style={styles.titleManagement}>Management System</Text>
  </Text>

    <Text style={styles.subtitle}>
      Empower your team to plan, coordinate, and execute memorable events with clarity and confidence.
Automate registrations, scheduling, and communication so you can focus on delivering exceptional experiences..

    </Text>

    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate("Signup")}
    >
      <Text style={styles.buttonText}>Get Started</Text>
    </TouchableOpacity>
  </View>
</ImageBackground>

  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
 centerContent: {
  flex: 1,
  justifyContent: "flex-end",   // was "flex-end"
  alignItems: "center",
  paddingHorizontal: 24,
  paddingBottom: 110,          // reduce bottom padding
  paddingTop: 140,             // optional: add a bit of top padding
},

 title: {
  fontSize: 28,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: 8,
},
titleEvent: {
  color: "#F0F2F5",   // first color
},
titleManagement: {
  color: "#F0F2F5",   // second color
},

  subtitle: {
    fontSize: 14,
    color: "#F0F2F5",
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#F0F2F5",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 18,
  },
  buttonText: {
    color: "#33363F",
    fontSize: 16,
    fontWeight: "600",
  },
});
