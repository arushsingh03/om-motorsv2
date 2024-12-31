import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { supabase } from "./src/services/supabaseClient";

// Ignore specific warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  // Add other warnings you want to ignore
]);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Supabase session
    const initializeApp = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        console.error("Initialization error:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
