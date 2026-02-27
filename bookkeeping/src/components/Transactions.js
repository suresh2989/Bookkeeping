import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { exportToCSV } from '../utils/storage';
import { getAllAttachmentCounts, getAttachmentsByTransaction } from '../utils/db';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const fileIcon = (type) => {
  if (type.startsWith('image/')) return '🖼';
  if (type === 'application/pdf') return '📄';
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
  if (type.includes('word') || type.includes('document')) return '📝';
  return '📎';
};

const styles = {
  container: { padding: '32px 40px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: '#e8e8e0' },
  btnsRow: { display: 'flex', gap: 10 },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
    background: 'transparent', border: '1px solid #2e2e2e', color: '#666660',
    borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: '#c8f060', color: '#0f0f0f', border: 'none', borderRadius: 6,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600,
  },
  filterRow: {
    display: 'flex', gap: 8, padding: '14px 16px', borderBottom: '1px solid #2e2e2e',
    alignItems: 'center', background: '#222', borderRadius: '8px 8px 0 0',
  },
  filterBtn: (active) => ({
    fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', padding: '5px 12px',
    border: `1px solid ${active ? '#c8f060' : '#2e2e2e'}`,
    background: active ? 'rgba(200,240,96,0.05)' : 'transparent',
    color: active ? '#c8f060' : '#666660', cursor: 'pointer', borderRadius: 4,
    letterSpacing: '0.05em', textTransform: 'uppercase',
  }),
  searchInput: {
    marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #2e2e2e',
    color: '#e8e8e0', padding: '6px 14px', borderRadius: 4,
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', outline: 'none', width: 220,
  },
  tableWrap: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, overflow: 'hidden' },
  th: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px',
    textAlign: 'left', fontWeight: 400, background: '#222',
  },
  td: { padding: '14px 16px', fontSize: '0.875rem', borderTop: '1px solid #2e2e2e', verticalAlign: 'middle' },
  badge: (type) => ({
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', padding: '3px 8px',
    borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.08em',
    background: type === 'income' ? 'rgba(96,240,168,0.1)' : type === 'expense' ? 'rgba(240,96,96,0.1)' : 'rgba(200,240,96,0.1)',
    color: type === 'income' ? '#60f0a8' : type === 'expense' ? '#f06060' : '#c8f060',
    border: `1px solid ${type === 'income' ? 'rgba(96,240,168,0.2)' : type === 'expense' ? 'rgba(240,96,96,0.2)' : 'rgba(200,240,96,0.2)'}`,
  }),
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
    borderRadius: 4, color: '#666660', fontSize: '0.85rem', marginLeft: 4,
  },
  attBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'rgba(200,240,96,0.08)', border: '1px solid rgba(200,240,96,0.2)',
    color: '#c8f060', borderRadius: 4, padding: '3px 8px',
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  emptyState: { padding: '60px 20px', textAlign: 'center', color: '#666660' },
  summaryBar: {
    display: 'flex', gap: 24, padding: '12px 16px', background: '#111',
    borderTop: '1px solid #2e2e2e', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem',
  },
  // Attachment viewer
  viewerOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, backdropFilter: 'blur(4px)',
  },
  viewerBox: {
    background: '#1a1a1a', border: '1px solid #2e2e2e',
    borderRadius: 12, padding: 28, width: 480, maxWidth: '95vw',
    maxHeight: '80vh', overflowY: 'auto',
  },
  viewerTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem',
    color: '#e8e8e0', marginBottom: 6,
  },
  viewerSub: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20,
  },
  viewerItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    background: '#222', borderRadius: 8, border: '1px solid #2e2e2e', marginBottom: 8,
  },
  viewerItemName: { flex: 1, color: '#e8e8e0', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  viewerItemSize: { color: '#666660', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', flexShrink: 0 },
  openBtn: {
    padding: '5px 14px', background: 'transparent', border: '1px solid #c8f060',
    color: '#c8f060', borderRadius: 5, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', flexShrink: 0,
  },
  viewerClose: {
    marginTop: 16, width: '100%', padding: '10px', background: 'transparent',
    border: '1px solid #2e2e2e', color: '#666660', borderRadius: 6,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
  },
};

export default function Transactions({ transactions, year, onAdd, onEdit, onDelete, filterType }) {
  const [activeFilter, setActiveFilter] = useState(filterType || 'all');
  const [search, setSearch] = useState('');
  const [attCounts, setAttCounts] = useState({});
  const [viewer, setViewer] = useState(null); // null | { tx, attachments }

  useEffect(() => {
    getAllAttachmentCounts().then(setAttCounts);
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => t.year === year)
      .filter(t => activeFilter === 'all' || t.type === activeFilter)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, year, activeFilter, search]);

  const totals = useMemo(() => ({
    income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    draw: filtered.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0),
  }), [filtered]);

  const openViewer = async (t) => {
    const attachments = await getAttachmentsByTransaction(t.id);
    setViewer({ tx: t, attachments });
  };

  const openFile = (att) => {
    const url = URL.createObjectURL(att.blob);
    if (att.type.startsWith('image/') || att.type === 'application/pdf') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Transactions — FY {year}</div>
        <div style={styles.btnsRow}>
          <button style={styles.exportBtn} onClick={() => exportToCSV(filtered)}>⬇ Export CSV</button>
          <button style={styles.addBtn} onClick={onAdd}>+ Add Transaction</button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <div style={styles.filterRow}>
          {['all', 'income', 'expense', 'draw'].map(f => (
            <button key={f} style={styles.filterBtn(activeFilter === f)} onClick={() => setActiveFilter(f)}>
              {f === 'all' ? 'All' : f === 'income' ? '💰 Income' : f === 'expense' ? '🧾 Expenses' : '🏦 Draws'}
            </button>
          ))}
          <input
            style={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Type', 'Description', 'Category', 'Notes', 'Amount', ''].map(h => (
                <th key={h} style={{ ...styles.th, textAlign: h === 'Amount' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.emptyState}>
                  <div style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.3 }}>📋</div>
                  <div>No transactions found</div>
                </td>
              </tr>
            ) : filtered.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #2e2e2e' }}>
                <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#666660', whiteSpace: 'nowrap' }}>
                  {format(parseISO(t.date), 'MMM d, yyyy')}
                </td>
                <td style={styles.td}><span style={styles.badge(t.type)}>{t.type}</span></td>
                <td style={styles.td}>{t.description}</td>
                <td style={{ ...styles.td, color: '#666660', fontSize: '0.8rem' }}>{t.category}</td>
                <td style={{ ...styles.td, color: '#666660', fontSize: '0.75rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.notes || '—'}
                </td>
                <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace", fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap',
                  color: t.type === 'income' ? '#60f0a8' : t.type === 'expense' ? '#f06060' : '#c8f060' }}>
                  {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                </td>
                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                  {attCounts[t.id] > 0 && (
                    <button style={styles.attBadge} onClick={() => openViewer(t)} title="View attachments">
                      📎 {attCounts[t.id]}
                    </button>
                  )}
                  <button style={styles.actionBtn} onClick={() => onEdit(t)} title="Edit">✏️</button>
                  <button style={{ ...styles.actionBtn, color: '#666660' }} onClick={() => { if (window.confirm('Delete this transaction?')) onDelete(t.id); }} title="Delete">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.summaryBar}>
          <span style={{ color: '#666660' }}>{filtered.length} records</span>
          {totals.income > 0 && <span style={{ color: '#60f0a8' }}>Income: {fmt(totals.income)}</span>}
          {totals.expense > 0 && <span style={{ color: '#f06060' }}>Expenses: -{fmt(totals.expense)}</span>}
          {totals.draw > 0 && <span style={{ color: '#c8f060' }}>Draws: {fmt(totals.draw)}</span>}
        </div>
      </div>

      {viewer && (
        <div style={styles.viewerOverlay} onClick={e => e.target === e.currentTarget && setViewer(null)}>
          <div style={styles.viewerBox}>
            <div style={styles.viewerTitle}>📎 Attachments</div>
            <div style={styles.viewerSub}>{viewer.tx.description} · {format(parseISO(viewer.tx.date), 'MMM d, yyyy')}</div>

            {viewer.attachments.length === 0 ? (
              <div style={{ color: '#666660', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                No attachments found.
              </div>
            ) : viewer.attachments.map(att => (
              <div key={att.id} style={styles.viewerItem}>
                <span style={{ fontSize: '1.2rem' }}>{fileIcon(att.type)}</span>
                <span style={styles.viewerItemName}>{att.name}</span>
                <span style={styles.viewerItemSize}>{fmtSize(att.size)}</span>
                <button style={styles.openBtn} onClick={() => openFile(att)}>Open</button>
              </div>
            ))}

            <button style={styles.viewerClose} onClick={() => setViewer(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
