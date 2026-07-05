import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, getAuthHeaders } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const token = await AsyncStorage.getItem("@auth_token");
                if (token) {
                    const res = await fetch(`${API_URL}/users/me`, {
                        headers: await getAuthHeaders()
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setUser(data);
                    } else {
                        await AsyncStorage.removeItem("@auth_token");
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setAuthLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Authentication failed');

        await AsyncStorage.setItem('@auth_token', data.access_token);

        const profileRes = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        const profileData = await profileRes.json();
        setUser(profileData);
    };

    const register = async (username, email, password) => {
        const res = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');
        
        await login(email, password);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('@auth_token');
        setUser(null);
    };

    const updateProfile = async (updatedFields) =>{

        const res = await fetch(`${API_URL}/users/me`,{
            method: 'PATCH',
            headers: await getAuthHeaders(),
            body:JSON.stringify(updatedFields),
        })
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Profile update failed');
  
        setUser(data); 
    }
    return (
        <AuthContext.Provider value={{ user, authLoading, login, register, logout, setUser, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);