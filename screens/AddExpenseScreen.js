// screens/AddExpenseScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../context/ExpenseContext';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Other'];

export default function AddExpenseScreen({ navigation }) {
  const { addExpense } = useExpenses();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  
  // Date Picker State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    // 1. Input Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title.');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      // 2. Send to Global Context (which writes to Mumbai Firestore)
      await addExpense({
        title: title.trim(),
        amount: parsedAmount,
        category,
        date, // Stored as a native JS Date, Firestore will convert to a Timestamp
      });

      // 3. Reset Form & Provide UX Feedback
      setTitle('');
      setAmount('');
      setCategory('Food');
      setDate(new Date());

      Alert.alert('Success!', 'Expense added successfully.');
      
      // 4. Redirect to Dashboard to see updated stats
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>What did you spend on?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Late night Biryani, Uber ride"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      {/* Category Selection (Pills) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pillsContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pill, 
                category === cat && styles.activePill
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.pillText, 
                category === cat && styles.activePillText
              ]}>
                {cat}
              </Text>

            </TouchableOpacity>
          ))}
          
        </View>
      </View>

      {/* Date Picker Trigger */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{date.toDateString()}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()} // Prevent picking future dates
          />
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Save Expense</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 },
  input: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#dee2e6',
    fontSize: 16
  },
  
  // Category Pills Styles
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { 
    backgroundColor: '#e9ecef', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  activePill: { backgroundColor: '#e8f4fd', borderColor: '#0d6efd' },
  pillText: { color: '#495057', fontWeight: '500' },
  activePillText: { color: '#0d6efd', fontWeight: 'bold' },

  // Date Styles
  dateButton: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#dee2e6' 
  },
  dateText: { fontSize: 16, color: '#212529' },

  // Submit Button
  submitButton: { 
    backgroundColor: '#0d6efd', 
    padding: 18, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10 
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});