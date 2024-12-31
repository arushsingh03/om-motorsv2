import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-elements";
import { MaterialIcons } from "react-native-vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { supabase } from "../services/supabaseClient";

// Screen imports
import ChatScreen from "../screens/ChatScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import UserLoadScreen from "../screens/UserLoadScreen";
import AdminLoadScreen from "../screens/AdminLoadScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState("Login");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;
        setInitialRoute(profile?.role === "admin" ? "AdminHome" : "UserHome");
      }
    } catch (error) {
      console.error("Error checking user:", error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout(navigation) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  if (isLoading) {
    return null; // Or a loading spinner
  }

  const headerRight = (navigation) => (
    <View style={styles.headerActions}>
      <Button
        onPress={() => navigation.navigate("Chat")}
        icon={<MaterialIcons name="chat" size={24} color="#FF0000" />}
        type="clear"
      />
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        style={styles.iconSpacing}
      >
        <MaterialIcons name="account-circle" size={24} color="#FF0000" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleLogout(navigation)}
        style={styles.iconSpacing}
      >
        <MaterialIcons name="power-settings-new" size={24} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: "Register",
            headerStyle: styles.header,
            headerTintColor: "#FF0000",
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: "Profile",
            headerStyle: styles.header,
            headerTintColor: "#FF0000",
          }}
        />
        <Stack.Screen
          name="AdminHome"
          component={AdminLoadScreen}
          options={({ navigation }) => ({
            title: "Manage Loads",
            headerLeft: null,
            headerStyle: styles.header,
            headerTintColor: "#FF0000",
            headerRight: () => headerRight(navigation),
          })}
        />
        <Stack.Screen
          name="UserHome"
          component={UserLoadScreen}
          options={({ navigation }) => ({
            title: "Available Loads",
            headerLeft: null,
            headerStyle: styles.header,
            headerTintColor: "#FF0000",
            headerRight: () => headerRight(navigation),
          })}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: "Support Chat",
            headerStyle: styles.header,
            headerTintColor: "#FF0000",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  iconSpacing: {
    marginLeft: 15,
    marginRight: 10,
  },
  header: {
    backgroundColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
