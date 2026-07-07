import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';

const CATEGORIES = ['All', 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Shopping'];

const getCategoryColor = (cat) => {
  switch(cat) {
    case 'Food & Dining': return '#ffcfda'; case 'Transportation': return '#d1e7dd';
    case 'Utilities': return '#cfe2ff'; case 'Entertainment': return '#fff3cd';
    case 'Shopping': return '#e0cffc'; default: return '#e9ecef';
  }
};
const getCategoryTextColor = (cat) => {
  switch(cat) {
    case 'Food & Dining': return '#dc3545'; case 'Transportation': return '#0f5132';
    case 'Utilities': return '#084298'; case 'Entertainment': return '#664d03';
    case 'Shopping': return '#532197'; default: return '#495057';
  }
};

export default function HistoryScreen() {
  const { expenses, deleteExpense } = useExpenses();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExpenses = useMemo(() => {

    return expenses.filter(item => {
      const categoryName = item.category?.name || 'Other';
      const matchesCategory = selectedCategory === 'All' || categoryName === selectedCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const handleDelete = (id, title) => {
    Alert.alert("Delete", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExpense(id) }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor="#6c757d"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color="#6c757d" />
          </TouchableOpacity>
        )}
      </View>

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
              ]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="filter-circle-outline" size={54} color="#dee2e6" />
            <Text style={styles.emptyStateText}>No matching transactions found.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const expDate = new Date(item.date);
          const categoryName = item.category?.name || 'Other';
          return (
            <View style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(categoryName) }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryTextColor(categoryName) }]}>{categoryName[0]}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.transactionTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.transactionDate}>{expDate.toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>-${parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 48, backgroundColor: '#fff', borderColor: '#dee2e6' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#212529' },
  clearBtn: { padding: 4 },
  filterWrapper: { height: 50, marginBottom: 8 },
  pillsContainer: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, backgroundColor: '#e9ecef', borderColor: 'transparent' },
  activePill: { backgroundColor: '#e8f4fd', borderColor: '#0d6efd' },
  pillText: { fontWeight: '500', fontSize: 14, color: '#495057' },
  activePillText: { color: '#0d6efd', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, backgroundColor: '#fff', borderColor: '#dee2e6' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryBadgeText: { fontWeight: 'bold', fontSize: 16 },
  textContainer: { flex: 1, marginRight: 8 },
  transactionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2, color: '#212529' },
  transactionDate: { fontSize: 12, color: '#6c757d' },
  transactionRight: { flexDirection: 'row', alignItems: 'center' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#dc3545', marginRight: 12 },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyStateText: { fontSize: 16, marginTop: 12, textAlign: 'center', color: '#6c757d' }
});