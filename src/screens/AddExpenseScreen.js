import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useExpenses } from '../context/ExpenseContext';
import { API_URL, getAuthHeaders } from '../services/api';

export default function AddExpenseScreen({ navigation }) {
  const { addExpense, categories, summary } = useExpenses();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [aiScanning, setAiScanning] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewAmount, setPreviewAmount] = useState('');
  const [previewCategoryId, setPreviewCategoryId] = useState('');

  // Automatically fall back to the first active category profile once loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Unified core database transaction wrapper
  const saveTransactionToDb = async (finalTitle, finalAmount, finalCategoryId) => {
    if (!finalTitle.trim() || isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid title and amount.');
      return false;
    }
    if (!finalCategoryId) {
      Alert.alert('Validation Error', 'Please select a valid category reference.');
      return false;
    }
    
    const totalSpent = parseFloat(summary?.current_month_spending) || 0;
    const currentLimit = parseFloat(summary?.monthly_limit) || 0;
    const parsedAmount = parseFloat(finalAmount);

    try {
      await addExpense({
        description: finalTitle.trim(),
        amount: parsedAmount, 
        category_id: finalCategoryId
      });

      if (currentLimit > 0 && (totalSpent + parsedAmount) > currentLimit) {
        Alert.alert(
          'Budget Warning',
          'Expense logged successfully, but you have officially exceeded your designated monthly budget limit!'
        );
      }
      return true;
    } catch (error) {
      Alert.alert('Database Sync Failure', error.message);
      return false;
    }
  };

  // Manual Form Submission Execution
  const handleSubmit = async () => {
    setLoading(true);
    const success = await saveTransactionToDb(title, amount, selectedCategoryId);
    setLoading(false);
    
    if (success) {
      setTitle(''); 
      setAmount(''); 
      setDate(new Date());
      if (categories.length > 0) setSelectedCategoryId(categories[0].id);
      navigation.navigate('Dashboard');
    }
  };

  // Hardware Interface Image Acquisition Engine
  const handleReceiptCapture = async (sourceType) => {
    let permissionResult;
    if (sourceType === 'camera') {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permissionResult.granted) {
      return Alert.alert('Permission Denied', `SpendWise requires localized access permission to engage your device ${sourceType}.`);
    }

    const captureSettings = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    };

    const result = sourceType === 'camera' 
      ? await ImagePicker.launchCameraAsync(captureSettings)
      : await ImagePicker.launchImageLibraryAsync(captureSettings);

    if (result.canceled) return;

    sendImageToLLM(result.assets[0]);
  };

const sendImageToLLM = async (imageAsset) => {
  setAiScanning(true);
  
  const fileUri = imageAsset.uri;
  const computedFilename = imageAsset.fileName || fileUri.split('/').pop() || 'receipt.jpg';
  const extensionMatch = /\.(\w+)$/.exec(computedFilename);
  const computedMimeType = imageAsset.mimeType || (extensionMatch ? `image/${extensionMatch[1]}` : 'image/jpeg');

  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
    name: computedFilename,
    type: computedMimeType,
  });

  try {
    const authHeaders = await getAuthHeaders();
    delete authHeaders['Content-Type'];

    const response = await fetch(`${API_URL}/expenses/scan`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Network extraction error.');

    if (!data.is_valid_receipt) {
      Alert.alert(
        'Invalid Image Detected',
        data.error_message || 'The provided image does not contain a recognizable receipt layout. Please try again with a clearer photo.',
        [{ text: 'OK' }]
      );
      return; // Halt right here—do not show the preview Modal
    }

    let matchedCategoryId = categories[0]?.id || '';
    if (data.category_name) {
      const matchedCategory = categories.find(c => c.name.toLowerCase() === data.category_name.toLowerCase());
      if (matchedCategory) matchedCategoryId = matchedCategory.id;
    }

    setPreviewTitle(data.title || '');
    setPreviewAmount(data.amount ? data.amount.toString() : '');
    setPreviewCategoryId(matchedCategoryId);
    
    setIsPreviewVisible(true);

  } catch (error) {
    Alert.alert('AI Processing Error', error.message);
  } finally {
    setAiScanning(false);
  }
};

  const handleConfirmPreview = async () => {
    setLoading(true);
    const success = await saveTransactionToDb(previewTitle, previewAmount, previewCategoryId);
    setLoading(false);
    
    if (success) {
      setIsPreviewVisible(false);
      navigation.navigate('Dashboard');
    }
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Scan Receipt',
      'Select a source injection point to scan transaction data:',
      [
        { text: 'Take Photo (Camera)', onPress: () => handleReceiptCapture('camera') },
        { text: 'Choose From Gallery', onPress: () => handleReceiptCapture('gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* AI PROCESSING ACTION BUTTON BAR */}
      <TouchableOpacity 
        style={styles.aiScanButton} 
        onPress={showAttachmentOptions}
        disabled={aiScanning}
      >
        {aiScanning ? (
          <View style={styles.aiRow}>
            <ActivityIndicator color="#664d03" style={{ marginRight: 10 }} />
            <Text style={styles.aiScanButtonText}>Gemini reading receipt matrix lines...</Text>
          </View>
        ) : (
          <View style={styles.aiRow}>
            <Ionicons name="sparkles" size={20} color="#664d03" style={{ marginRight: 10 }} />
            <Text style={styles.aiScanButtonText}>Scan Receipt with Gemini AI</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Manual Input Fields */}
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
          <DateTimePicker 
            value={date} 
            mode="date" 
            display="default" 
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate);
            }} 
          />
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save Expense</Text>}
      </TouchableOpacity>

      {/* --- AI VERIFICATION AND REVIEW PREVIEW OVERLAY MODAL --- */}
      <Modal visible={isPreviewVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Ionicons name="sparkles" size={24} color="#0d6efd" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>AI Receipt Preview</Text>
            </View>
            <Text style={styles.modalSubtitle}>Gemini parsed the following values. Review and tweak parameters prior to recording:</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Extracted Title</Text>
              <TextInput 
                style={styles.input}
                value={previewTitle}
                onChangeText={setPreviewTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Extracted Amount (Rs.)</Text>
              <TextInput 
                style={styles.input}
                value={previewAmount}
                onChangeText={setPreviewAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assigned Category Match</Text>
              <View style={styles.pillsContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pill, 
                      previewCategoryId === cat.id && styles.activePill
                    ]}
                    onPress={() => setPreviewCategoryId(cat.id)}
                  >
                    <Text style={[
                      styles.pillText, 
                      previewCategoryId === cat.id && styles.activePillText
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.btnCancel} 
                onPress={() => setIsPreviewVisible(false)}
                disabled={loading}
              >
                <Text style={styles.btnCancelText}>Discard Scan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.btnSave} 
                onPress={handleConfirmPreview}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Approve & Save</Text>}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

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
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // AI Context Buttons Styling
  aiScanButton: { backgroundColor: '#fff3cd', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#ffecb5', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  aiRow: { flexDirection: 'row', alignItems: 'center' },
  aiScanButtonText: { color: '#664d03', fontWeight: '700', fontSize: 15 },

  // Verification Screen Overlay Layout Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', padding: 24, borderRadius: 16, backgroundColor: '#fff', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
  modalSubtitle: { fontSize: 14, color: '#6c757d', marginBottom: 20, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  btnCancelText: { color: '#dc3545', fontWeight: 'bold', fontSize: 16 },
  btnSave: { backgroundColor: '#0d6efd', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 140, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});