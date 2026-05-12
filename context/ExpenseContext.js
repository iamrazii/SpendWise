// context/ExpenseContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    // Query Firestore strictly for the logged-in user's data
    const q = query(
      collection(db, 'expenses'),
      where('uid', '==', user.uid)
    );

    // onSnapshot sets up a live, real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const expenseData = [];
      querySnapshot.forEach((document) => {
        expenseData.push({ id: document.id, ...document.data() });
      });

      // Sort client-side by date to avoid complex Firestore composite index setups
      expenseData.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      
      setExpenses(expenseData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses:", error);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on auth change or unmount
  }, [auth.currentUser]);

  // Global action to add an expense
  const addExpense = async (expenseItem) => {
    const user = auth.currentUser;
    if (!user) return;
    
    await addDoc(collection(db, 'expenses'), {
      ...expenseItem,
      uid: user.uid,
      createdAt: new Date()
    });
  };

  // Global action to delete an expense
  const deleteExpense = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  return (
    <ExpenseContext.Provider value={{ expenses, loading, addExpense, deleteExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);