import React, { useState, useEffect, useMemo } from 'react';
import { loadTransactions, deleteTransaction } from './utils/storage';
import { removeAttachmentsByTransaction } from './utils/db';
import { supabase } from './utils/supabase';
import useIsMobile from './utils/useIsMobile';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import TaxSummary from './components/TaxSummary';
import TransactionModal from './components/TransactionModal';
import Login from './components/Login';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const navBtnStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
  borderRadius: 6, border: 'none', background: active ? '#222' : 'transparent',
  color: active ? '#c8f060' : '#666660', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
  textAlign: 'left', width: '100%', transition: 'all 0.15s',
});

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState('dashboard');
  const [year, setYear] = useState(2026);
  const [modal, setModal] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const isMobile = useIsMobile();

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

  useEffect(() => {
    if (session) {
      loadTransactions().then(setTransactions).catch(console.error);
    } else {
      setTransactions([]);
    }
  }, [session]);

  const handleSave = (tx) => {
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

  const yearTotals = useMemo(() => {
    const yt = transactions.filter(t => t.year === year);
    const income = yt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = yt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const draw = yt.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0);
    return { income, expense, draw, net: income - expense };
  }, [transactions, year]);

  const navTo = (v, type) => { setView(v); if (type) setFilterType(type); };
  const openAdd = () => setModal('add');
  const openEdit = (tx) => setModal(tx);
  const closeModal = () => setModal(null);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", color: '#666660' }}>
      Loading...
    </div>
  );
  if (!session) return <Login />;

  const mainContent = (
    <>
      {view === 'dashboard' && <Dashboard transactions={transactions} year={year} />}
      {view === 'transactions' && <Transactions transactions={transactions} year={year} onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} filterType={filterType} />}
      {view === 'tax' && <TaxSummary transactions={transactions} year={year} />}
    </>
  );

  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid #2e2e2e', padding: isMobile ? '12px 16px' : '20px 40px',
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? '1.1rem' : '1.4rem', color: '#c8f060' }}>Corporate Books</div>
          {!isMobile && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Suresh Kumar Sivasubramaniam · Incorporated</div>}
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center', flexWrap: 'nowrap' }}>
          {[2026, 2025, 2024].map(y => (
            <button key={y} onClick={() => setYear(y)} style={{
              fontFamily: "'DM Mono', monospace", fontSize: isMobile ? '0.6rem' : '0.72rem',
              padding: isMobile ? '5px 7px' : '6px 14px',
              border: `1px solid ${year === y ? '#c8f060' : '#2e2e2e'}`,
              background: 'transparent', color: year === y ? '#c8f060' : '#666660',
              cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap',
            }}>FY {y}</button>
          ))}
          <button onClick={() => supabase.auth.signOut()} style={{
            fontFamily: "'DM Mono', monospace", fontSize: isMobile ? '0.6rem' : '0.68rem',
            padding: isMobile ? '5px 7px' : '6px 14px',
            border: '1px solid #2e2e2e', background: 'transparent',
            color: '#666660', cursor: 'pointer', borderRadius: 4, marginLeft: 4, whiteSpace: 'nowrap',
          }}>Sign Out</button>
        </div>
      </div>

      {/* Body */}
      {isMobile ? (
        <div style={{ paddingBottom: 68 }}>{mainContent}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 65px)' }}>
          {/* Desktop sidebar */}
          <div style={{ background: '#1a1a1a', borderRight: '1px solid #2e2e2e', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#666660', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 4 }}>Navigation</div>
            {[{ id: 'dashboard', label: 'Dashboard', icon: '📊' }, { id: 'transactions', label: 'All Transactions', icon: '📋' }].map(n => (
              <button key={n.id} style={navBtnStyle(view === n.id)} onClick={() => navTo(n.id)}>
                <span style={{ width: 20, textAlign: 'center' }}>{n.icon}</span> {n.label}
              </button>
            ))}
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#666660', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 4, marginTop: 12 }}>By Type</div>
            {[{ type: 'income', label: 'Income', icon: '💰' }, { type: 'expense', label: 'Expenses', icon: '🧾' }, { type: 'draw', label: 'Draws', icon: '🏦' }].map(n => (
              <button key={n.type} style={navBtnStyle(view === 'transactions' && filterType === n.type)} onClick={() => navTo('transactions', n.type)}>
                <span style={{ width: 20, textAlign: 'center' }}>{n.icon}</span> {n.label}
              </button>
            ))}
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#666660', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 4, marginTop: 12 }}>Reports</div>
            <button style={navBtnStyle(view === 'tax')} onClick={() => navTo('tax')}>
              <span style={{ width: 20, textAlign: 'center' }}>🇨🇦</span> Tax Summary
            </button>
            <div style={{ marginTop: 'auto', background: '#222', border: '1px solid #2e2e2e', borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>FY {year} Summary</div>
              {[{ label: 'Income', val: yearTotals.income, color: '#60f0a8' }, { label: 'Expenses', val: yearTotals.expense, color: '#f06060' }, { label: 'Draws', val: yearTotals.draw, color: '#c8f060' }].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8rem' }}>
                  <span>{r.label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", color: r.color, fontSize: '0.85rem' }}>{fmt(r.val)}</span>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid #2e2e2e', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600 }}>Net Profit</span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: yearTotals.net >= 0 ? '#60f0a8' : '#f06060', fontSize: '1rem' }}>{fmt(yearTotals.net)}</span>
              </div>
            </div>
          </div>
          <div style={{ overflowY: 'auto' }}>{mainContent}</div>
        </div>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#1a1a1a', borderTop: '1px solid #2e2e2e', display: 'flex', height: 62 }}>
          {[{ id: 'dashboard', icon: '📊', label: 'Dashboard' }, { id: 'transactions', icon: '📋', label: 'Transactions' }, { id: 'tax', icon: '🇨🇦', label: 'Tax' }].map(n => (
            <button key={n.id} onClick={() => navTo(n.id)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              color: view === n.id ? '#c8f060' : '#666660',
              borderTop: `2px solid ${view === n.id ? '#c8f060' : 'transparent'}`,
            }}>
              <span style={{ fontSize: '1.2rem' }}>{n.icon}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.52rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{n.label}</span>
            </button>
          ))}
          <button onClick={openAdd} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            color: '#c8f060', borderTop: '2px solid transparent',
          }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>＋</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.52rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Add</span>
          </button>
        </div>
      )}

      {modal && <TransactionModal onSave={handleSave} onClose={closeModal} editData={modal !== 'add' ? modal : null} />}
    </div>
  );
}
