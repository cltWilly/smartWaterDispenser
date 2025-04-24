import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { DeviceContext } from '../DeviceContext';
import { ScrollView } from 'react-native-gesture-handler';

const screenWidth = Dimensions.get('window').width;

function HistoryScreen() {
  const [timeRange, setTimeRange] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  type ChartData = {
    labels: string[];
    datasets: { data: number[]; color: () => string; strokeWidth: number }[];
    legend: string[];
  };
  
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [lastUpdated, setLastUpdated] = useState('N/A');
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    highest: 0,
    date: '',
  });

  const deviceContext = useContext(DeviceContext);

  if (!deviceContext) {
    throw new Error('DeviceContext is not provided. Make sure to wrap your component with DeviceContext.Provider.');
  }

  const { selectedDevice } = deviceContext;

  // Environmental sensing service and characteristics UUIDs
  const ENVIRONMENTAL_SENSING_SERVICE_UUID = '181A';
  const HISTORY_CHARACTERISTIC_UUID = '2A87';
  const COMMAND_CHARACTERISTIC_UUID = '2A3D';

  // Function to convert raw sensor values to liters
  const sensorToLiters = (sensorValue: number) => {
    // const normalized = Math.max(0, (2000 - sensorValue) / 10);
    // return parseFloat(normalized.toFixed(1));
    return sensorValue;
  };

  useEffect(() => {
    if (selectedDevice) {
      fetchHistoryData();
    }
  }, [selectedDevice, timeRange]);

  const fetchHistoryData = async () => {
    if (!selectedDevice) {
      Alert.alert('Error', 'No device connected. Please connect a device to view history.');
      return;
    }

    setIsLoading(true);

    try {
      // Determine how many entries to request based on timeRange
      let entriesToRequest = 24; // Default for daily (24 hours)
      if (timeRange === 'weekly') entriesToRequest = 7 * 24; // 7 days
      if (timeRange === 'monthly') entriesToRequest = 30 * 24; // 30 days

      // Send command to request history data
      await selectedDevice.writeCharacteristicWithResponseForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        btoa(`GET_HISTORY_DATA`)
      );

      // Wait a moment for the device to process the command
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Subscribe to history data updates
      const characteristic = await selectedDevice.readCharacteristicForService(
        ENVIRONMENTAL_SENSING_SERVICE_UUID,
        HISTORY_CHARACTERISTIC_UUID
      );
      
      if (characteristic?.value) {
        const decoded = atob(characteristic.value);
        console.log('Received history data:', decoded);
        const historyValues = decoded.split(',').map(Number);
        const processedData = processHistoryData(historyValues);
        setChartData(processedData);
        setLastUpdated(new Date().toLocaleTimeString());
      }
      setIsLoading(false);
    } catch (error) {
      console.log('Error fetching history data:', error);
      Alert.alert('Error', 'Failed to fetch history data.');
      setIsLoading(false);
    }
  };

  const processHistoryData = (historyValues: number[]) => {
    if (!historyValues || historyValues.length === 0) {
      Alert.alert('Error', 'No history data available from the device.');
      return {
        labels: [],
        datasets: [{ data: [], color: () => '#4a90e2', strokeWidth: 2 }],
        legend: ['Sensor Value'],
      };
    }
  
    const literValues = historyValues.map(sensorToLiters);
  
    let labels: string[] = [];
    let data: number[] = [];
  
    if (timeRange === 'daily') {
      const hours = Math.min(24, literValues.length);
      for (let i = 0; i < hours; i++) {
        const labelHour = 23 - i;
        labels.push(i % 2 === 0 ? `${labelHour}h` : ''); // Label only every 2 hours
        data.push(literValues[i]);
      }
      labels = labels.reverse();
      data = data.reverse();
    } else if (timeRange === 'weekly') {
      const days = Math.min(7, Math.ceil(literValues.length / 24)); // Use the available number of days
      for (let i = 0; i < days; i++) {
        labels.push(`Day ${days - i}`);
        let daySum = 0;
        for (let j = 0; j < 24 && i * 24 + j < literValues.length; j++) {
          daySum += literValues[i * 24 + j];
        }
        data.push(parseFloat((daySum / 24).toFixed(1))); // Average for the day
      }
      labels = labels.reverse();
      data = data.reverse();
    } else if (timeRange === 'monthly') {
      const weeks = Math.min(4, Math.ceil(literValues.length / (24 * 7))); // Use the available number of weeks
      for (let i = 0; i < weeks; i++) {
        labels.push(`Week ${weeks - i}`);
        let weekSum = 0;
        for (let j = 0; j < 7 * 24 && i * 7 * 24 + j < literValues.length; j++) {
          weekSum += literValues[i * 7 * 24 + j];
        }
        data.push(parseFloat((weekSum / (7 * 24)).toFixed(1))); // Average for the week
      }
      labels = labels.reverse();
      data = data.reverse();
    }
  
    const total = data.reduce((sum, value) => sum + value, 0);
    const average = data.length > 0 ? total / data.length : 0;
    const highest = data.length > 0 ? Math.max(...data) : 0;
  
    setStats({
      total: parseFloat(total.toFixed(1)),
      average: parseFloat(average.toFixed(1)),
      highest: parseFloat(highest.toFixed(1)),
      date: new Date().toLocaleDateString(),
    });
  
    return {
      labels,
      datasets: [{ data, color: () => '#4a90e2', strokeWidth: 2 }],
      legend: ['Sensor Value'],
    };
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: '#4a90e2' },
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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="calendar-alt" size={24} color="#4a90e2" />
          <Text style={styles.cardTitle}>Time Range</Text>
        </View>
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === 'daily' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('daily')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'daily' && styles.timeRangeTextActive]}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === 'weekly' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('weekly')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'weekly' && styles.timeRangeTextActive]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeRangeButton, timeRange === 'monthly' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('monthly')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'monthly' && styles.timeRangeTextActive]}>Monthly</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="chart-line" size={24} color="#4a90e2" />
          <Text style={styles.cardTitle}>Water Consumption</Text>
        </View>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>Loading history data...</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData || { labels: [], datasets: [{ data: [] }] }}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Updated:</Text>
              <Text style={styles.value}>{lastUpdated}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="tachometer-alt" size={24} color="#4a90e2" />
          <Text style={styles.cardTitle}>Statistics</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.average}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.highest}</Text>
            <Text style={styles.statLabel}>Highest</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchHistoryData}>
          <Icon name="sync" size={18} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh Data</Text>
        </TouchableOpacity>
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
    paddingVertical: 16,
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
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    height: 200,
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
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    width: '100%',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
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
    marginBottom: 16,
  },
  notConnectedSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default HistoryScreen;