// context/ExpenseContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

import { useAuth } from './AuthContext';
import { getAuthHeaders, API_URL } from '../services/api';


const ExpenseContext = createContext({});

export const ExpenseProvider = ({ children }) => {
  const {user} = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ current_month_spending: 0, monthly_limit: null, limit_exceeded: false });
  const [loading, setLoading] = useState(false);


const fetchExpensesAndSummary = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      const [expRes, sumRes,catRes] = await Promise.all([
        fetch(`${API_URL}/expenses/`, { headers }),
        fetch(`${API_URL}/expenses/summary`, { headers }),
        fetch(`${API_URL}/categories/`, { headers })
      ]);

      if (!expRes.ok) console.error("Expenses API failed:", await expRes.text());
    if (!sumRes.ok) console.error("Summary API failed:", await sumRes.text());
    if (!catRes.ok) console.error("Category API failed:", await sumRes.text());
      if (expRes.ok && sumRes.ok && catRes.ok) {
        const expData = await expRes.json();
        const sumData = await sumRes.json();
        const catData = await catRes.json();
        const mappedExpenses = expData.map(item => ({
          ...item,
          title: item.description || 'Untitled Transaction',
          date: item.date_added, // Map database timestamp to date field
        }));

        setExpenses(mappedExpenses);
        setSummary(sumData);
        setCategories(catData)
      }
    } catch (error) {
      console.error('Failed to sync transaction ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically refresh records whenever a user logs in
  useEffect(() => {
    fetchExpensesAndSummary();
  }, [user]);



  // Global action to add an expense
  const addExpense = async (expensePayload) => {
    const headers = await getAuthHeaders()
    const payload = {
      amount: expensePayload.amount,
      description: expensePayload.title, 
      category_id: expensePayload.category_id || null 
    };

    const res = await fetch(`${API_URL}/expenses/`,{
      headers,
      method: 'POST',
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to persist transaction record');
    }

    await fetchExpensesAndSummary(); // Trigger atomic state refresh
  };

  // Global action to delete an expense
  const deleteExpense = async (expenseId) => {
    const res = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });

    if (!res.ok) throw new Error('Failed to purge transaction item');
    await fetchExpensesAndSummary();
    };

    return (
    <ExpenseContext.Provider value={{ expenses, summary, loading, addExpense, deleteExpense, refreshData: fetchExpensesAndSummary , categories}}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => useContext(ExpenseContext);