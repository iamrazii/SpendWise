// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA7Y4oYUoU0gk4V2EZXgwigU6mVPGdt4-Y",
  authDomain: "spendwise-6f1f2.firebaseapp.com",
  projectId: "spendwise-6f1f2",
  storageBucket: "spendwise-6f1f2.firebasestorage.app",
  messagingSenderId: "200687567414",
  appId: "1:200687567414:web:ca9738f44cf8b8ab568e97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence so users stay logged in
const auth = initializeAuth(app);

const db = getFirestore(app);

export { auth, db };