import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeviceContext } from '../DeviceContext';

function HomeScreen() {
  const deviceContext = useContext(DeviceContext);

  if (!deviceContext) {
    throw new Error('DeviceContext is not provided. Make sure to wrap your component with DeviceContext.Provider.');
  }

  const { selectedDevice } = deviceContext;

  return (
    <View style={styles.screenContainer}>
      {!selectedDevice ? (
        <View style={styles.notConnectedContainer}>
          <Text style={styles.notConnectedText}>
            It seems the device is not connected, go to "Scan" and scan for the device.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.screenTitle}>Home</Text>
          <Text>Connected to: {selectedDevice.name || selectedDevice.id}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default HomeScreen;