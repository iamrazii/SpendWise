import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../context/ExpenseContext';

export default function AddExpenseScreen({ navigation }) {
  const { addExpense, categories, summary } = useExpenses();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set the default selection to the first available category once they load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  const handleSubmit = async () => {
    if (!title.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return Alert.alert('Validation Error', 'Please enter a valid title and amount.');
    }
    if (!selectedCategoryId) {
      return Alert.alert('Validation Error', 'Please select a valid category.');
    }
    
    const totalSpent = parseFloat(summary?.current_month_spending) || 0;
    const currentLimit = parseFloat(summary?.monthly_limit) || 0;
    const parsedAmount = parseFloat(amount);

    setLoading(true);
    try {
      // Send the exact UUID directly to the database
      await addExpense({ 
        description: title.trim(), 
        amount: parsedAmount, 
        category_id: selectedCategoryId 
      });

      if (currentLimit > 0 && (totalSpent + parsedAmount) > currentLimit) {
        Alert.alert(
          'Budget Warning', 
          'Expense logged successfully, but you have officially exceeded your designated monthly budget limit!'
        );
      }

      setTitle(''); setAmount(''); setDate(new Date());
      if (categories.length > 0) setSelectedCategoryId(categories[0].id);
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>What did you spend on?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Late night Biryani"
          placeholderTextColor="#6c757d"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#6c757d"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pillsContainer}>
          
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill, 
                selectedCategoryId === cat.id && styles.activePill
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={[
                styles.pillText, 
                selectedCategoryId === cat.id && styles.activePillText
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{date.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setDate(selectedDate);
          }} />
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save Expense</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#212529' },
  input: { padding: 16, borderRadius: 10, borderWidth: 1, fontSize: 16, backgroundColor: '#fff', borderColor: '#dee2e6', color: '#212529' },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, backgroundColor: '#e9ecef', borderColor: 'transparent' },
  activePill: { backgroundColor: '#e8f4fd', borderColor: '#0d6efd' },
  pillText: { fontWeight: '500', color: '#495057' },
  activePillText: { color: '#0d6efd', fontWeight: 'bold' },
  dateButton: { padding: 16, borderRadius: 10, borderWidth: 1, backgroundColor: '#fff', borderColor: '#dee2e6' },
  dateText: { fontSize: 16, color: '#212529' },
  submitButton: { backgroundColor: '#0d6efd', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});