import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Linking,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Button, Input, Card, Text } from "react-native-elements";
import { Picker } from "@react-native-picker/picker";
import moment from "moment";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function AdminLoadScreen() {
  const [loads, setLoads] = useState([]);
  const [filteredLoads, setFilteredLoads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(moment().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [newLoad, setNewLoad] = useState({
    current_location: "",
    destination: "",
    weight: "",
    weight_unit: "kg",
    truck_length: "",
    truck_length_unit: "ft",
    contact_number: "",
    contact_email: "",
  });
  const [editingLoad, setEditingLoad] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);

  useEffect(() => {
    fetchLoads();
  }, []);

  useEffect(() => {
    filterLoads();
  }, [loads, searchQuery, startDate, endDate]);

  async function fetchLoads() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoads(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  const filterLoads = () => {
    let filtered = loads;

    // Filter by date range
    filtered = filtered.filter((load) => {
      const loadDate = moment(load.created_at).format("YYYY-MM-DD");
      return loadDate >= startDate && loadDate <= endDate;
    });

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (load) =>
          load.current_location.toLowerCase().includes(query) ||
          load.destination.toLowerCase().includes(query) ||
          load.contact_number.includes(query) ||
          load.contact_email.toLowerCase().includes(query)
      );
    }

    setFilteredLoads(filtered);
  };

  async function handleAddOrEditLoad() {
    try {
      setLoading(true);

      // Validate input fields
      if (
        !newLoad.current_location ||
        !newLoad.destination ||
        !newLoad.weight ||
        !newLoad.truck_length ||
        !newLoad.contact_number ||
        !newLoad.contact_email
      ) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

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

      await fetchLoads();
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
      truck_length_unit: "ft",
      contact_number: "",
      contact_email: "",
    });
    setEditingLoad(null);
    setShowForm(false);
  }

  async function handleDeleteLoad(id) {
    try {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this load?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              setLoading(true);
              const { error } = await supabase
                .from("loads")
                .delete()
                .eq("id", id);
              if (error) throw error;
              Alert.alert("Success", "Load deleted successfully!");
              await fetchLoads();
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  const downloadReceipt = async (receiptUrl) => {
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receiptUrl, 3600); // Creates a signed URL valid for 1 hour

      if (error) throw error;

      Linking.openURL(data.signedUrl);
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
          keyboardType="numeric"
          inputStyle={styles.inputText}
          containerStyle={styles.measurementInput}
          placeholderTextColor="#666"
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

  const showStartDatePicker = () => {
    setStartDatePickerVisibility(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisibility(false);
  };

  const handleStartDateConfirm = (date) => {
    setStartDate(moment(date).format("YYYY-MM-DD"));
    hideStartDatePicker();
  };

  const showEndDatePicker = () => {
    setEndDatePickerVisibility(true);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisibility(false);
  };

  const handleEndDateConfirm = (date) => {
    setEndDate(moment(date).format("YYYY-MM-DD"));
    hideEndDatePicker();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <Button
          title="Filter"
          onPress={() => setShowSearch(!showSearch)}
          buttonStyle={styles.filterButton}
          containerStyle={styles.filterButtonContainer}
          icon={{ name: "filter", type: "font-awesome", color: "white" }}
        />
        {showSearch && (
          <>
            <Input
              placeholder="Search location or contact details..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              inputStyle={styles.inputText}
              containerStyle={styles.searchInput}
              leftIcon={{ type: "font-awesome", name: "search", color: "#666" }}
            />
            <TouchableOpacity onPress={showStartDatePicker} style={styles.datePickerButton}>
              <Input
                placeholder="Start Date (YYYY-MM-DD)"
                value={startDate}
                editable={false}
                inputStyle={styles.inputText}
                containerStyle={styles.searchInput}
                leftIcon={{
                  type: "font-awesome",
                  name: "calendar",
                  color: "#666",
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={showEndDatePicker} style={styles.datePickerButton}>
              <Input
                placeholder="End Date (YYYY-MM-DD)"
                value={endDate}
                editable={false}
                inputStyle={styles.inputText}
                containerStyle={styles.searchInput}
                leftIcon={{
                  type: "font-awesome",
                  name: "calendar",
                  color: "#666",
                }}
              />
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isStartDatePickerVisible}
              mode="date"
              onConfirm={handleStartDateConfirm}
              onCancel={hideStartDatePicker}
            />
            <DateTimePickerModal
              isVisible={isEndDatePickerVisible}
              mode="date"
              onConfirm={handleEndDateConfirm}
              onCancel={hideEndDatePicker}
            />
          </>
        )}
      </View>

      {!showForm ? (
        <Button
          title="Add New Load"
          onPress={() => setShowForm(true)}
          buttonStyle={styles.addButton}
          containerStyle={styles.addButtonContainer}
          icon={{ name: "plus", type: "font-awesome", color: "white" }}
        />
      ) : (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {editingLoad ? "Edit Load" : "Add New Load"}
          </Text>

          <Input
            placeholder="Current Location"
            value={newLoad.current_location}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, current_location: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor="#666"
          />

          <Input
            placeholder="Destination"
            value={newLoad.destination}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, destination: value })
            }
            inputStyle={styles.inputText}
            placeholderTextColor="#666"
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
            keyboardType="phone-pad"
            inputStyle={styles.inputText}
            placeholderTextColor="#666"
          />

          <Input
            placeholder="Contact Email"
            value={newLoad.contact_email}
            onChangeText={(value) =>
              setNewLoad({ ...newLoad, contact_email: value })
            }
            keyboardType="email-address"
            autoCapitalize="none"
            inputStyle={styles.inputText}
            placeholderTextColor="#666"
          />

          <Button
            title={editingLoad ? "Update Load" : "Add Load"}
            onPress={handleAddOrEditLoad}
            loading={loading}
            buttonStyle={styles.submitButton}
            icon={{
              name: editingLoad ? "save" : "plus",
              type: "font-awesome",
              color: "white",
            }}
          />

          <Button
            title="Cancel"
            onPress={resetForm}
            type="outline"
            containerStyle={styles.cancelButton}
            titleStyle={styles.cancelButtonText}
            icon={{ name: "times", type: "font-awesome", color: "#000" }}
          />
        </View>
      )}

      <FlatList
        data={filteredLoads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card containerStyle={styles.card}>
            <Card.Title style={styles.cardTitle}>
              {item.current_location} → {item.destination}
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
                    {moment(item.created_at).format("hh:mm A")}
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
                  <Text style={styles.labelBold}>Contact:</Text>
                  <Text style={styles.labelValue}>{item.contact_number}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.labelBold}>Email:</Text>
                  <Text style={styles.labelValue}>{item.contact_email}</Text>
                </View>
              </View>

              <View style={styles.buttonGroup}>
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
                  icon={{
                    name: "edit",
                    type: "font-awesome",
                    color: "#0ea5e9",
                  }}
                />

                <Button
                  title="Delete"
                  onPress={() => handleDeleteLoad(item.id)}
                  type="clear"
                  buttonStyle={styles.deleteButton}
                  titleStyle={styles.deleteButtonText}
                  icon={{
                    name: "trash",
                    type: "font-awesome",
                    color: "#FF0000",
                  }}
                />

                {item.receipt_url && (
                  <Button
                    title="Download"
                    onPress={() => downloadReceipt(item.receipt_url)}
                    type="clear"
                    buttonStyle={styles.downloadButton}
                    titleStyle={styles.downloadButtonText}
                    icon={{
                      name: "download",
                      type: "font-awesome",
                      color: "#22c55e",
                    }}
                  />
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
  },
  searchInput: {
    paddingHorizontal: 0,
    marginBottom: 5,
  },
  resultCount: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#FF0000",
    borderRadius: 25,
  },
  addButtonContainer: {
    margin: 10,
  },
  form: {
    padding: 15,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
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
    color: "#333",
    fontSize: 16,
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
    marginTop: 15,
    borderRadius: 25,
    paddingVertical: 12,
  },
  cancelButton: {
    marginTop: 10,
    borderColor: "#666",
    borderWidth: 1,
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#666",
  },
  card: {
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    margin: 10,
    padding: 15,
    elevation: 3,
    borderWidth: 0,
  },
  cardTitle: {
    color: "#333",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#fecaca",
    borderRadius: 10,
  },
  cardContent: {
    marginTop: 10,
  },
  infoSection: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: "#e2e8f0",
    borderWidth: 1,
    height: 380,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    height: 45,
  },
  labelBold: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    width: 110,
  },
  labelValue: {
    fontSize: 18,
    color: "#000",
    flex: 1,
    marginLeft: 80,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#e0f2fe",
    marginHorizontal: 5,
  },
  editButtonText: {
    color: "#0ea5e9",
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    marginHorizontal: 5,
  },
  deleteButtonText: {
    color: "#FF0000",
    marginLeft: 5,
  },
  downloadButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    marginHorizontal: 5,
  },
  downloadButtonText: {
    color: "#22c55e",
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  filterButton: {
    backgroundColor: "#FF0000",
    borderRadius: 25,
  },
  filterButtonContainer: {
    marginBottom: 10,
  },
  datePickerButton: {
    width: "100%",
  },
});
