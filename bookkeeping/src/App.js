import React, { useState, useEffect, useMemo } from 'react';
import { loadTransactions, deleteTransaction } from './utils/storage';
import { removeAttachmentsByTransaction } from './utils/db';
import { supabase } from './utils/supabase';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import TaxSummary from './components/TaxSummary';
import TransactionModal from './components/TransactionModal';
import Login from './components/Login';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const styles = {
  header: {
    borderBottom: '1px solid #2e2e2e', padding: '20px 40px',
    display: 'flex', alignItems: 'center', gap: 16,
    background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 50,
  },
  logo: { fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: '#c8f060', letterSpacing: '-0.02em' },
  logoSub: { fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase' },
  yearBtns: { display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' },
  yearBtn: (active) => ({
    fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', padding: '6px 14px',
    border: `1px solid ${active ? '#c8f060' : '#2e2e2e'}`, background: 'transparent',
    color: active ? '#c8f060' : '#666660', cursor: 'pointer', borderRadius: 4,
  }),
  logoutBtn: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', padding: '6px 14px',
    border: '1px solid #2e2e2e', background: 'transparent', color: '#666660',
    cursor: 'pointer', borderRadius: 4, marginLeft: 12,
  },
  layout: { display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 65px)' },
  sidebar: {
    background: '#1a1a1a', borderRight: '1px solid #2e2e2e',
    padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4,
  },
  sideLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#666660',
    letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 10px',
    marginBottom: 4, marginTop: 12,
  },
  navBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
    borderRadius: 6, border: 'none', background: active ? '#222' : 'transparent',
    color: active ? '#c8f060' : '#666660', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
    textAlign: 'left', width: '100%', transition: 'all 0.15s',
  }),
  summaryCard: {
    marginTop: 'auto', background: '#222', border: '1px solid #2e2e2e',
    borderRadius: 8, padding: 16,
  },
  summaryLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
  },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.8rem' },
  summaryVal: (color) => ({ fontFamily: "'DM Mono', monospace", color, fontSize: '0.85rem', fontWeight: 500 }),
  divider: { border: 'none', borderTop: '1px solid #2e2e2e', margin: '8px 0' },
  main: { overflowY: 'auto' },
  loading: {
    minHeight: '100vh', background: '#0f0f0f', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Mono', monospace", color: '#666660', fontSize: '0.8rem',
  },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState('dashboard');
  const [year, setYear] = useState(2026);
  const [modal, setModal] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load transactions when signed in
  useEffect(() => {
    if (session) {
      loadTransactions()
        .then(setTransactions)
        .catch(err => console.error('Failed to load transactions:', err));
    } else {
      setTransactions([]);
    }
  }, [session]);

  const handleSave = (tx) => {
    // Transaction already saved to DB by TransactionModal — just update local state
    setTransactions(prev => {
      const exists = prev.find(t => t.id === tx.id);
      return exists ? prev.map(t => t.id === tx.id ? tx : t) : [...prev, tx];
    });
    setModal(null);
  };

  const handleDelete = async (id) => {
    await removeAttachmentsByTransaction(id);
    await deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = () => supabase.auth.signOut();

  const yearTotals = useMemo(() => {
    const yt = transactions.filter(t => t.year === year);
    const income = yt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = yt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const draw = yt.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0);
    return { income, expense, draw, net: income - expense };
  }, [transactions, year]);

  const openAdd = () => setModal('add');
  const openEdit = (tx) => setModal(tx);
  const closeModal = () => setModal(null);

  const navTo = (v, type) => {
    setView(v);
    if (type) setFilterType(type);
  };

  if (authLoading) return <div style={styles.loading}>Loading...</div>;
  if (!session) return <Login />;

  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh' }}>
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>Corporate Books</div>
          <div style={styles.logoSub}>Suresh Kumar Sivasubramaniam · Incorporated</div>
        </div>
        <div style={styles.yearBtns}>
          {[2026, 2025, 2024].map(y => (
            <button key={y} style={styles.yearBtn(year === y)} onClick={() => setYear(y)}>FY {y}</button>
          ))}
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <div style={{ ...styles.sideLabel, marginTop: 0 }}>Navigation</div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'transactions', label: 'All Transactions', icon: '📋' },
          ].map(n => (
            <button key={n.id} style={styles.navBtn(view === n.id)} onClick={() => navTo(n.id)}>
              <span style={{ width: 20, textAlign: 'center' }}>{n.icon}</span> {n.label}
            </button>
          ))}

          <div style={styles.sideLabel}>By Type</div>

          {[
            { id: 'transactions', type: 'income', label: 'Income', icon: '💰' },
            { id: 'transactions', type: 'expense', label: 'Expenses', icon: '🧾' },
            { id: 'transactions', type: 'draw', label: 'Draws', icon: '🏦' },
          ].map(n => (
            <button key={n.type} style={styles.navBtn(view === n.id && filterType === n.type)} onClick={() => navTo(n.id, n.type)}>
              <span style={{ width: 20, textAlign: 'center' }}>{n.icon}</span> {n.label}
            </button>
          ))}

          <div style={styles.sideLabel}>Reports</div>
          <button style={styles.navBtn(view === 'tax')} onClick={() => navTo('tax')}>
            <span style={{ width: 20, textAlign: 'center' }}>🇨🇦</span> Tax Summary
          </button>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>FY {year} Summary</div>
            <div style={styles.summaryRow}>
              <span>Income</span>
              <span style={styles.summaryVal('#60f0a8')}>{fmt(yearTotals.income)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Expenses</span>
              <span style={styles.summaryVal('#f06060')}>{fmt(yearTotals.expense)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Draws</span>
              <span style={styles.summaryVal('#c8f060')}>{fmt(yearTotals.draw)}</span>
            </div>
            <hr style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={{ fontWeight: 600 }}>Net Profit</span>
              <span style={{ ...styles.summaryVal(yearTotals.net >= 0 ? '#60f0a8' : '#f06060'), fontSize: '1rem' }}>
                {fmt(yearTotals.net)}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.main}>
          {view === 'dashboard' && <Dashboard transactions={transactions} year={year} />}
          {view === 'transactions' && (
            <Transactions
              transactions={transactions}
              year={year}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDelete}
              filterType={filterType}
            />
          )}
          {view === 'tax' && <TaxSummary transactions={transactions} year={year} />}
        </div>
      </div>

      {modal && (
        <TransactionModal
          onSave={handleSave}
          onClose={closeModal}
          editData={modal !== 'add' ? modal : null}
        />
      )}
    </div>
  );
}
