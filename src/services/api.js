
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = "192.168.10.7:8000"


export const getAuthHeaders = async() =>{
    const token = await AsyncStorage.getItem('@auth_token')
    return {
        'Content-type':'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};