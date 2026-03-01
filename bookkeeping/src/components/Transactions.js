import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { exportToCSV } from '../utils/storage';
import { getAllAttachmentCounts, getAttachmentsByTransaction, getAttachmentUrl } from '../utils/db';
import useIsMobile from '../utils/useIsMobile';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSize = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const fileIcon = (type) => type.startsWith('image/') ? '🖼' : type === 'application/pdf' ? '📄' : '📎';

const badge = (type) => ({
  fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', padding: '3px 8px',
  borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.08em',
  background: type === 'income' ? 'rgba(96,240,168,0.1)' : type === 'expense' ? 'rgba(240,96,96,0.1)' : 'rgba(200,240,96,0.1)',
  color: type === 'income' ? '#60f0a8' : type === 'expense' ? '#f06060' : '#c8f060',
  border: `1px solid ${type === 'income' ? 'rgba(96,240,168,0.2)' : type === 'expense' ? 'rgba(240,96,96,0.2)' : 'rgba(200,240,96,0.2)'}`,
});

const s = {
  filterBtn: (active) => ({
    fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', padding: '5px 10px',
    border: `1px solid ${active ? '#c8f060' : '#2e2e2e'}`,
    background: active ? 'rgba(200,240,96,0.05)' : 'transparent',
    color: active ? '#c8f060' : '#666660', cursor: 'pointer', borderRadius: 4,
    letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
  }),
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, color: '#666660', fontSize: '0.85rem' },
  attBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'rgba(200,240,96,0.08)', border: '1px solid rgba(200,240,96,0.2)',
    color: '#c8f060', borderRadius: 4, padding: '3px 7px',
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', cursor: 'pointer',
  },
  openBtn: { padding: '5px 14px', background: 'transparent', border: '1px solid #c8f060', color: '#c8f060', borderRadius: 5, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', flexShrink: 0 },
};

