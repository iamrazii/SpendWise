// screens/DashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext'; 

const MONTHLY_BUDGET = 50000; 

const getCategoryColor = (category) => {
  switch (category) {
    case 'Food': return '#ffcfda'; case 'Transport': return '#d1e7dd';
    case 'Utilities': return '#cfe2ff'; case 'Entertainment': return '#fff3cd';
    case 'Shopping': return '#e0cffc'; default: return '#e9ecef';
  }
};

const getCategoryTextColor = (category) => {
  switch (category) {
    case 'Food': return '#dc3545'; case 'Transport': return '#0f5132';
    case 'Utilities': return '#084298'; case 'Entertainment': return '#664d03';
    case 'Shopping': return '#532197'; default: return '#495057';
  }
};

export default function DashboardScreen({ navigation }) {
  const { expenses, loading } = useExpenses();
  const { theme } = useTheme(); 
  const user = auth.currentUser;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthExpenses = expenses.filter(item => {
    const expDate = item.date?.toDate ? item.date.toDate() : new Date(item.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpentThisMonth = thisMonthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const budgetPercentage = Math.min((totalSpentThisMonth / MONTHLY_BUDGET) * 100, 100);
  const recentTransactions = expenses.slice(0, 4);

  if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color="#0d6efd" /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSub }]}>Hello,</Text>
          <Text style={[styles.userName, { color: theme.textMain }]}>{user?.displayName || user?.email?.split('@')[0] || 'Spender'}</Text>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardLabel, { color: theme.textSub }]}>Spent This Month</Text>
        <Text style={[styles.totalAmount, { color: theme.textMain }]}>
          {totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        <View style={styles.meterContainer}>
          <View style={styles.meterLabels}>
            <Text style={[styles.meterText, { color: theme.textSub }]}>Monthly Limit</Text>
            <Text style={[styles.meterText, { color: theme.textSub }]}>{MONTHLY_BUDGET.toLocaleString()}</Text>
          </View>
          <View style={[styles.progressBarBackground, { backgroundColor: theme.border }]}>
            <View style={[
                styles.progressBarFill, 
                { width: `${budgetPercentage}%` },
                budgetPercentage > 90 ? { backgroundColor: '#dc3545' } : 
                budgetPercentage > 70 ? { backgroundColor: '#ffc107' } : { backgroundColor: '#0d6efd' }                           
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Recent Activity</Text>
        {expenses.length > 4 && (
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={theme.textSub} />
          <Text style={[styles.emptyStateText, { color: theme.textSub }]}>No expenses logged yet.</Text>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => navigation.navigate('Add Expense')}>
            <Text style={styles.addFirstBtnText}>+ Log Your First Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentTransactions.map((item) => {
          const expDate = item.date?.toDate ? item.date.toDate() : new Date(item.date);
          return (
            <View key={item.id} style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.transactionLeft}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryTextColor(item.category) }]}>{item.category[0]}</Text>
                </View>
                <View>
                  <Text style={[styles.transactionTitle, { color: theme.textMain }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.transactionDate, { color: theme.textSub }]}>{expDate.toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={styles.transactionAmount}>
                -{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 16 },
  userName: { fontSize: 24, fontWeight: 'bold' },
  summaryCard: { padding: 20, borderRadius: 16, marginBottom: 28, borderWidth: 1, elevation: 2 },
  cardLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  totalAmount: { fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  meterContainer: { marginTop: 8 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meterText: { fontSize: 12, fontWeight: '500' },
  progressBarBackground: { height: 10, borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeAllText: { color: '#0d6efd', fontWeight: '600', fontSize: 14 },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  categoryBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryBadgeText: { fontWeight: 'bold', fontSize: 16 },
  transactionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  transactionDate: { fontSize: 12 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#dc3545' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 16, marginTop: 12, marginBottom: 20 },
  addFirstBtn: { backgroundColor: '#e8f4fd', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  addFirstBtnText: { color: '#0d6efd', fontWeight: 'bold' }
});