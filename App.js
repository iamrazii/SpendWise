import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth, AuthProvider } from './src/context/AuthContext';
import { ExpenseProvider } from './src/context/ExpenseContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
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
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#dee2e6',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#212529',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Add Expense" component={AddExpenseScreen} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Transactions' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  // Read stateless login states directly out of the unified MVVM Auth ViewModel
  const { user, authLoading } = useAuth();

  // Render initialization loading screen while checking AsyncStorage for a saved JWT
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <ExpenseProvider> 
      <NavigationContainer>
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
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}