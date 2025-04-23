import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Alert, TouchableOpacity, Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { DeviceProvider, DeviceContext } from './src/DeviceContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Tab = createBottomTabNavigator();

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DeviceProvider>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Scan') {
                  iconName = 'magnify';
                } else if (route.name === 'Home') {
                  iconName = 'home';
                } else if (route.name === 'History') {
                  iconName = 'history';
                } else if (route.name === 'Settings') {
                  iconName = 'cog';
                }
                return <Icon name={iconName || 'help-circle'} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#4a90e2',
              tabBarInactiveTintColor: 'gray',
            })}
          >
            <Tab.Screen
              name="Scan"
              component={ScanScreen}
            />
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerRight: () => <DisconnectButton />,
              }}
            />
            <Tab.Screen
              name="History"
              component={HistoryScreen}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </DeviceProvider>
    </GestureHandlerRootView>
  );
}

function DisconnectButton() {
  const deviceContext = useContext(DeviceContext);

  if (!deviceContext) {
    throw new Error('DeviceContext is not provided');
  }

  const { selectedDevice, setSelectedDevice } = deviceContext;

  if (!selectedDevice) {
    return null;
  }

  return (
    <TouchableOpacity
      style={{
        marginRight: 10,
        padding: 10,
        backgroundColor: '#ff3b30',
        borderRadius: 5,
      }}
      onPress={() => {
        setSelectedDevice(null);
        Alert.alert('Disconnected', 'Device disconnected successfully.');
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Disconnect</Text>
    </TouchableOpacity>
  );
}

export default App;