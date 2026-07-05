import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('@auth_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};