// screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { signOut, updatePassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';

export default function SettingsScreen() {
  const user = auth.currentUser;
  
  // 1. Preferences State
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 2. Password Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);

  // Load saved theme when screen mounts
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@dark_mode');
        if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Handle Theme Toggle & Save to Disk
  const toggleTheme = async (value) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem('@dark_mode', String(value));
    } catch (error) {
      Alert.alert('Error', 'Failed to save theme preference.');
    }
  };

  // Handle Firebase Password Update
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password should be at least 6 characters.');
      return;
    }

    setIsUpdatingAuth(true);
    try {
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Your password has been updated successfully!');
      setIsModalVisible(false);
      setNewPassword('');
    } catch (error) {
      // Firebase requires a "recent login" to change passwords.
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Security Alert', 'Please sign out and log back in to change your password.');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsUpdatingAuth(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) }
    ]);
  };

  // Dynamic Theme Colors based on state
  const theme = {
    background: isDarkMode ? '#121212' : '#f8f9fa',
    card: isDarkMode ? '#1e1e1e' : '#fff',
    textMain: isDarkMode ? '#ffffff' : '#212529',
    textSub: isDarkMode ? '#a0a0a0' : '#6c757d',
    border: isDarkMode ? '#333333' : '#dee2e6',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      
      {/* Profile Header */}
      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.email ? user.email[0].toUpperCase() : 'U'}</Text>
        </View>
        <Text style={[styles.userName, { color: theme.textMain }]}>{user?.displayName || 'SpendWise User'}</Text>
        <Text style={[styles.userEmail, { color: theme.textSub }]}>{user?.email}</Text>
      </View>

      {/* App Preferences */}
      <Text style={[styles.sectionTitle, { color: theme.textSub }]}>App Preferences</Text>
      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color="#0d6efd" style={styles.icon} />
            <Text style={[styles.settingLabel, { color: theme.textMain }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#dee2e6', true: '#0d6efd' }}
          />
        </View>

      </View>

      {/* Security & Account */}
      <Text style={[styles.sectionTitle, { color: theme.textSub }]}>Security</Text>
      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        
        <TouchableOpacity style={styles.settingRow} onPress={() => setIsModalVisible(true)}>
          <View style={styles.settingLeft}>
            <Ionicons name="lock-closed-outline" size={22} color="#0d6efd" style={styles.icon} />
            <Text style={[styles.settingLabel, { color: theme.textMain }]}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSub} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
          <View style={styles.settingLeft}>
            <Ionicons name="log-out-outline" size={22} color="#dc3545" style={styles.icon} />
            <Text style={[styles.settingLabel, { color: '#dc3545' }]}>Sign Out</Text>
          </View>
        </TouchableOpacity>

      </View>

      {/* --- PASSWORD CHANGE MODAL --- */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textMain }]}>Change Password</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSub }]}>Enter a new password for your account.</Text>
            
            <TextInput
              style={[styles.modalInput, { color: theme.textMain, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="New Password (min 6 chars)"
              placeholderTextColor={theme.textSub}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleUpdatePassword} disabled={isUpdatingAuth}>
                {isUpdatingAuth ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnSaveText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  
  profileCard: { alignItems: 'center', padding: 24, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#0d6efd' },
  userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14 },

  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  settingsCard: { borderRadius: 16, marginBottom: 24, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 12 },
  settingLabel: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginHorizontal: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', padding: 24, borderRadius: 16, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  modalInput: { borderWidth: 1, padding: 14, borderRadius: 8, fontSize: 16, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  modalBtnCancelText: { color: '#6c757d', fontWeight: 'bold', fontSize: 16 },
  modalBtnSave: { backgroundColor: '#0d6efd', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  modalBtnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});