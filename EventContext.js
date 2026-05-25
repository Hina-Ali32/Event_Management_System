import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase"; // make sure supabase.js is configured

export const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Supabase fetch error:", error);
        setEvents([]);
        return;
      }

      // Load favorites from AsyncStorage
      const savedFavorites = await AsyncStorage.getItem("favorites");
      const favoriteIds = savedFavorites ? JSON.parse(savedFavorites) : [];

      const mappedEvents = data.map((e) => ({
        id: e.id,
        title: e.title || "",
        organizer: e.organizer || "",
        location: e.location || "",
        date: e.date || "",
        time: e.time || "",
        category: e.category || "Sports",
        cover: e.cover || null,
        isFavorite: favoriteIds.includes(e.id),
        ticketsSold: e.tickets_sold || 0,
      }));

      setEvents(mappedEvents);
    } catch (err) {
      console.log("Unexpected fetch error:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id) => {
    const updatedEvents = events.map((e) =>
      e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
    );
    setEvents(updatedEvents);

    // Save favorites to AsyncStorage
    const favoriteIds = updatedEvents
      .filter((e) => e.isFavorite)
      .map((e) => e.id);

    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(favoriteIds));
    } catch (err) {
      console.log("Error saving favorites:", err);
    }
  };

  // ADD EVENT: Immediately add new event to state
  const addEvent = (newEvent) => {
    setEvents((prevEvents) => [newEvent, ...prevEvents]);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <EventContext.Provider
      value={{ events, toggleFavorite, loading, addEvent, fetchEvents }}
    >
      {children}
    </EventContext.Provider>
  );
};