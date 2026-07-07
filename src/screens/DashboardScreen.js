import React, {useEffect} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';

const getCategoryColor = (category) => {
  switch (category) {
    case 'Food & Dining': case 'Food': return '#ffcfda';
    case 'Transportation': case 'Transport': return '#d1e7dd';
    case 'Utilities': return '#cfe2ff';
    case 'Entertainment': return '#fff3cd';
    case 'Shopping': return '#e0cffc';
    default: return '#e9ecef';
  }
};

const getCategoryTextColor = (category) => {
  switch (category) {
    case 'Food & Dining': case 'Food': return '#dc3545';
    case 'Transportation': case 'Transport': return '#0f5132';
    case 'Utilities': return '#084298';
    case 'Entertainment': return '#664d03';
    case 'Shopping': return '#532197';
    default: return '#495057';
  }
};

export default function DashboardScreen({ navigation }) {
  const { expenses, summary, loading } = useExpenses();
  const { user } = useAuth();

  const totalSpentThisMonth = parseFloat(summary.current_month_spending) || 0;
  const monthlyLimit = parseFloat(summary.monthly_limit) || 50000; // Fallback to baseline default
  const budgetPercentage = Math.min((totalSpentThisMonth / monthlyLimit) * 100, 100);
  const recentTransactions = expenses.slice(0, 4);


  useEffect(() => {
    // Inject the header action navigation link button dynamically
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Insights')} 
          style={{ marginRight: 16 }}
        >
          <Ionicons name="bulb-outline" size={24} color="#0d6efd" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.username || 'Spender'}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardLabel}>Spent This Month</Text>
        <Text style={styles.totalAmount}>
          {totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        <View style={styles.meterContainer}>
          <View style={styles.meterLabels}>
            <Text style={styles.meterText}>Monthly Limit</Text>
            <Text style={styles.meterText}>{monthlyLimit.toLocaleString()}</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[
                styles.progressBarFill, 
                { width: `${budgetPercentage}%` },
                summary.limit_exceeded ? { backgroundColor: '#dc3545' } : 
                budgetPercentage > 70 ? { backgroundColor: '#ffc107' } : { backgroundColor: '#0d6efd' }                           
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {expenses.length > 4 && (
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#6c757d" />
          <Text style={styles.emptyStateText}>No expenses logged yet.</Text>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => navigation.navigate('Add Expense')}>
            <Text style={styles.addFirstBtnText}>+ Log Your First Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentTransactions.map((item) => {
          const expDate = new Date(item.date);
          const categoryName = item.category?.name || 'Other';
          return (
            <View key={item.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(categoryName) }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryTextColor(categoryName) }]}>{categoryName[0]}</Text>
                </View>
                <View>
                  <Text style={styles.transactionTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.transactionDate}>{expDate.toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={styles.transactionAmount}>
                -{parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 16, color: '#6c757d' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#212529' },
  summaryCard: { padding: 20, borderRadius: 16, marginBottom: 28, borderWidth: 1, backgroundColor: '#fff', borderColor: '#dee2e6', elevation: 2 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#6c757d', marginBottom: 4 },
  totalAmount: { fontSize: 36, fontWeight: 'bold', color: '#212529', marginBottom: 20 },
  meterContainer: { marginTop: 8 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meterText: { fontSize: 12, fontWeight: '500', color: '#6c757d' },
  progressBarBackground: { height: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: '#dee2e6' },
  progressBarFill: { height: '100%', borderRadius: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  seeAllText: { color: '#0d6efd', fontWeight: '600', fontSize: 14 },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, backgroundColor: '#fff', borderColor: '#dee2e6' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  categoryBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryBadgeText: { fontWeight: 'bold', fontSize: 16 },
  transactionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2, color: '#212529' },
  transactionDate: { fontSize: 12, color: '#6c757d' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#dc3545' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 16, color: '#6c757d', marginTop: 12, marginBottom: 20 },
  addFirstBtn: { backgroundColor: '#e8f4fd', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  addFirstBtnText: { color: '#0d6efd', fontWeight: 'bold' }
});