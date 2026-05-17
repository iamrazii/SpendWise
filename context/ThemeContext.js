// context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme on app boot
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('@dark_mode');
      if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');
    };
    loadTheme();
  }, []);

  const toggleTheme = async (value) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('@dark_mode', String(value));
  };

  // Define our global color palettes
  const theme = {
    background: isDarkMode ? '#121212' : '#f8f9fa',
    card: isDarkMode ? '#1e1e1e' : '#fff',
    textMain: isDarkMode ? '#ffffff' : '#212529',
    textSub: isDarkMode ? '#a0a0a0' : '#6c757d',
    border: isDarkMode ? '#333333' : '#dee2e6',
    tabBar: isDarkMode ? '#1e1e1e' : '#fff',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);