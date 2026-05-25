import React, { useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { EventContext } from "./EventContext";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

export default function FavoritesScreen() {
  const { events, toggleFavorite, loading } = useContext(EventContext);

  const favoriteEvents = events.filter((e) => e.isFavorite);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: "#fff" }}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Favorites</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>
          Your Favorites ({favoriteEvents.length})
        </Text>

        {favoriteEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="favorite-border" size={64} color="#999" />
            <Text style={styles.emptyText}>No favorite events yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the heart icon on events to save them here
            </Text>
          </View>
        ) : (
          favoriteEvents.map((event) => (
            <View key={event.id} style={styles.favoriteCard}>
              {event.cover ? (
                <Image
                  source={{ uri: event.cover }}
                  style={styles.favoriteCover}
                />
              ) : null}

              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteTitle}>{event.title}</Text>
                <Text style={styles.favoriteOrganizer}>
                  {event.organizer}
                </Text>
                <Text style={styles.favoriteDate}>
                  {event.date} • {event.time}
                </Text>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => toggleFavorite(event.id)}
                >
                  <Icon name="delete" size={20} color="#E1D9CC" />
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5" },

  header: {
    height: 56 + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  logo: { fontSize: 24, fontWeight: "700" },

  content: { padding: 16, paddingBottom: 80 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B2A3B",
    marginTop: 24,
    marginBottom: 16,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#1B2A3B",
    marginTop: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#556b85",
    textAlign: "center",
    marginTop: 8,
  },

  favoriteCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    elevation: 2,
  },
  favoriteCover: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  favoriteInfo: { flex: 1 },
  favoriteTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  favoriteOrganizer: { fontSize: 14, color: "#1B2A3B", marginBottom: 2 },
  favoriteDate: { fontSize: 14, color: "#1B2A3B" },

  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#556b85",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  removeText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
});
