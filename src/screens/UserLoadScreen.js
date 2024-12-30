import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Linking, Text, TouchableOpacity } from 'react-native';
import { Card, Button } from 'react-native-elements';
import { supabase } from '../services/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';

// Placeholder function for geocoding
const geocodeAddress = async (address) => {
  // Implement geocoding logic here
  // For now, returning dummy coordinates
  if (address === 'Kanpur') {
    return { latitude: 26.4499, longitude: 80.3319 };
  } else if (address === 'Delhi') {
    return { latitude: 28.7041, longitude: 77.1025 };
  }
  return { latitude: 20.5937, longitude: 78.9629 }; // Default to India
};

export default function UserLoadScreen() {
  const [loads, setLoads] = useState([]);
  const [selectedLoad, setSelectedLoad] = useState(null);

  useEffect(() => {
    fetchLoads();
  }, []);

  async function fetchLoads() {
    try {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoads(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleUploadReceipt(loadId) {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const fileExt = file.uri.substring(file.uri.lastIndexOf('.') + 1);
        const fileName = `${loadId}-${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file.uri, {
            cacheControl: '3600',
            contentType: `image/${fileExt}`,
          });

        if (uploadError) throw uploadError;

        // Update load with receipt URL
        const { error: updateError } = await supabase
          .from('loads')
          .update({ receipt_url: filePath })
          .eq('id', loadId);

        if (updateError) throw updateError;

        Alert.alert('Success', 'Receipt uploaded successfully!');
        fetchLoads();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderMap = async (item) => {
    if (selectedLoad?.id === item.id) {
      return (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 20.5937,  // Default coordinates for India
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
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={loads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Card.Title>{item.current_location}- {item.destination}</Card.Title>
            <Card.Divider />
            <View style={styles.cardContent}>
              <Text style={styles.label}>From: {item.current_location}</Text>
              <Text style={styles.label}>To: {item.destination}</Text>
              <Text style={styles.label}>Weight: {item.weight} tons</Text>
              <Text style={styles.label}>Truck Length: {item.truck_length} ft</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleCall(item.contact_number)}
                >
                  <Text style={styles.buttonText}>Call Contact</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleEmail(item.contact_email)}
                >
                  <Text style={styles.buttonText}>Email Contact</Text>
                </TouchableOpacity>
              </View>

              <Button
                title={item.receipt_url ? "Update Receipt" : "Upload Receipt"}
                onPress={() => handleUploadReceipt(item.id)}
                buttonStyle={styles.uploadButton}
              />

              <Button
                title={selectedLoad?.id === item.id ? "Hide Map" : "Show Map"}
                onPress={() => setSelectedLoad(selectedLoad?.id === item.id ? null : item)}
                type="outline"
                buttonStyle={styles.mapButton}
              />

              {renderMap(item)}

              {item.receipt_url && (
                <Text style={styles.receiptUploaded}>
                  Receipt uploaded ✓
                </Text>
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
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  cardContent: {
    padding: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  contactButton: {
    backgroundColor: '#2089dc',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadButton: {
    marginVertical: 10,
    backgroundColor: '#FF0000',
  },
  mapButton: {
    marginVertical: 10,
  },
  mapContainer: {
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  receiptUploaded: {
    color: '#28a745',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  }
});
