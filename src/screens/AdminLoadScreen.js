import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { View, StyleSheet, FlatList, Alert, Linking } from "react-native";
import { Button, Input, Card, Text } from "react-native-elements";
import { Picker } from "@react-native-picker/picker";
import moment from "moment";

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

  const downloadReceipt = async (receiptUrl) => {
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receiptUrl, 3600); // Creates a signed URL valid for 1 hour

      if (error) throw error;

      Linking.openURL(data.signedUrl); // Open the URL in the browser to download the receipt
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not download receipt. Please try again later."
      );
    }
  };

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
            placeholder="Current Location"
            value={newLoad.current_location}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, current_location: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor={"#000"}
          />
          <Input
            placeholder="Destination"
            value={newLoad.destination}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, destination: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor={"#000"}
          />

          {renderMeasurementInput("weight", "Weight", ["kg", "tons", "lbs"])}

          {renderMeasurementInput("truck_length", "Truck Length", [
            "m",
            "ft",
            "inches",
          ])}

          <Input
            placeholder="Contact Number"
            value={newLoad.contact_number}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, contact_number: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor={"#000"}
          />

          <Input
            placeholder="Contact Email"
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
              {item.current_location} - {item.destination}
            </Card.Title>
            <Card.Divider />
            <View style={styles.cardContent}>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>Date:</Text>
                  <Text style={styles.labelValue}>
                    {moment(item.created_at).format("DD/MM/YYYY")}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>Time:</Text>
                  <Text style={styles.labelValue}>
                    {moment(item.created_at).format("hh:mm:ss, A")}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>From:</Text>
                  <Text style={styles.labelValue}>{item.current_location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>To:</Text>
                  <Text style={styles.labelValue}>{item.destination}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>Weight:</Text>
                  <Text style={styles.labelValue}>
                    {item.weight} {item.weight_unit}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>Truck Length:</Text>
                  <Text style={styles.labelValue}>
                    {item.truck_length} {item.truck_length_unit}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>Contact: </Text>
                  <Text style={styles.labelValue}>{item.contact_number}</Text>
                </View>
              </View>
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
              {item.receipt_url && (
                <Button
                  title="Download Receipt"
                  onPress={() => downloadReceipt(item.receipt_url)}
                  type="clear"
                  buttonStyle={styles.downloadButton}
                  titleStyle={styles.downloadButtonText}
                />
              )}
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
    marginBottom: 10,
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
    margin: 10,
    padding: 15,
    elevation: 2,
  },
  cardTitle: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
  },
  cardContent: {
    marginTop: 10,
  },
  cardText: {
    color: "#555",
    marginVertical: 2,
    fontSize: 16,
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
  labelBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    width: 100,
  },
  labelValue: {
    fontSize: 16,
    color: "#000",
    flex: 1,
    marginLeft: 50,
  },
  editButton: {
    marginTop: 10,
    borderColor: "#0ea5e9",
    borderWidth: 1,
    backgroundColor: "#e0f2fe",
  },
  editButtonText: {
    color: "#0ea5e9",
  },
  deleteButton: {
    marginTop: 10,
    borderColor: "#FF0000",
    borderWidth: 1,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#FF0000",
  },
  downloadButton: {
    marginTop: 10,
    borderColor: "#673AB7",
    borderWidth: 1,
    backgroundColor: "#e8eaf6",
  },
  downloadButtonText: {
    color: "#673AB7",
  },
});
