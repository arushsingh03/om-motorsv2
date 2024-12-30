import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, Icon } from "react-native-elements";
import { supabase } from "../services/supabaseClient";

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        // Set initial values for the inputs
        setName(data?.name || "");
        setPhoneNumber(data?.phone_number || "");
        setAddress(data?.address || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .upsert({ id: user.id, name, phone_number: phoneNumber, address })
          .eq("id", user.id);

        if (error) throw error;

        alert("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>Profile Information</Card.Title>
        <Card.Divider />
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Icon name="user" type="font-awesome" color="#333" size={20} />
            <Text style={styles.labelValue}>{profile?.name || "Not set"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="phone" type="font-awesome" color="#333" size={20} />
            <Text style={styles.labelValue}>
              {profile?.phone_number || "Not set"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="home" type="font-awesome" color="#333" size={20} />
            <Text style={styles.labelValue}>
              {profile?.address || "Not set"}
            </Text>
          </View>
        </View>
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>Edit Profile</Card.Title>
        <Card.Divider />
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />
          <Button
            title="Save Changes"
            onPress={updateProfile}
            buttonStyle={styles.saveButton}
            titleStyle={styles.saveButtonText}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  card: {
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    margin: 10,
    padding: 15,
    elevation: 2,
  },
  cardTitle: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  labelValue: {
    fontSize: 16,
    color: "#000",
    marginLeft: 20,
  },
  formSection: {
    padding: 15,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
    backgroundColor: "#f8fafc",
  },
  saveButton: {
    backgroundColor: "#FF0000",
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
