import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext'; 

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Other'];

export default function AddExpenseScreen({ navigation }) {
  const { addExpense } = useExpenses();
  const { theme, isDarkMode } = useTheme(); 
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return Alert.alert('Validation Error', 'Please enter a valid title and amount.');
    }
    setLoading(true);
    try {
      await addExpense({ title: title.trim(), amount: parseFloat(amount), category, date });
      setTitle(''); setAmount(''); setCategory('Food'); setDate(new Date());
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textMain }]}>What did you spend on?</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.textMain }]}
          placeholder="e.g., Late night Biryani"
          placeholderTextColor={theme.textSub}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textMain }]}>Amount</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.textMain }]}
          placeholder="0.00"
          placeholderTextColor={theme.textSub}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textMain }]}>Category</Text>
        <View style={styles.pillsContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pill, 
                { backgroundColor: isDarkMode ? '#333' : '#e9ecef' }, // Dark mode inactive pill
                category === cat && styles.activePill
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.pillText, 
                { color: isDarkMode ? '#ccc' : '#495057' },
                category === cat && styles.activePillText
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textMain }]}>Date</Text>
        <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateText, { color: theme.textMain }]}>{date.toDateString()}</Text>
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
  container: { flex: 1 },
  content: { padding: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { padding: 16, borderRadius: 10, borderWidth: 1, fontSize: 16 },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  activePill: { backgroundColor: '#e8f4fd', borderColor: '#0d6efd' },
  pillText: { fontWeight: '500' },
  activePillText: { color: '#0d6efd', fontWeight: 'bold' },
  dateButton: { padding: 16, borderRadius: 10, borderWidth: 1 },
  dateText: { fontSize: 16 },
  submitButton: { backgroundColor: '#0d6efd', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});