import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import MyProfileScreen from "../screens/MyProfileScreen";
import FavoriteScreen from "../screens/FavoriteScreen";
import MyTicketsScreen from "../screens/MyTicketScreen";
import { EventContext } from "../screens/EventContext";
import { supabase } from "../supabase";

const Tab = createBottomTabNavigator();
const categories = ["Sports", "Food", "Music", "Education"];
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

  // Convert 24-hour time (HH:MM) to AM/PM format
function formatTimeToAMPM(time) {
  if (!time) return "";
  // If time already has AM/PM, just return it
  if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) {
    return time;
  }

  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}


/* ================= HOME SCREEN ================= */

function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const { events, toggleFavorite } = useContext(EventContext);
  const [brochures, setBrochures] = useState([]);

  useEffect(() => {
    let filteredEvents = events;
    if (activeCategory) {
      filteredEvents = events.filter((e) => e.category === activeCategory);
    }
    setBrochures(filteredEvents.slice(0, 3));
  }, [events, activeCategory]);

  const searchResults =
    searchQuery.length > 0
      ? events.filter((e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  const filteredExplore = events.filter((e) => {
    let matchesCategory = activeCategory ? e.category === activeCategory : true;
    let matchesSearch = e.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleMenu = (event) => {
    navigation.navigate("AddEventDetails", { event });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>EMS</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchWrapper,
              isSearchFocused && styles.searchWrapperFocused,
            ]}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Search events..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            <Icon name="search" size={22} color="#888" />
          </View>

          {searchQuery.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.length === 0 ? (
                <Text style={styles.noResultText}>No events found</Text>
              ) : (
                searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchItem}
                    onPress={() => {
                      setSearchQuery("");
                      handleMenu(item);
                    }}
                  >
                    <Text style={styles.searchItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                activeCategory === cat && styles.categoryButtonActive,
              ]}
              onPress={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Brochures */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.brochuresContainer}
        >
          {brochures.map((item) => (
            <View key={item.id} style={styles.brochureCard}>
              {item.cover && (
                <Image
                  source={{ uri: item.cover }}
                  style={styles.brochureImage}
                />
              )}
              <View style={styles.brochureOverlay} />
              <Text style={styles.brochureTitle}>{item.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Explore More */}
        <View style={styles.exploreContainer}>
          <Text style={styles.sectionTitle}>Explore More</Text>
          <FlatList
            data={filteredExplore}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.exploreCard}>
                {item.cover && (
                  <Image
                    source={{ uri: item.cover }}
                    style={styles.exploreImage}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.exploreTitle}>{item.title}</Text>
                  <Text style={styles.exploreInfo}>
  {item.date} | {formatTimeToAMPM(item.time)}
</Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 5,
                    }}
                  >
                   <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
  <Icon
    name={item.isFavorite ? "favorite" : "favorite-border"} // solid when favorited, outline when not
    size={24}
    color={item.isFavorite ? "red" : "#333"} // outline is dark
  />
</TouchableOpacity>

                    <TouchableOpacity onPress={() => handleMenu(item)}>
                      <Icon name="more-vert" size={24} color="#141414" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= TICKETS ================= */
function TicketsScreenWrapper() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  if (!userId) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          Please login to view your tickets.
        </Text>
      </SafeAreaView>
    );
  }

  return <MyTicketsScreen userId={userId} />;
}

/* ================= ADD BUTTON ================= */
function CustomAddButton({ navigation }) {
  const handlePress = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      Alert.alert("Not logged in", "Please login first.");
      return;
    }
    navigation.navigate("AddEvent");
  };

  return (
    <TouchableOpacity style={styles.addButtonContainer} onPress={handlePress}>
      <View style={styles.addButton}>
        <Icon name="add" size={25} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

/* ================= DASHBOARD ================= */
export default function DashboardScreen() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#F8FAFC",
          height: Platform.OS === "android" ? 80 : 65,
          paddingBottom: Platform.OS === "android" ? 15 : 0,
        },
        tabBarActiveTintColor: "#1B2A3B",
        tabBarInactiveTintColor: "#556b85",
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Add") return null;
          const icons = {
            Home: "home",
            Favorites: "favorite",
            Tickets: "confirmation-number",
            Profile: "person",
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoriteScreen} />
      <Tab.Screen
        name="Add"
        component={() => null}
        options={({ navigation }) => ({
          tabBarButton: () => <CustomAddButton navigation={navigation} />,
        })}
      />
      <Tab.Screen name="Tickets" component={TicketsScreenWrapper} />
      <Tab.Screen name="Profile" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    paddingTop: STATUS_BAR_HEIGHT,
  },
  header: { padding: 20 },
  headerText: { fontSize: 28, fontWeight: "700", color: "#1B2A3B" },

  searchContainer: { marginTop: 20, paddingHorizontal: 20 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  searchWrapperFocused: {
    borderWidth: 2,
    borderColor: "#2b2f33",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    width: "100%",
  },

  categoriesContainer: { marginTop: 20, paddingHorizontal: 15 },
  categoryButton: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#CCC",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryButtonActive: { backgroundColor: "#556b85", borderColor: "#556b85" },
  categoryText: { fontWeight: "600", color: "#333" },
  categoryTextActive: { color: "#fff" },

  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1B2A3B", marginBottom: 10 },

  brochuresContainer: { marginTop: 15, paddingHorizontal: 15 },
  brochureCard: {
    marginRight: 15,
    width: 150,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  brochureImage: { width: "100%", height: 100 },
  brochureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  brochureTitle: {
    position: "absolute",
    bottom: 10,
    left: 10,
    color: "#fff",
    fontWeight: "600",
  },

  exploreContainer: { marginTop: 25, paddingHorizontal: 20 },
  exploreCard: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  exploreImage: { width: 120, height: 80, borderRadius: 15, marginRight: 15 },
  exploreTitle: { fontWeight: "700", fontSize: 16, color: "#1B2A3B" },
  exploreInfo: { color: "#999", fontSize: 14 },

  addButtonContainer: { top: -20, alignItems: "center" },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#556b85",
    justifyContent: "center",
    alignItems: "center",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#fff" },
});
