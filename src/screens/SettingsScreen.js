import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, getAuthHeaders } from '../services/api';

export default function SettingsScreen() {
  const { user, logout, updateProfile } = useAuth(); 
  
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);

  // New Budget Limit States
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);
  const [limitInput, setLimitInput] = useState(user?.monthly_limit ? String(user.monthly_limit) : '');
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);

  const handleUpdatePassword = async () => {
    if (!oldPassword || newPassword.length < 6) {
      Alert.alert('Validation Error', 'Password should be at least 6 characters.');
      return;
    }
    setIsUpdatingAuth(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to modify credentials.');
      Alert.alert('Success', 'Your password has been updated successfully!');
      setIsPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsUpdatingAuth(false);
    }
  };

const handleSaveLimit = async () => {
  if (isNaN(parseFloat(limitInput)) || parseFloat(limitInput) <= 0) {
    return Alert.alert('Validation Error', 'Please enter a valid amount.');
  }
  
  setIsUpdatingLimit(true);
  try {
    await updateProfile({ monthly_limit: parseFloat(limitInput) });
    
    Alert.alert('Success', 'Limit updated!');
    setIsLimitModalVisible(false);
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setIsUpdatingLimit(false);
  }
};

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmWebLogout = window.confirm('Are you sure you want to sign out?');
      if (confirmWebLogout) logout();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username ? user.username[0].toUpperCase() : 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.username || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Budget Preferences</Text>
      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingRow} onPress={() => setIsLimitModalVisible(true)}>
          <View style={styles.settingLeft}>
            <Ionicons name="card-outline" size={22} color="#0d6efd" style={styles.icon} />
            <Text style={styles.settingLabel}>
              Monthly Limit: {user?.monthly_limit ? `${parseFloat(user.monthly_limit).toLocaleString()}` : 'Not Set'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingRow} onPress={() => setIsPasswordModalVisible(true)}>
          <View style={styles.settingLeft}>
            <Ionicons name="lock-closed-outline" size={22} color="#0d6efd" style={styles.icon} />
            <Text style={styles.settingLabel}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
          <View style={styles.settingLeft}>
            <Ionicons name="log-out-outline" size={22} color="#dc3545" style={styles.icon} />
            <Text style={[styles.settingLabel, { color: '#dc3545' }]}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* --- PASSWORD MODAL --- */}
      <Modal visible={isPasswordModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalSubtitle}>Enter details to update your account password.</Text>
            <TextInput style={styles.modalInput} placeholder="Current Password" placeholderTextColor="#6c757d" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
            <TextInput style={styles.modalInput} placeholder="New Password (min 6 chars)" placeholderTextColor="#6c757d" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsPasswordModalVisible(false)}><Text style={styles.modalBtnCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleUpdatePassword} disabled={isUpdatingAuth}>
                {isUpdatingAuth ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnSaveText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- ADJUST LIMIT BUDGET MODAL --- */}
      <Modal visible={isLimitModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Monthly Limit</Text>
            <Text style={styles.modalSubtitle}>Adjust or increase your maximum targeted monthly budget capability threshold.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 50000"
              placeholderTextColor="#6c757d"
              keyboardType="numeric"
              value={limitInput}
              onChangeText={setLimitInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsLimitModalVisible(false)}><Text style={styles.modalBtnCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveLimit} disabled={isUpdatingLimit}>
                {isUpdatingLimit ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnSaveText}>Save Limit</Text>}
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
  profileCard: { alignItems: 'center', padding: 24, borderRadius: 16, marginBottom: 24, borderWidth: 1, backgroundColor: '#fff', borderColor: '#dee2e6' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#0d6efd' },
  userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: '#212529' },
  userEmail: { fontSize: 14, color: '#6c757d' },
  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, color: '#6c757d' },
  settingsCard: { borderRadius: 16, marginBottom: 24, borderWidth: 1, overflow: 'hidden', backgroundColor: '#fff', borderColor: '#dee2e6' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 12 },
  settingLabel: { fontSize: 16, fontWeight: '500', color: '#212529' },
  divider: { height: 1, marginHorizontal: 16, backgroundColor: '#dee2e6' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', padding: 24, borderRadius: 16, borderWidth: 1, backgroundColor: '#fff', borderColor: '#dee2e6' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#212529' },
  modalSubtitle: { fontSize: 14, marginBottom: 20, color: '#6c757d' },
  modalInput: { borderWidth: 1, padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 16, color: '#212529', borderColor: '#dee2e6', backgroundColor: '#f8f9fa' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  modalBtnCancelText: { color: '#6c757d', fontWeight: 'bold', fontSize: 16 },
  modalBtnSave: { backgroundColor: '#0d6efd', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  modalBtnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});