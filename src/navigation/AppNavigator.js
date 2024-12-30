import React from "react";
import ChatScreen from "../screens/ChatScreen";
import { Button } from "react-native-elements";
import LoginScreen from "../screens/LoginScreen";
import { supabase } from "../services/supabaseClient";
import RegisterScreen from "../screens/RegisterScreen";
import UserLoadScreen from "../screens/UserLoadScreen";
import AdminLoadScreen from "../screens/AdminLoadScreen";
import ProfileScreen from "../screens/ProfileScreen"; // Add this import
import { MaterialIcons } from "react-native-vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";

const Stack = createStackNavigator();

export default function AppNavigator() {
  async function handleLogout(navigation) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      navigation.replace("Login");
    }
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Register" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
         <Stack.Screen
          name="AdminHome"
          component={AdminLoadScreen}
          options={({ navigation }) => ({
            title: "Manage Loads",
            headerLeft: null,
            headerRight: () => (
              <View style={styles.headerActions}>
                <Button
                  onPress={() => navigation.navigate("Chat")}
                  icon={<MaterialIcons name="chat" size={24} color="#FF0000" />} // Updated icon
                  type="clear"
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate("Profile")}
                  style={styles.iconSpacing}
                >
                  <MaterialIcons
                    name="account-circle"
                    size={24}
                    color="#FF0000"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleLogout(navigation)}
                  style={styles.iconSpacing}
                >
                  <MaterialIcons
                    name="power-settings-new"
                    size={24}
                    color="#FF0000"
                  />
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="UserHome"
          component={UserLoadScreen}
          options={({ navigation }) => ({
            title: "Available Loads",
            headerLeft: null,
            headerRight: () => (
              <View style={styles.headerActions}>
                <Button
                  onPress={() => navigation.navigate("Chat")}
                  icon={<MaterialIcons name="chat" size={24} color="#FF0000" />} // Updated icon
                  type="clear"
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate("Profile")}
                  style={styles.iconSpacing}
                >
                  <MaterialIcons
                    name="account-circle"
                    size={24}
                    color="#FF0000"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleLogout(navigation)}
                  style={styles.iconSpacing}
                >
                  <MaterialIcons
                    name="power-settings-new"
                    size={24}
                    color="#FF0000"
                  />
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: "Support Chat" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconSpacing: {
    marginLeft: 15,
    marginRight: 10,
  },
});
