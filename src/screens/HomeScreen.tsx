import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { DeviceContext } from '../DeviceContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScrollView } from 'react-native-gesture-handler';

function HomeScreen() {
  const deviceContext = useContext(DeviceContext);
  const [sensorValue, setSensorValue] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('N/A');
  const [isAutoMode, setIsAutoMode] = useState(false);

  if (!deviceContext) {
    throw new Error('DeviceContext is not provided. Make sure to wrap your component with DeviceContext.Provider.');
  }

  const { selectedDevice } = deviceContext;

  // Environmental sensing service and characteristics UUIDs
  const ENVIRONMENTAL_SENSING_SERVICE_UUID = '181A';
  const SENSOR_DATA_CHARACTERISTIC_UUID = '2A6E';
  const COMMAND_CHARACTERISTIC_UUID = '2A3D';

  useEffect(() => {
    if (selectedDevice) {
      // Subscribe to sensor data updates
      const subscription = selectedDevice.monitorCharacteristicForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        SENSOR_DATA_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('Error monitoring sensor data:', error);
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
      
      // Check current mode status
      const checkMode = async () => {
        try {
          const characteristic = await selectedDevice.readCharacteristicForService(
            ENVIRONMENTAL_SENSING_SERVICE_UUID,
            COMMAND_CHARACTERISTIC_UUID
          );
          
          if (characteristic?.value) {
            const decoded = atob(characteristic.value);
            setIsAutoMode(decoded === 'AUTO');
          }
        } catch (error) {
          console.log('Error reading mode characteristic:', error);
        }
      };
      
      checkMode();
      
      return () => {
        subscription.remove();
      };
    }
  }, [selectedDevice]);

  const toggleMode = async () => {
    if (!selectedDevice) return;
    
    try {
      const newMode = isAutoMode ? 'MANUAL' : 'AUTO';
      await selectedDevice.writeCharacteristicWithResponseForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        btoa(newMode)
      );
      setIsAutoMode(!isAutoMode);
    } catch (error) {
      console.log('Error toggling mode:', error);
    }
  };

  interface CommandProps {
    command: string;
  }

  const sendCommand = async (command: CommandProps['command']): Promise<void> => {
    if (!selectedDevice) return;
    
    try {
      await selectedDevice.writeCharacteristicWithResponseForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        btoa(command)
      );
      console.log('Command sent:', command);
    } catch (error) {
      console.log('Error sending command:', error);
    }
  };

  if (!selectedDevice) {
    return (
      <View style={styles.notConnectedContainer}>
        <Icon name="water-alert" size={64} color="#ff6b6b" />
        <Text style={styles.notConnectedTitle}>Device Not Connected</Text>
        <Text style={styles.notConnectedText}>
          Go to the "Scan" tab to connect to your water monitoring device.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Device Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="information-outline" size={24} color="#4a90e2" />
          <Text style={styles.cardTitle}>Device Information</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: selectedDevice ? '#4cd964' : '#ff3b30' }]} />
            <Text style={styles.value}>{selectedDevice ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Device ID:</Text>
          <Text style={styles.value}>{selectedDevice.name || selectedDevice.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>{lastUpdated}</Text>
        </View>
      </View>

      {/* Sensor Data Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="water-percent" size={24} color="#4a90e2" />
          <Text style={styles.cardTitle}>Sensor Data</Text>
        </View>
        
        <View style={styles.sensorContainer}>
          <Text style={styles.sensorValue}>{sensorValue || 'No data'}</Text>
          <Text style={styles.sensorLabel}>Water Level</Text>
        </View>
      </View>

      {/* Mode Control Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="cog-outline" size={24} color="#4a90e2" />
          <Text style={styles.cardTitle}>Control Panel</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Operation Mode:</Text>
          <View style={styles.modeContainer}>
            <Text style={styles.value}>{isAutoMode ? 'Automatic' : 'Manual'}</Text>
            <TouchableOpacity 
              style={[styles.modeToggle, isAutoMode ? styles.modeToggleActive : null]} 
              onPress={toggleMode}
            >
              <View style={[styles.toggleHandle, isAutoMode ? styles.toggleHandleActive : null]} />
            </TouchableOpacity>
          </View>
        </View>
        
        {!isAutoMode && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => sendCommand('PUMP_ON')}
            >
              <Icon name="power" size={20} color="#fff" />
              <Text style={styles.controlButtonText}>Pump On</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.controlButtonOff]}
              onPress={() => sendCommand('PUMP_OFF')}
            >
              <Icon name="power-off" size={20} color="#fff" />
              <Text style={styles.controlButtonText}>Pump Off</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  contentContainer: {
    paddingVertical: 16, // Add consistent padding at top and bottom
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
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
  sensorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  sensorValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 8,
  },
  sensorLabel: {
    fontSize: 16,
    color: '#666',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeToggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e1e4e8',
    padding: 2,
    marginLeft: 10,
  },
  modeToggleActive: {
    backgroundColor: '#4cd964',
  },
  toggleHandle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  toggleHandleActive: {
    transform: [{ translateX: 24 }],
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  controlButton: {
    backgroundColor: '#4cd964',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  controlButtonOff: {
    backgroundColor: '#ff3b30',
    marginRight: 0,
    marginLeft: 8,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f4f8',
  },
  notConnectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  notConnectedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default HomeScreen;