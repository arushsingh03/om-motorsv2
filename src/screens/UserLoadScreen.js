import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Linking,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { Card, Button } from "react-native-elements";
import { supabase } from "../services/supabaseClient";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker } from "react-native-maps";
import moment from "moment";

const geocodeAddress = async (address) => {
  if (address === "Kanpur") {
    return { latitude: 26.4499, longitude: 80.3319 };
  } else if (address === "Delhi") {
    return { latitude: 28.7041, longitude: 77.1025 };
  }
  return { latitude: 20.5937, longitude: 78.9629 };
};

export default function UserLoadScreen() {
  const [loads, setLoads] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLoads();
  }, []);

  async function fetchLoads() {
    try {
      const currentDate = moment().format("YYYY-MM-DD");
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const filteredLoads = data.filter(
        (load) => moment(load.created_at).format("YYYY-MM-DD") === currentDate
      );

      setLoads(filteredLoads);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  async function handleUploadReceipt(loadId) {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access your photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const fileExt = file.uri.substring(file.uri.lastIndexOf(".") + 1);
        const fileName = `${loadId}-${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, file.uri, {
            cacheControl: "3600",
            contentType: `image/${fileExt}`,
          });

        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase
          .from("loads")
          .update({ receipt_url: filePath })
          .eq("id", loadId);

        if (updateError) throw updateError;

        Alert.alert("Success", "Receipt uploaded successfully!");
        fetchLoads();
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const downloadReceipt = async (receiptUrl) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receiptUrl, 3600); // Creates a signed URL valid for 1 hour

      if (error) throw error;

      console.log("Signed URL:", data.signedUrl); // Log the signed URL for debugging
      Linking.openURL(data.signedUrl); // Open the URL in the browser to download the receipt
    } catch (error) {
      console.error("Error downloading receipt:", error);
      Alert.alert(
        "Error",
        "Could not download receipt. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderMap = async (item) => {
    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 20.5937,
            longitude: 78.9629,
            latitudeDelta: 10,
            longitudeDelta: 10,
          }}
        >
          <Marker
            coordinate={await geocodeAddress(item.current_location)}
            title="Current Location"
            description={item.current_location}
          />
          <Marker
            coordinate={await geocodeAddress(item.destination)}
            title="Destination"
            description={item.destination}
            pinColor="blue"
          />
        </MapView>
      </View>
    );
  };

  const renderReceiptActions = (item) => (
    <View style={styles.receiptContainer}>
      <Button
        title={item.receipt_url ? "Update Receipt" : "Upload Receipt"}
        onPress={() => handleUploadReceipt(item.id)}
        buttonStyle={[styles.uploadButton, { flex: 1 }]}
      />
      {item.receipt_url && (
        <Button
          title="Download Receipt"
          onPress={() => downloadReceipt(item.receipt_url)}
          buttonStyle={[styles.viewButton, { flex: 1 }]}
        />
      )}
    </View>
  );

  const renderLoadDetails = (item) => (
    <View style={styles.infoSection}>
      <View style={styles.infoRow}>
        <Text style={styles.labelBold}>Date:</Text>
        <Text style={styles.labelValue}>
          {moment(item.created_at).format("DD/MM/YYYY")}
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
        <Text style={styles.labelValue}>{item.weight} tons</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.labelBold}>Truck Length:</Text>
        <Text style={styles.labelValue}>{item.truck_length} ft</Text>
      </View>
    </View>
  );

  const renderContactButtons = (item) => (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.contactButton, { backgroundColor: "#2196F3" }]}
        onPress={() => handleCall(item.contact_number)}
      >
        <Text style={styles.buttonText}>Call</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.contactButton, { backgroundColor: "#2196F3" }]}
        onPress={() => handleEmail(item.contact_email)}
      >
        <Text style={styles.buttonText}>Email</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      {renderMap(item)}
      <Card containerStyle={styles.cardContainer}>
        <Card.Title style={styles.cardTitle}>
          {item.current_location} - {item.destination}
        </Card.Title>
        <Card.Divider />
        <View style={styles.cardContent}>
          {renderLoadDetails(item)}
          {renderContactButtons(item)}
          {renderReceiptActions(item)}
          {item.receipt_url && (
            <Text style={styles.receiptUploaded}>Receipt uploaded ✓</Text>
          )}
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedReceipt(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading receipt...</Text>
              </View>
            ) : selectedReceipt ? (
              <Image
                source={{ uri: selectedReceipt }}
                style={styles.receiptImage}
                resizeMode="contain"
                onError={(e) => {
                  console.error("Image loading error:", e.nativeEvent.error);
                  Alert.alert("Error", "Failed to load receipt image");
                  setModalVisible(false);
                  setSelectedReceipt(null);
                }}
              />
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>No receipt available</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedReceipt(null);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 10,
  },
  itemContainer: {
    marginBottom: 20,
  },
  cardContainer: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 15,
    marginHorizontal: 15,
    backgroundColor: "#fff",
  },
  cardTitle: {
    fontSize: 20,
    color: "#000",
    fontWeight: "bold",
  },
  cardContent: {
    padding: 10,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    width: 100,
  },
  labelValue: {
    fontSize: 18,
    color: "#000",
    flex: 1,
    marginLeft: 70,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  contactButton: {
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  receiptContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  uploadButton: {
    backgroundColor: "#FF0000",
    borderRadius: 8,
    padding: 12,
  },
  viewButton: {
    backgroundColor: "#673AB7",
    borderRadius: 8,
    padding: 12,
  },
  receiptUploaded: {
    color: "#28a745",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
  mapContainer: {
    height: 300,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxHeight: "90%",
    alignItems: "center",
  },
  receiptImage: {
    width: "100%",
    height: 400,
    borderRadius: 8,
  },
  loadingContainer: {
    height: 400,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    width: "100%",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
