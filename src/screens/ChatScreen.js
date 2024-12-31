import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ComingSoonCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="chatbubbles-outline" size={64} color="#FF0000" />
        <Text style={styles.title}>Chat System Coming Soon</Text>
        <Text style={styles.subtitle}>
          We're working hard to bring you a seamless chat experience. Stay tuned!
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: 24,
    backgroundColor: "#FF0000",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ComingSoonCard;
