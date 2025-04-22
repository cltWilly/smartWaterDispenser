import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Dimensions
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DeviceContext } from '../DeviceContext';

import { PermissionsAndroid, Platform } from 'react-native';

const screenWidth = Dimensions.get('window').width;

// BLE UUIDs from your ESP32 code
const ENVIRONMENTAL_SENSING_SERVICE_UUID = '181A';
const SENSOR_DATA_CHARACTERISTIC_UUID = '2A6E';
const COMMAND_CHARACTERISTIC_UUID = '2A3D';

const bleManager = new BleManager();

// Home Screen Component
function ScanScreen() {
  const [status, setStatus] = useState('Offline');
  const [deviceId, setDeviceId] = useState('Not connected');
  const [lastUpdated, setLastUpdated] = useState('N/A');
  const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sensorValue, setSensorValue] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const deviceContext = useContext(DeviceContext);

  if (!deviceContext) {
    throw new Error('DeviceContext is not provided. Ensure it is wrapped in a DeviceContext.Provider.');
  }

const { selectedDevice, setSelectedDevice } = deviceContext;

  useEffect(() => {
    // Request necessary permissions for BLE on mount
    requestPermissions();

    // Setup event listener for BLE state changes
    const subscription = bleManager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        console.log('Bluetooth is powered on');
      }
    }, true);

    return () => {
      // Clean up on unmount
      subscription.remove();
      if (selectedDevice) {
        disconnectFromDevice();
      }
    };
  }, []);

  // Subscribe to notifications when device is connected
  useEffect(() => {
    if (selectedDevice) {
      const subscription = selectedDevice.monitorCharacteristicForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        SENSOR_DATA_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('Error monitoring characteristic:', error);
            return;
          }
          
          if (characteristic?.value) {
            // Decode base64 value
            const decoded = atob(characteristic.value);
            setSensorValue(decoded);
            setLastUpdated(new Date().toLocaleTimeString());
          }
        }
      );
      
      return () => {
        subscription.remove();
      };
    }
  }, [selectedDevice]);

  const requestPermissions = async () => {
    // Request permissions for Android 12 and above
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: 'Bluetooth Scan Permission',
            message: 'This app needs access to your Bluetooth to scan for devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Bluetooth scan permission granted');
        } else {
          console.log('Bluetooth scan permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
    console.log('Requesting BLE permissions');
  };

  const scanForDevices = () => {
    setIsScanning(true);
    setDevices([]);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        setIsScanning(false);
        return;
      }

      // Filter for devices with names starting with "ESP32_"
      if (device && device.name && device.name.startsWith('ESP32_')) {
        setDevices(prevDevices => {
          // Check if device already exists in our array
          if (!prevDevices.find(d => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  interface DeviceItem {
    id: string;
    name?: string;
  }

  const connectToDevice = async (device: DeviceItem): Promise<Device | null> => {
    try {
      const connectedDevice = await bleManager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      setSelectedDevice(connectedDevice);
      setDeviceId(device.name || device.id);
      setStatus('Online');
      
      Alert.alert('Connected', `Connected to ${device.name || device.id}`);
      
      return connectedDevice;
    } catch (error) {
      console.log('Connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the device');
      return null;
    }
  };

  const disconnectFromDevice = async () => {
    if (selectedDevice) {
      try {
        await selectedDevice.cancelConnection();
        setSelectedDevice(null);
        setStatus('Offline');
        setDeviceId('Not connected');
        setLastUpdated('N/A');
        setSensorValue(null);
        
        Alert.alert('Disconnected', 'Device has been disconnected');
      } catch (error) {
        console.log('Disconnect error:', error);
        Alert.alert('Disconnect Error', 'Failed to disconnect from the device');
      }
    }
  };

  const sendCommand = async (command: string) => {
    if (!selectedDevice) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    try {
      // Convert string to base64 encoding
      const base64Command = btoa(command);
      
      await selectedDevice.writeCharacteristicWithResponseForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        base64Command
      );
      
      console.log('Command sent:', command);
    } catch (error) {
      console.log('Error sending command:', error);
      Alert.alert('Command Error', 'Failed to send command to device');
    }
  };

  const renderDeviceItem = ({ item }: { item: DeviceItem }) => (
    <TouchableOpacity 
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
      <Text style={styles.deviceId}>ID: {item.id}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Icon name="water" size={24} color="#4a90e2" />
          <Text style={styles.headerText}>Device Information</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, 
              { backgroundColor: status === 'Online' ? '#4cd964' : '#ff3b30' }]} />
            <Text style={styles.value}>{status}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Device ID:</Text>
          <Text style={styles.value}>{deviceId}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>{lastUpdated}</Text>
        </View>

        {sensorValue && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sensor Value:</Text>
            <Text style={styles.value}>{sensorValue}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.scanButton}
          onPress={isScanning ? undefined : scanForDevices}
          disabled={isScanning}
        >
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>Scanning...</Text>
            </View>
          ) : (
            <View style={styles.scanningContainer}>
              <Icon name="magnify" size={24} color="#fff" />
              <Text style={styles.buttonText}>Scan</Text>
            </View>
          )}
        </TouchableOpacity>

        {devices.length > 0 && (
          <FlatList
            data={devices.map(device => ({ id: device.id, name: device.name || undefined }))}
            renderItem={renderDeviceItem}
            keyExtractor={item => item.id}
            style={styles.deviceList}
          />
        )}

        {selectedDevice && (
          <View>
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={disconnectFromDevice}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
            
            {/* Example command buttons */}
            <View style={styles.commandRow}>
              <TouchableOpacity 
                style={styles.commandButton}
                onPress={() => sendCommand('PUMP_ON')}
              >
                <Text style={styles.commandText}>Pump On</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.commandButton}
                onPress={() => sendCommand('PUMP_OFF')}
              >
                <Text style={styles.commandText}>Pump Off</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#f0f4f8',
    },
    titleBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e1e4e8',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
    },
    connectButton: {
      backgroundColor: '#ff6b6b',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    connectButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#f0f4f8',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
      color: '#333',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e1e4e8',
    },
    label: {
      fontSize: 16,
      color: '#666',
    },
    value: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    scanButton: {
      backgroundColor: '#4a90e2',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    scanningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
      marginLeft: 8,
    },
    deviceList: {
      marginTop: 16,
      maxHeight: 200,
    },
    deviceItem: {
      backgroundColor: '#f0f4f8',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    deviceId: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    disconnectButton: {
      backgroundColor: '#ff3b30',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    commandRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    commandButton: {
      backgroundColor: '#5ac8fa',
      borderRadius: 8,
      padding: 10,
      flex: 1,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    commandText: {
      color: '#fff',
      fontWeight: '500',
    },
    screenContainer: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    timeRangeSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      backgroundColor: '#f0f4f8',
      borderRadius: 8,
      padding: 4,
    },
    timeRangeButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    timeRangeButtonActive: {
      backgroundColor: '#4a90e2',
    },
    timeRangeText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666',
    },
    timeRangeTextActive: {
      color: '#fff',
    },
    loadingContainer: {
      height: 300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#666',
    },
    chartContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      padding: 16,
      backgroundColor: '#f9fbfd',
      borderRadius: 8,
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#4a90e2',
    },
    detailsContainer: {
      marginBottom: 16,
    },
    detailsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
    },
    detailsContent: {
      backgroundColor: '#f9fbfd',
      borderRadius: 8,
      padding: 16,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: '#666',
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
    },
    refreshButton: {
      backgroundColor: '#4a90e2',
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    refreshButtonText: {
      color: '#fff',
      fontWeight: '600',
      marginLeft: 8,
    },
  
    notConnectedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    notConnectedText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
  
  });
  
  export default ScanScreen;