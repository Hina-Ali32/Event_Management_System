import { Alert, Platform } from "react-native";

export function showMessage(title, message) {
  if (Platform.OS === "web") {
    // fallback for web
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
