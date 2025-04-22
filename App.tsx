import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { DeviceProvider } from './src/DeviceContext';

const Tab = createBottomTabNavigator();

function App() {
  return (
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
          <Tab.Screen name="Scan" component={ScanScreen} />
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </DeviceProvider>
  );
}

export default App;