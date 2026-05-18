// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebaseConfig';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ExpenseProvider } from './context/ExpenseContext';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Add Expense') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'History') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0d6efd',
        tabBarInactiveTintColor: isDarkMode ? '#888' : 'gray',
        headerShown: true,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.card,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.textMain,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Add Expense" component={AddExpenseScreen} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Transactions' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator({ user }) {
  const { isDarkMode } = useTheme();

  return (
    <ExpenseProvider> 
      <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ExpenseProvider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <RootNavigator user={user} />
    </ThemeProvider>
  );
}