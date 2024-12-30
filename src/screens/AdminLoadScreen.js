import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { Button, Input, Card, Text } from "react-native-elements";
import { Picker } from "@react-native-picker/picker";

export default function AdminLoadScreen() {
  const [loads, setLoads] = useState([]);
  const [newLoad, setNewLoad] = useState({
    current_location: "",
    destination: "",
    weight: "",
    weight_unit: "kg",
    truck_length: "",
    truck_length_unit: "m",
    contact_number: "",
    contact_email: "",
  });
  const [editingLoad, setEditingLoad] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLoads();
  }, []);

  async function fetchLoads() {
    try {
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  async function handleAddOrEditLoad() {
    try {
      setLoading(true);
      if (editingLoad) {
        const { error } = await supabase
          .from("loads")
          .update(newLoad)
          .eq("id", editingLoad.id);
        if (error) throw error;
        Alert.alert("Success", "Load updated successfully!");
      } else {
        const { error } = await supabase.from("loads").insert([newLoad]);
        if (error) throw error;
        Alert.alert("Success", "Load added successfully!");
      }
      fetchLoads();
      resetForm();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setNewLoad({
      current_location: "",
      destination: "",
      weight: "",
      weight_unit: "kg",
      truck_length: "",
      truck_length_unit: "m",
      contact_number: "",
      contact_email: "",
    });
    setEditingLoad(null);
    setShowForm(false);
  }

  async function handleDeleteLoad(id) {
    try {
      const { error } = await supabase.from("loads").delete().eq("id", id);

      if (error) throw error;

      Alert.alert("Success", "Load deleted successfully!");
      fetchLoads();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  const renderMeasurementInput = (fieldName, placeholder, unitOptions) => (
    <View style={styles.inputGroup}>
      <View style={styles.inputWrapper}>
        <Input
          placeholder={placeholder}
          value={newLoad[fieldName]}
          onChangeText={(value) =>
            setNewLoad({ ...newLoad, [fieldName]: value })
          }
          inputStyle={styles.inputText}
          containerStyle={styles.measurementInput}
          placeholderTextColor={"#000"}
        />
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={newLoad[`${fieldName}_unit`]}
          style={styles.picker}
          onValueChange={(itemValue) =>
            setNewLoad({ ...newLoad, [`${fieldName}_unit`]: itemValue })
          }
        >
          {unitOptions.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {!showForm ? (
        <Button
          title="Add Load"
          onPress={() => setShowForm(true)}
          buttonStyle={styles.addButton}
          containerStyle={styles.addButtonContainer}
        />
      ) : (
        <View style={styles.form}>
          <Input
            placeholder="current location"
            value={newLoad.current_location}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, current_location: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor={"#000"}
          />
          <Input
            placeholder="destination"
            value={newLoad.destination}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, destination: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor={"#000"}
          />

          {renderMeasurementInput("weight", "weight", ["kg", "tons", "lbs"])}

          {renderMeasurementInput("truck_length", "truck length", [
            "m",
            "ft",
            "inches",
          ])}

          <Input
            placeholder="contact number"
            value={newLoad.contact_number}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, contact_number: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor={"#000"}
          />

          <Input
            placeholder="contact email"
            value={newLoad.contact_email}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, contact_email: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor={"#000"}
          />

          <Button
            title={editingLoad ? "Update Load" : "Add Load"}
            onPress={handleAddOrEditLoad}
            loading={loading}
            buttonStyle={styles.submitButton}
          />
          <Button
            title="Cancel"
            onPress={resetForm}
            type="outline"
            containerStyle={styles.cancelButton}
            titleStyle={styles.cancelButtonText}
          />
        </View>
      )}

      <FlatList
        data={loads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card containerStyle={styles.card}>
            <Card.Title style={styles.cardTitle}>
              {item.current_location}- {item.destination}
            </Card.Title>
            <Card.Divider />
            <View>
              <Text style={styles.cardText}>From: {item.current_location}</Text>
              <Text style={styles.cardText}>To: {item.destination}</Text>
              <Text style={styles.cardText}>
                Weight: {item.weight} {item.weight_unit}
              </Text>
              <Text style={styles.cardText}>
                Truck Length: {item.truck_length} {item.truck_length_unit}
              </Text>
              <Text style={styles.cardText}>
                Contact: {item.contact_number}
              </Text>
              <Button
                title="Edit"
                onPress={() => {
                  setEditingLoad(item);
                  setNewLoad(item);
                  setShowForm(true);
                }}
                type="clear"
                buttonStyle={styles.editButton}
                titleStyle={styles.editButtonText}
              />
              <Button
                title="Delete"
                onPress={() => handleDeleteLoad(item.id)}
                type="clear"
                buttonStyle={styles.deleteButton}
                titleStyle={styles.deleteButtonText}
              />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  addButton: {
    backgroundColor: "#FF0000",
  },
  addButtonContainer: {
    margin: 10,
  },
  form: {
    padding: 10,
    backgroundColor: "#e5e7eb",
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 2,
  },
  inputText: {
    color: "#000",
    textTransform: "none",
  },
  measurementInput: {
    paddingHorizontal: 0,
  },
  pickerContainer: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    marginLeft: -10,
  },
  picker: {
    height: 50,
    backgroundColor: "transparent",
  },
  submitButton: {
    backgroundColor: "#FF0000",
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 10,
    borderColor: "#000000",
    borderWidth: 1,
    backgroundColor: "#f9fafb",
  },
  cancelButtonText: {
    color: "#000",
  },
  card: {
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    margin: 5,
  },
  cardTitle: {
    color: "#333",
    fontSize: 16,
  },
  cardText: {
    color: "#555",
    marginVertical: 2,
  },
  editButton: {
    color: "#FF0000",
    borderColor: "#0ea5e9",
    borderWidth: 1,
    marginTop: 20,
    backgroundColor: "#e0f2fe",
  },
  editButtonText: {
    color: "#0ea5e9",
  },
  deleteButton: {
    color: "#FF0000",
    borderColor: "#FF0000",
    borderWidth: 1,
    marginTop: 10,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#FF0000",
  },
});