export default function Transactions({ transactions, year, onAdd, onEdit, onDelete, filterType }) {
  const [activeFilter, setActiveFilter] = useState(filterType || 'all');
  const [search, setSearch] = useState('');
  const [attCounts, setAttCounts] = useState({});
  const [viewer, setViewer] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => { getAllAttachmentCounts().then(setAttCounts); }, [transactions]);

  const filtered = useMemo(() => transactions
    .filter(t => t.year === year)
    .filter(t => activeFilter === 'all' || t.type === activeFilter)
    .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, year, activeFilter, search]);

  const totals = useMemo(() => ({
    income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    draw: filtered.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0),
  }), [filtered]);

  const openViewer = async (t) => setViewer({ tx: t, attachments: await getAttachmentsByTransaction(t.id) });
  const openFile = async (att) => {
    try { window.open(await getAttachmentUrl(att.storage_path), '_blank', 'noopener,noreferrer'); }
    catch (e) { alert('Could not open file: ' + e.message); }
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#e8e8e0' }}>Transactions — FY {year}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isMobile && (
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'transparent', border: '1px solid #2e2e2e', color: '#666660', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }} onClick={() => exportToCSV(filtered)}>⬇ Export CSV</button>
          )}
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '8px 14px' : '10px 20px', background: '#c8f060', color: '#0f0f0f', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600 }} onClick={onAdd}>+ Add</button>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 14px', borderBottom: '1px solid #2e2e2e', alignItems: 'center', background: '#222', overflowX: 'auto' }}>
          {['all', 'income', 'expense', 'draw'].map(f => (
            <button key={f} style={s.filterBtn(activeFilter === f)} onClick={() => setActiveFilter(f)}>
              {f === 'all' ? 'All' : f === 'income' ? '💰 Income' : f === 'expense' ? '🧾 Expense' : '🏦 Draw'}
            </button>
          ))}
          {!isMobile && (
            <input style={{ marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #2e2e2e', color: '#e8e8e0', padding: '6px 14px', borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', outline: 'none', width: 200 }}
              placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          )}
        </div>

        {/* Mobile search */}
        {isMobile && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #2e2e2e' }}>
            <input style={{ width: '100%', background: '#222', border: '1px solid #2e2e2e', color: '#e8e8e0', padding: '8px 12px', borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666660' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.3 }}>📋</div>
            <div>No transactions found</div>
          </div>
        ) : isMobile ? (
          // Mobile cards
          filtered.map(t => (
            <div key={t.id} style={{ padding: '14px 16px', borderTop: '1px solid #2e2e2e' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', color: '#e8e8e0', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={badge(t.type)}>{t.type}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660' }}>{format(parseISO(t.date), 'MMM d, yyyy')}</span>
                    {attCounts[t.id] > 0 && <button style={s.attBadge} onClick={() => openViewer(t)}>📎 {attCounts[t.id]}</button>}
                  </div>
                  {t.notes && <div style={{ fontSize: '0.75rem', color: '#666660', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: '0.95rem', color: t.type === 'income' ? '#60f0a8' : t.type === 'expense' ? '#f06060' : '#c8f060' }}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                  </span>
                  <div style={{ display: 'flex' }}>
                    <button style={s.actionBtn} onClick={() => onEdit(t)}>✏️</button>
                    <button style={s.actionBtn} onClick={() => { if (window.confirm('Delete?')) onDelete(t.id); }}>🗑</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Desktop table
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Date', 'Type', 'Description', 'Category', 'Notes', 'Amount', ''].map(h => (
                <th key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 400, background: '#222' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', borderTop: '1px solid #2e2e2e', fontFamily: "'DM Mono', monospace", color: '#666660', whiteSpace: 'nowrap' }}>{format(parseISO(t.date), 'MMM d, yyyy')}</td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #2e2e2e' }}><span style={badge(t.type)}>{t.type}</span></td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', borderTop: '1px solid #2e2e2e' }}>{t.description}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#666660', borderTop: '1px solid #2e2e2e' }}>{t.category}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: '#666660', borderTop: '1px solid #2e2e2e', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                  <td style={{ padding: '14px 16px', fontFamily: "'DM Mono', monospace", fontWeight: 500, textAlign: 'right', borderTop: '1px solid #2e2e2e', whiteSpace: 'nowrap', color: t.type === 'income' ? '#60f0a8' : t.type === 'expense' ? '#f06060' : '#c8f060' }}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #2e2e2e', whiteSpace: 'nowrap' }}>
                    {attCounts[t.id] > 0 && <button style={s.attBadge} onClick={() => openViewer(t)}>📎 {attCounts[t.id]}</button>}
                    <button style={{ ...s.actionBtn, marginLeft: 4 }} onClick={() => onEdit(t)}>✏️</button>
                    <button style={{ ...s.actionBtn, marginLeft: 4 }} onClick={() => { if (window.confirm('Delete this transaction?')) onDelete(t.id); }}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: isMobile ? 10 : 24, padding: '12px 16px', background: '#111', borderTop: '1px solid #2e2e2e', fontFamily: "'DM Mono', monospace", fontSize: isMobile ? '0.7rem' : '0.8rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#666660' }}>{filtered.length} records</span>
          {totals.income > 0 && <span style={{ color: '#60f0a8' }}>Income: {fmt(totals.income)}</span>}
          {totals.expense > 0 && <span style={{ color: '#f06060' }}>Exp: -{fmt(totals.expense)}</span>}
          {totals.draw > 0 && <span style={{ color: '#c8f060' }}>Draws: {fmt(totals.draw)}</span>}
        </div>
      </div>

      {/* Attachment viewer */}
      {viewer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setViewer(null)}>
          <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 12, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: '#e8e8e0', marginBottom: 4 }}>📎 Attachments</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>{viewer.tx.description} · {format(parseISO(viewer.tx.date), 'MMM d, yyyy')}</div>
            {viewer.attachments.length === 0 ? (
              <div style={{ color: '#666660', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No attachments found.</div>
            ) : viewer.attachments.map(att => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#222', borderRadius: 8, border: '1px solid #2e2e2e', marginBottom: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>{fileIcon(att.type)}</span>
                <span style={{ flex: 1, color: '#e8e8e0', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                <span style={{ color: '#666660', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', flexShrink: 0 }}>{fmtSize(att.size)}</span>
                <button style={s.openBtn} onClick={() => openFile(att)}>Open</button>
              </div>
            ))}
            <button style={{ marginTop: 16, width: '100%', padding: '10px', background: 'transparent', border: '1px solid #2e2e2e', color: '#666660', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }} onClick={() => setViewer(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
