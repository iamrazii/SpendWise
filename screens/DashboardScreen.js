// screens/DashboardScreen.js
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { useExpenses } from '../context/ExpenseContext';

// A hypothetical monthly budget for our visual progress bar
const MONTHLY_BUDGET = 50000; 

// Helper to assign colors to category pills
const getCategoryColor = (category) => {
  switch (category) {
    case 'Food': return '#ffcfda';
    case 'Transport': return '#d1e7dd';
    case 'Utilities': return '#cfe2ff';
    case 'Entertainment': return '#fff3cd';
    case 'Shopping': return '#e0cffc';
    default: return '#e9ecef';
  }
};

const getCategoryTextColor = (category) => {
  switch (category) {
    case 'Food': return '#dc3545';
    case 'Transport': return '#0f5132';
    case 'Utilities': return '#084298';
    case 'Entertainment': return '#664d03';
    case 'Shopping': return '#532197';
    default: return '#495057';
  }
};

export default function DashboardScreen({ navigation }) {
  const { expenses, loading } = useExpenses();
  const user = auth.currentUser;

  // 1. Calculate Total Spent THIS Month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpenses = expenses.filter(item => {
    // Convert Firestore timestamp or native Date to a JS Date object
    const expDate = item.date?.toDate ? item.date.toDate() : new Date(item.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpentThisMonth = thisMonthExpenses.reduce((sum, item) => sum + item.amount, 0);

  // 2. Calculate Budget Progress Percentage
  const budgetPercentage = Math.min((totalSpentThisMonth / MONTHLY_BUDGET) * 100, 100);

  // 3. Grab top 4 most recent transactions
  const recentTransactions = expenses.slice(0, 4);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Top Header: Greeting & Sign Out */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'Spender'}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => signOut(auth)} 
          style={styles.signOutBtn}
          accessibilityLabel="Sign Out"
        >
          <Ionicons name="log-out-outline" size={24} color="#dc3545" />
        </TouchableOpacity>
      </View>

      {/* Main Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardLabel}>Spent This Month</Text>
        <Text style={styles.totalAmount}>
          {totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Visual Budget Meter */}
        <View style={styles.meterContainer}>
          <View style={styles.meterLabels}>
            <Text style={styles.meterText}>Monthly Limit</Text>
            <Text style={styles.meterText}>{MONTHLY_BUDGET.toLocaleString()}</Text>
          </View>
          
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${budgetPercentage}%` },
                budgetPercentage > 90 ? { backgroundColor: '#dc3545' } : // Red if nearing limit
                budgetPercentage > 70 ? { backgroundColor: '#ffc107' } : // Yellow if getting warm
                { backgroundColor: '#0d6efd' }                           // Blue default
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Recent Transactions Section */}
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
          <Ionicons name="receipt-outline" size={48} color="#adb5bd" />
          <Text style={styles.emptyStateText}>No expenses logged yet.</Text>
          <TouchableOpacity 
            style={styles.addFirstBtn} 
            onPress={() => navigation.navigate('Add Expense')}
          >
            <Text style={styles.addFirstBtnText}>+ Log Your First Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentTransactions.map((item) => {
          const expDate = item.date?.toDate ? item.date.toDate() : new Date(item.date);
          
          return (
            <View key={item.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryTextColor(item.category) }]}>
                    {item.category[0]} {/* First letter as an icon */}
                  </Text>
                </View>
                <View>
                  <Text style={styles.transactionTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.transactionDate}>{expDate.toLocaleDateString()}</Text>
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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 16, color: '#6c757d' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#212529' },
  signOutBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 50, borderWidth: 1, borderColor: '#dee2e6' },

  // Summary Card
  summaryCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#dee2e6',
    elevation: 2, // Slight shadow for Android
  },
  cardLabel: { fontSize: 14, color: '#6c757d', fontWeight: '600', marginBottom: 4 },
  totalAmount: { fontSize: 36, fontWeight: 'bold', color: '#212529', marginBottom: 20 },
  
  // Meter
  meterContainer: { marginTop: 8 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meterText: { fontSize: 12, color: '#adb5bd', fontWeight: '500' },
  progressBarBackground: { height: 10, backgroundColor: '#e9ecef', borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 10 },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  seeAllText: { color: '#0d6efd', fontWeight: '600', fontSize: 14 },

  // Transaction Cards
  transactionCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f3f5'
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  categoryBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryBadgeText: { fontWeight: 'bold', fontSize: 16 },
  transactionTitle: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 2 },
  transactionDate: { fontSize: 12, color: '#adb5bd' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#dc3545' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { color: '#6c757d', fontSize: 16, marginTop: 12, marginBottom: 20 },
  addFirstBtn: { backgroundColor: '#e8f4fd', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  addFirstBtnText: { color: '#0d6efd', fontWeight: 'bold' }
});