import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, getAuthHeaders } from '../services/api';

export default function InsightsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/expenses/insights`, { headers });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to capture analytical data.');
      }
      
      const insightsData = await res.json();
      setData(insightsData);
    } catch (error) {
      Alert.alert('Data Sync Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0d6efd" />
        <Text style={styles.loadingText}>Running Predictive Forecast Engines...</Text>
      </View>
    );
  }

  // Fallback safety shield UI if database contains empty arrays
  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="analytics-outline" size={48} color="#6c757d" />
        <Text style={styles.loadingText}>No current transaction baseline discovered yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d6efd']} />}
    >
      
      {/*  DYNAMIC STATUS CALLOUT BANNER */}
      <View style={[styles.statusBanner, data.is_overshooting ? styles.bannerDanger : styles.bannerSafe]}>
        <View style={styles.bannerHeader}>
          <Ionicons 
            name={data.is_overshooting ? "warning" : "checkmark-circle"} 
            size={24} 
            color={data.is_overshooting ? "#dc3545" : "#198754"} 
          />
          <Text style={[styles.bannerTitle, { color: data.is_overshooting ? "#842029" : "#0f5132" }]}>
            {data.is_overshooting ? "Budget Deficit Warning" : "Financial Pace Healthy"}
          </Text>
        </View>
        <Text style={[styles.bannerBody, { color: data.is_overshooting ? "#842029" : "#0f5132" }]}>
          {data.is_overshooting 
            ? `At your current spending speed, you are on track to overshoot your monthly limit by ${data.overshoot_percentage}%. Consider slowing down variable expenses.`
            : "Excellent! Your daily transaction velocity keeps you safely beneath your designated budget target for this calendar cycle."
          }
        </Text>
      </View>

      {/*  FORECAST METRICS GRID */}
      <Text style={styles.sectionTitle}>Month-End Projections</Text>
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Daily Burn Rate</Text>
          <Text style={styles.metricValue}>Rs. {parseFloat(data.velocity_per_day).toLocaleString()}</Text>
          <Text style={styles.metricSubtext}>Average spent per day</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Projected Total</Text>
          <Text style={[styles.metricValue, data.is_overshooting ? styles.textDanger : styles.textSafe]}>
            Rs. {parseFloat(data.projected_month_end).toLocaleString()}
          </Text>
          <Text style={styles.metricSubtext}>Estimated final expense</Text>
        </View>
      </View>

      {/*  STRUCTURAL PROGRESS INDICATOR BAR */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>Current: Rs. {parseFloat(data.current_month_spending).toLocaleString()}</Text>
          <Text style={styles.progressLabelText}>Limit: Rs. {parseFloat(data.monthly_limit || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${Math.min((data.current_month_spending / (data.monthly_limit || 1)) * 100, 100)}%` }]} />
          {data.is_overshooting && (
            <View style={[styles.progressBarProjectedFill, { width: `${Math.min(((data.projected_month_end - data.current_month_spending) / (data.monthly_limit || 1)) * 100, 100)}%` }]} />
          )}
        </View>
        <Text style={styles.progressHelpText}>Amber expansion line projects trend velocity behavior through month end.</Text>
      </View>

      {/*  ANOMALY DETECTION ALERTS */}
      <Text style={styles.sectionTitle}>Unusual Spending Spikes</Text>
      {!data.anomalies || data.anomalies.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="sparkles-outline" size={32} color="#6c757d" />
          <Text style={styles.emptyCardText}>No dynamic spending anomalies flagged this week. Nice discipline!</Text>
        </View>
      ) : (
        data.anomalies.map((anomaly, index) => (
          <View key={index} style={styles.anomalyCard}>
            <View style={styles.anomalyHeader}>
              <View style={styles.anomalyCategoryBlock}>
                <Ionicons name="trending-up" size={18} color="#dc3545" style={{ marginRight: 6 }} />
                <Text style={styles.anomalyCategoryName}>{anomaly.category_name}</Text>
              </View>
              <View style={styles.anomalyBadge}>
                <Text style={styles.anomalyBadgeText}>+{anomaly.increase_percentage}% Spike</Text>
              </View>
            </View>
            
            <Text style={styles.anomalyDescription}>
              You have spent <Text style={styles.boldText}>Rs. {parseFloat(anomaly.current_week_spent).toLocaleString()}</Text> this week compared to your historical rolling weekly baseline average of Rs. {parseFloat(anomaly.historical_weekly_avg).toLocaleString()}.
            </Text>
          </View>
        ))
      )}

      {/*  MANUAL EXPLICIT BACK NAVIGATION TRIGGER CONTROL LINK */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Return to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6c757d', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#212529', marginTop: 24, marginBottom: 12 },
  boldText: { fontWeight: '700', color: '#212529' },
  
  statusBanner: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  bannerSafe: { backgroundColor: '#d1e7dd', borderColor: '#badbcc' },
  bannerDanger: { backgroundColor: '#f8d7da', borderColor: '#f5c2c7' },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bannerTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  bannerBody: { fontSize: 14, lineHeight: 20 },
  
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metricCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#dee2e6' },
  metricLabel: { fontSize: 13, fontWeight: '600', color: '#6c757d', marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  metricSubtext: { fontSize: 11, color: '#6c757d', marginTop: 4 },
  textSafe: { color: '#198754' },
  textDanger: { color: '#dc3545' },

  progressSection: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#dee2e6', marginTop: 12 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabelText: { fontSize: 12, fontWeight: '600', color: '#495057' },
  progressBarBackground: { height: 12, backgroundColor: '#e9ecef', borderRadius: 6, flexDirection: 'row', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0d6efd' },
  progressBarProjectedFill: { height: '100%', backgroundColor: '#ffc107', opacity: 0.7 },
  progressHelpText: { fontSize: 11, color: '#6c757d', marginTop: 8, fontStyle: 'italic' },

  anomalyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#dee2e6', marginBottom: 12 },
  anomalyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  anomalyCategoryBlock: { flexDirection: 'row', alignItems: 'center' },
  anomalyCategoryName: { fontSize: 15, fontWeight: '700', color: '#212529' },
  anomalyBadge: { backgroundColor: '#fff3cd', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#ffecb5' },
  anomalyBadgeText: { color: '#664d03', fontSize: 12, fontWeight: 'bold' },
  anomalyDescription: { fontSize: 14, color: '#495057', lineHeight: 20 },

  emptyCard: { backgroundColor: '#fff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center', gap: 8 },
  emptyCardText: { color: '#6c757d', fontSize: 14, textAlign: 'center' },

  backButton: { borderContext: '1px solid #dee2e6', backgroundColor: '#fff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 40, borderWidth: 1, borderColor: '#dee2e6' },
  backButtonText: { color: '#495057', fontSize: 16, fontWeight: '600' }
});