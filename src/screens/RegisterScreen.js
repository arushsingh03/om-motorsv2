import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Input, Button } from "react-native-elements";
import { supabase } from "../services/supabaseClient";
import Logo from "../../assets/logo.png";
import { Image } from "react-native-elements/dist/image/Image";

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
  });

  async function handleRegister() {
    try {
      setLoading(true);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          name: formData.name,
          phone_number: formData.phone,
          address: formData.address,
          is_admin: false,
        },
      ]);

      if (profileError) throw profileError;

      Alert.alert("Success", "Registration successful!");
      navigation.navigate("Login");
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logo} />
        </View>

        <Input
          placeholder="Name"
          value={formData.name}
          onChangeText={(value) => setFormData({ ...formData, name: value })}
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#9ca3af"}
        />
        <Input
          placeholder="Phone Number"
          value={formData.phone}
          onChangeText={(value) => setFormData({ ...formData, phone: value })}
          keyboardType="phone-pad"
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#9ca3af"}
        />
        <Input
          placeholder="Password"
          value={formData.password}
          onChangeText={(value) =>
            setFormData({ ...formData, password: value })
          }
          secureTextEntry
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#9ca3af"}
        />
        <Input
          placeholder="Confirm Password"
          value={formData.password}
          onChangeText={(value) =>
            setFormData({ ...formData, password: value })
          }
          secureTextEntry
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#9ca3af"}
        />
        <Input
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => setFormData({ ...formData, email: value })}
          autoCapitalize="none"
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#9ca3af"}
        />
        <Input
          placeholder="Address"
          value={formData.address}
          onChangeText={(value) => setFormData({ ...formData, address: value })}
          multiline
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          placeholderTextColor={"#9ca3af"}
        />
        <Button
          title="Register"
          onPress={handleRegister}
          loading={loading}
          buttonStyle={styles.registerButton}
          containerStyle={styles.buttonContainer}
          titleStyle={styles.buttonText}
        />
      </ScrollView>
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
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 10,
    marginTop: 92,
    elevation: 10,
    shadowColor: "#000",
  },
  logoContainer: {
    marginBottom: 10,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#FF0000",
    marginBottom: 1,
    color: "#000",
  },
  input: {
    fontSize: 16,
    color: "#000",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    paddingRight: 70,
  },

  registerButton: {
    backgroundColor: "#FF0000",
    borderRadius: 5,
    width: "100%",
  },

  buttonContainer: {
    width: "100%",
    marginTop: 15,
  },
});
