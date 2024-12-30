import React, { useState } from "react";
import Logo from "../../assets/logo.png"; 
import { supabase } from "../services/supabaseClient";
import { Input, Button, Image } from "react-native-elements";
import { View, StyleSheet, Alert, ImageBackground } from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();

      navigation.replace(profile.is_admin ? "AdminHome" : "UserHome");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require("../../assets/background.jpg")} 
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logo} />
        </View>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#000"}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#000"}
        />
        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          buttonStyle={styles.loginButton}
          containerStyle={styles.buttonContainer}
        />
        <Button
          title="Register"
          type="outline"
          onPress={() => navigation.navigate("Register")}
          buttonStyle={styles.registerButton}
          containerStyle={styles.buttonContainer}
          titleStyle={styles.buttonTitle}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgb(255, 255, 255)", // Semi-transparent background for inputs and buttons
    borderRadius: 10,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  inputContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF0000", 
    marginBottom: 15,
  },
  input: {
    fontSize: 16,
    color: "#000",
  },
  loginButton: {
    backgroundColor: "#FF0000",
    borderRadius: 5,
  },
  registerButton: {
    borderColor: "#000",
    borderRadius: 5,
    borderWidth: 1,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 15,
  },
  buttonTitle: {
    color: "#000",
  }
});
