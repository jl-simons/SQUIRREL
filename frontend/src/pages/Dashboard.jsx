import React, { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '../utils/inventoryStorage';

/**
 * Dashboard Component
 *
 * Displays a summary of inventory, chores, and finance information.
 * Fetches from backend APIs via the Vite proxy under /backend.
 */
const Dashboard = () => {
  // Fetch chores data with React Query
  const { data: choresData } = useQuery({
    queryKey: ['chores'],
    queryFn: async () => {
      const res = await fetch('/backend/api/chores', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch chores');
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch finance data with React Query
  const { data: financeData } = useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: async () => {
      const res = await fetch('/backend/api/finance', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch finance');
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Compute inventory stats from localStorage (not cached, always fresh)
  const [inventoryCount, setInventoryCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const computeInventory = useCallback(() => {
    const items = getInventory();
    const total = Array.isArray(items) ? items.length : 0;
    const low = Array.isArray(items) ? items.filter(it => {
      const qty = typeof it.quantity === 'number' ? it.quantity : 0;
      const thr = typeof it.lowStockThreshold === 'number' ? it.lowStockThreshold : 1;
      return qty <= thr;
    }).length : 0;
    setInventoryCount(total);
    setLowStockCount(low);
  }, []);

  useEffect(() => {
    computeInventory();
  }, [computeInventory]);

  // Refresh inventory when auth succeeds or storage changes
  useEffect(() => {
    const onAuth = () => computeInventory();
    window.addEventListener('squirrel-auth-success', onAuth);
    return () => window.removeEventListener('squirrel-auth-success', onAuth);
  }, [computeInventory]);

  // Refresh when inventory changes in this or another tab
  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (!e || e.key === null || e.key === 'inventory_items') {
          computeInventory();
        }
      } catch {}
    };
    const onCustom = () => computeInventory();
    window.addEventListener('storage', onStorage);
    window.addEventListener('squirrel-inventory-changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('squirrel-inventory-changed', onCustom);
    };
  }, [computeInventory]);

  // Derive loading and data states
  const loading = !choresData && !financeData;
  const choresTotal = choresData?.pending_count ?? 0;
  const choresCompleted = choresData?.completed_count ?? 0;
  const balance = financeData?.balance ?? null;
  const transactionsCount = financeData?.transactions?.length ?? 0;

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Inventory Summary</h2>
          <p>Total Items: {loading ? 'Loading…' : inventoryCount}</p>
          <p>Low Stock Items: {loading ? 'Loading…' : lowStockCount}</p>
        </div>
        <div className="dashboard-card">
          <h2>Chores Summary</h2>
          <p>Pending Chores: {loading ? 'Loading…' : Math.max(choresTotal - choresCompleted, 0)}</p>
          <p>Completed Chores: {loading ? 'Loading…' : choresCompleted}</p>
        </div>
        <div className="dashboard-card">
          <h2>Finance Summary</h2>
          <p>Current Balance: {loading ? 'Loading…' : (balance === null ? 'N/A' : balance)}</p>
          <p>Recent Transactions: {loading ? 'Loading…' : transactionsCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;