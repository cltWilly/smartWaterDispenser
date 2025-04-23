import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/FontAwesome5';

const screenWidth = Dimensions.get('window').width;

const mockHistoryData = {
    daily: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [2.1, 1.8, 2.3, 1.9, 2.5, 1.7, 2.2],
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Liters']
    },
    weekly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          data: [14.3, 12.7, 15.9, 13.4],
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Liters']
    },
    monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [52.3, 48.7, 57.2, 54.1, 61.5, 58.9],
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Liters']
    }
  };
  
  // History Screen Component
  function HistoryScreen() {
  
  
    
    const [timeRange, setTimeRange] = useState<keyof typeof mockHistoryData>('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState(mockHistoryData.daily);
    const [stats, setStats] = useState({
      total: 0,
      average: 0,
      highest: 0,
      date: ''
    });
  
    // Simulate loading data from EEPROM
    useEffect(() => {
      setIsLoading(true);
      
      // Simulate a network delay
      const timer = setTimeout(() => {
        setChartData(mockHistoryData[timeRange]);
        
        // Calculate stats based on the current dataset
        const dataPoints = mockHistoryData[timeRange].datasets[0].data;
        const total = dataPoints.reduce((sum, value) => sum + value, 0);
        const average = total / dataPoints.length;
        const highest = Math.max(...dataPoints);
        
        setStats({
          total: parseFloat(total.toFixed(1)),
          average: parseFloat(average.toFixed(1)),
          highest: parseFloat(highest.toFixed(1)),
          date: new Date().toLocaleDateString()
        });
        
        setIsLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }, [timeRange]);
  
    const chartConfig = {
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#4a90e2'
      }
    };
  
    return (
        <View style={styles.card}>
          {/* <View style={styles.headerRow}>
            <Icon name="chart-line" size={24} color="#4a90e2" />
            <Text style={styles.headerText}>Water Consumption History</Text>
          </View> */}
  
          <View style={styles.timeRangeSelector}>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                timeRange === 'daily' && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange('daily')}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === 'daily' && styles.timeRangeTextActive
              ]}>Daily</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                timeRange === 'weekly' && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange('weekly')}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === 'weekly' && styles.timeRangeTextActive
              ]}>Weekly</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                timeRange === 'monthly' && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange('monthly')}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === 'monthly' && styles.timeRangeTextActive
              ]}>Monthly</Text>
            </TouchableOpacity>
          </View>
  
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a90e2" />
              <Text style={styles.loadingText}>Loading history data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.chartContainer}>
                <LineChart
                  data={chartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
  
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{stats.total} L</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Average</Text>
                  <Text style={styles.statValue}>{stats.average} L</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Highest</Text>
                  <Text style={styles.statValue}>{stats.highest} L</Text>
                </View>
              </View>
  
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Consumption Details</Text>
                <View style={styles.detailsContent}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Last Updated:</Text>
                    <Text style={styles.detailValue}>{stats.date}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Storage Status:</Text>
                    <Text style={styles.detailValue}>Using simulated data</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Data Source:</Text>
                    <Text style={styles.detailValue}>Local EEPROM (mock)</Text>
                  </View>
                </View>
              </View>
  
              {/* <TouchableOpacity style={styles.refreshButton}>
                <Icon name="refresh" size={18} color="#fff" />
                <Text style={styles.refreshButtonText}>Refresh Data</Text>
              </TouchableOpacity> */}
            </>
          )}
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


export default HistoryScreen;