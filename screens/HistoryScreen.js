// screens/HistoryScreen.js
import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';

const CATEGORIES = ['All', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Other'];

// Consistent visual badge helpers mapped from the Dashboard
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

export default function HistoryScreen() {
  const { expenses, deleteExpense } = useExpenses();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fast client-side filtering utilizing useMemo for performance
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      // 1. Category Filter Match
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      
      // 2. Search Query Match (case-insensitive)
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
      return matchesCategory && matchesSearch;
    });
  }, [expenses, searchQuery, selectedCategory]);

  // Handle document deletion with OS-level confirmation
  const handleDelete = (id, title) => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to remove "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete expense: " + error.message);
            }
          }
        }
      ]
    );
  };

  // Dedicated component to render each individual list item
  const renderExpenseItem = ({ item }) => {
    const expDate = item.date?.toDate ? item.date.toDate() : new Date(item.date);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={[styles.categoryBadgeText, { color: getCategoryTextColor(item.category) }]}>
              {item.category[0]}
            </Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.transactionTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.transactionDate}>{expDate.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.transactionRight}>
          <Text style={styles.transactionAmount}>
            -{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          
          <TouchableOpacity 
            onPress={() => handleDelete(item.id, item.title)}
            style={styles.deleteBtn}
            accessibilityLabel={`Delete ${item.title}`}
          >
            <Ionicons name="trash-outline" size={20} color="#adb5bd" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* 1. Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#adb5bd" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing" // Native iOS clear cross
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color="#adb5bd" />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Category Filter Pills (Horizontal Scroll) */}
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.pillsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.pill,
                selectedCategory === item && styles.activePill
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[
                styles.pillText,
                selectedCategory === item && styles.activePillText
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 3. Main Expenses List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="filter-circle-outline" size={54} color="#dee2e6" />
            <Text style={styles.emptyStateText}>
              {expenses.length === 0 
                ? "No expenses found. Add some from the Add tab!" 
                : "No matching transactions found."}
            </Text>
          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  // Search Bar
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    margin: 16, 
    marginBottom: 8,
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#dee2e6',
    paddingHorizontal: 12,
    height: 48
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#212529' },
  clearBtn: { padding: 4 },

  // Filters
  filterWrapper: { height: 50, marginBottom: 8 },
  pillsContainer: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  pill: { 
    backgroundColor: '#e9ecef', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  activePill: { backgroundColor: '#e8f4fd', borderColor: '#0d6efd' },
  pillText: { color: '#495057', fontWeight: '500', fontSize: 14 },
  activePillText: { color: '#0d6efd', fontWeight: 'bold' },

  // List Container
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  
  // Transaction Card
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
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryBadgeText: { fontWeight: 'bold', fontSize: 16 },
  textContainer: { flex: 1, marginRight: 8 },
  transactionTitle: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 2 },
  transactionDate: { fontSize: 12, color: '#adb5bd' },
  
  transactionRight: { flexDirection: 'row', alignItems: 'center' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#dc3545', marginRight: 12 },
  deleteBtn: { padding: 4 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyStateText: { color: '#adb5bd', fontSize: 16, marginTop: 12, textAlign: 'center' }
});