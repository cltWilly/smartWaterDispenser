import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { DeviceContext } from '../DeviceContext';

function SettingsScreen() {
  const [maxLevel, setMaxLevel] = useState<string>('');
  const [minLevel, setMinLevel] = useState<string>('');
  const [currentMaxLevel, setCurrentMaxLevel] = useState<string>('--');
  const [currentMinLevel, setCurrentMinLevel] = useState<string>('--');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const deviceContext = useContext(DeviceContext);

  if (!deviceContext) {
    throw new Error('DeviceContext is not provided. Make sure to wrap your component with DeviceContext.Provider.');
  }

  const { selectedDevice } = deviceContext;

  // UUIDs for the BLE service and characteristics
  const ENVIRONMENTAL_SENSING_SERVICE_UUID = '181A';
  const COMMAND_CHARACTERISTIC_UUID = '2A3D';
  const MAX_LEVEL_CHARACTERISTIC_UUID = '2A3E';
  const MIN_LEVEL_CHARACTERISTIC_UUID = '2A3F';

  // Load the current values when the component mounts or when the device changes
  useEffect(() => {
    if (selectedDevice) {
      fetchLevelValues();
    }
  }, [selectedDevice]);

  const fetchLevelValues = async () => {
    if (!selectedDevice) return;
    
    setIsLoading(true);
    
    try {
      // Read the current max level value from the device
      const maxLevelData = await selectedDevice.readCharacteristicForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        MAX_LEVEL_CHARACTERISTIC_UUID
      );
      
      // Read the current min level value from the device
      const minLevelData = await selectedDevice.readCharacteristicForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        MIN_LEVEL_CHARACTERISTIC_UUID
      );

      // Convert the Base64 encoded values to strings
      if (maxLevelData?.value) {
        const maxValue = atob(maxLevelData.value);
        setCurrentMaxLevel(maxValue);
      }
      
      if (minLevelData?.value) {
        const minValue = atob(minLevelData.value);
        setCurrentMinLevel(minValue);
      }
      
      console.log('Successfully read level values:', { maxLevel: currentMaxLevel, minLevel: currentMinLevel });
    } catch (error) {
      console.error('Error fetching level values:', error);
      Alert.alert('Error', 'Failed to read current level values from the device');
    } finally {
      setIsLoading(false);
    }
  };

  // check if the device is still connected
  useEffect(() => {
    const checkDeviceConnection = async () => {
      if (selectedDevice) {
        const isConnected = await selectedDevice.isConnected();
        if (!isConnected) {
          Alert.alert('Disconnected', 'The device is no longer connected. Please reconnect.');
        }
      }
    };

    const interval = setInterval(checkDeviceConnection, 3000); 
    return () => clearInterval(interval); 
  }, [selectedDevice]);

  const sendMaxLevelCommand = async () => {
    if (!selectedDevice) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    if (!maxLevel || isNaN(Number(maxLevel))) {
      Alert.alert('Error', 'Please enter a valid number for the maximum level');
      return;
    }

    setIsLoading(true);
    
    try {
      const command = `SET_MAX_LEVEL:${maxLevel}`;
      const base64Command = btoa(command);

      await selectedDevice.writeCharacteristicWithResponseForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        base64Command
      );

      // Wait a bit for the device to process the command
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Read the updated value back
      await fetchLevelValues();
      
      Alert.alert('Success', `Maximum level set to ${maxLevel}`);
      setMaxLevel(''); // Clear the input field
    } catch (error) {
      console.error('Error sending command:', error);
      Alert.alert('Error', 'Failed to send the maximum level command');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMinLevelCommand = async () => {
    if (!selectedDevice) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    if (!minLevel || isNaN(Number(minLevel))) {
      Alert.alert('Error', 'Please enter a valid number for the minimum level');
      return;
    }

    setIsLoading(true);
    
    try {
      const command = `SET_MIN_LEVEL:${minLevel}`;
      const base64Command = btoa(command);

      await selectedDevice.writeCharacteristicWithResponseForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        base64Command
      );

      // Wait a bit for the device to process the command
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Read the updated value back
      await fetchLevelValues();
      
      Alert.alert('Success', `Minimum level set to ${minLevel}`);
      setMinLevel(''); // Clear the input field
    } catch (error) {
      console.error('Error sending command:', error);
      Alert.alert('Error', 'Failed to send the minimum level command');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshValues = () => {
    fetchLevelValues();
  };

  return (
    <View style={styles.screenContainer}>
      {/* <Text style={styles.screenTitle}>Water Level Settings</Text> */}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {/* Max Level Section */}
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>MAX_LEVEL (Current: {currentMaxLevel})</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter new value"
                keyboardType="numeric"
                value={maxLevel}
                onChangeText={setMaxLevel}
              />
              <TouchableOpacity style={styles.updateButton} onPress={sendMaxLevelCommand}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Min Level Section */}
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>MIN_LEVEL (Current: {currentMinLevel})</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter new value"
                keyboardType="numeric"
                value={minLevel}
                onChangeText={setMinLevel}
              />
              <TouchableOpacity style={styles.updateButton} onPress={sendMinLevelCommand}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.refreshButton} onPress={refreshValues}>
            <Text style={styles.refreshButtonText}>Refresh Values</Text>
          </TouchableOpacity>
        </>
      )}
      
      {!selectedDevice && (
        <Text style={styles.warningText}>
          No device connected. Please connect a device to change settings.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  settingContainer: {
    marginBottom: 25,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  updateButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
    height: 45,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  refreshButtonText: {
    color: '#4a4a4a',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4a4a4a',
  },
  warningText: {
    color: 'orange',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

export default SettingsScreen;