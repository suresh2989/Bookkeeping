import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CATEGORIES, upsertTransaction } from '../utils/storage';
import { getAttachmentsByTransaction, addAttachment, removeAttachment } from '../utils/db';

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
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#1a1a1a', border: '1px solid #2e2e2e',
    borderRadius: 12, padding: 32, width: 500, maxWidth: '95vw',
    maxHeight: '90vh', overflowY: 'auto',
  },
  title: {
    fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem',
    color: '#e8e8e0', marginBottom: 24,
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  full: { gridColumn: '1 / -1' },
  label: {
    display: 'block', fontFamily: "'DM Mono', monospace",
    fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    width: '100%', background: '#222', border: '1px solid #2e2e2e',
    color: '#e8e8e0', padding: '10px 14px', borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', background: '#222', border: '1px solid #2e2e2e',
    color: '#e8e8e0', padding: '10px 14px', borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem',
    outline: 'none', resize: 'vertical', minHeight: 70, boxSizing: 'border-box',
  },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
  cancelBtn: {
    padding: '10px 20px', background: 'transparent',
    border: '1px solid #2e2e2e', color: '#666660',
    borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.875rem',
  },
  saveBtn: {
    padding: '10px 24px', background: '#c8f060', color: '#0f0f0f',
    border: 'none', borderRadius: 6, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600,
  },
  typeRow: { display: 'flex', gap: 8, marginBottom: 20 },
  typeBtn: (active, type) => ({
    flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid',
    cursor: 'pointer', fontFamily: "'DM Mono', monospace",
    fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase',
    fontWeight: 500, transition: 'all 0.15s',
    background: active ? (type === 'income' ? 'rgba(96,240,168,0.15)' : type === 'expense' ? 'rgba(240,96,96,0.15)' : 'rgba(200,240,96,0.15)') : 'transparent',
    borderColor: active ? (type === 'income' ? '#60f0a8' : type === 'expense' ? '#f06060' : '#c8f060') : '#2e2e2e',
    color: active ? (type === 'income' ? '#60f0a8' : type === 'expense' ? '#f06060' : '#c8f060') : '#666660',
  }),
  dropzone: (dragging) => ({
    border: `2px dashed ${dragging ? '#c8f060' : '#2e2e2e'}`,
    borderRadius: 8, padding: '14px 20px', textAlign: 'center',
    cursor: 'pointer', background: dragging ? 'rgba(200,240,96,0.05)' : 'transparent',
    transition: 'all 0.15s', color: '#666660', fontSize: '0.8rem',
    fontFamily: "'DM Sans', sans-serif",
  }),
  attList: { marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  attItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
    background: '#222', borderRadius: 6, border: '1px solid #2e2e2e',
  },
  attName: {
    flex: 1, color: '#e8e8e0', fontSize: '0.8rem',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  attSize: {
    color: '#666660', fontFamily: "'DM Mono', monospace",
    fontSize: '0.7rem', flexShrink: 0,
  },
  attRemoveBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#666660', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem',
    flexShrink: 0,
  },
};

export default function TransactionModal({ onSave, onClose, editData }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    category: '',
    description: '',
    amount: '',
    notes: '',
  });

  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editData) setForm({ ...editData, amount: String(editData.amount) });
    if (editData?.id) {
      getAttachmentsByTransaction(editData.id).then(setExistingAttachments);
    }
  }, [editData]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFiles = (files) => {
    const MAX = 20 * 1024 * 1024;
    const valid = Array.from(files).filter(f => {
      if (f.size > MAX) { alert(`"${f.name}" exceeds 20 MB and was skipped.`); return false; }
      return true;
    });
    setNewFiles(prev => [...prev, ...valid.map(f => ({ id: uuidv4(), file: f, name: f.name, size: f.size, type: f.type }))]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeExisting = (id) => {
    setRemovedIds(r => [...r, id]);
    setExistingAttachments(a => a.filter(x => x.id !== id));
  };

  const removeNew = (id) => setNewFiles(f => f.filter(x => x.id !== id));

  const handleSave = async () => {
    if (!form.date || !form.description || !form.amount || !form.category) {
      alert('Please fill in Date, Description, Category and Amount.');
      return;
    }
    const parsed = parseFloat(form.amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const txId = editData?.id || uuidv4();
    const txData = { ...form, id: txId, amount: parsed, year: new Date(form.date).getFullYear() };

    // 1. Save transaction first (attachments have a FK dependency on it)
    await upsertTransaction(txData);

    // 2. Then save/remove attachments
    await Promise.all(removedIds.map(id => removeAttachment(id)));
    await Promise.all(newFiles.map(nf => addAttachment({
      id: nf.id,
      transactionId: txId,
      name: nf.name,
      type: nf.type,
      size: nf.size,
      blob: nf.file,
    })));

    // 3. Notify App.js to update local state
    onSave(txData);
  };

  const totalAttachments = existingAttachments.length + newFiles.length;

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.title}>{editData ? 'Edit Transaction' : 'Add Transaction'}</div>

        <div style={styles.typeRow}>
          {['income', 'expense', 'draw'].map(t => (
            <button key={t} style={styles.typeBtn(form.type === t, t)} onClick={() => { set('type', t); set('category', ''); }}>
              {t === 'income' ? '💰 Income' : t === 'expense' ? '🧾 Expense' : '🏦 Draw'}
            </button>
          ))}
        </div>

        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Date</label>
            <input style={styles.input} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Amount (CAD)</label>
            <input style={styles.input} type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>

          <div style={styles.full}>
            <label style={styles.label}>Category</label>
            <select style={styles.input} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES[form.type]?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.full}>
            <label style={styles.label}>Description</label>
            <input style={styles.input} type="text" placeholder="Brief description..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div style={styles.full}>
            <label style={styles.label}>Notes (optional)</label>
            <textarea style={styles.textarea} placeholder="Additional details for your accountant..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={styles.full}>
            <label style={styles.label}>Attachments {totalAttachments > 0 && `(${totalAttachments})`}</label>

            <div
              style={styles.dropzone(dragging)}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              📎 Drop files here or click to upload · Max 20 MB per file
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            />

            {(existingAttachments.length > 0 || newFiles.length > 0) && (
              <div style={styles.attList}>
                {existingAttachments.map(att => (
                  <div key={att.id} style={styles.attItem}>
                    <span>{fileIcon(att.type)}</span>
                    <span style={styles.attName}>{att.name}</span>
                    <span style={styles.attSize}>{fmtSize(att.size)}</span>
                    <button style={styles.attRemoveBtn} onClick={() => removeExisting(att.id)} title="Remove">✕</button>
                  </div>
                ))}
                {newFiles.map(nf => (
                  <div key={nf.id} style={{ ...styles.attItem, borderColor: 'rgba(200,240,96,0.25)' }}>
                    <span>{fileIcon(nf.type)}</span>
                    <span style={styles.attName}>{nf.name}</span>
                    <span style={styles.attSize}>{fmtSize(nf.size)}</span>
                    <span style={{ ...styles.attSize, color: '#c8f060', marginLeft: 4 }}>new</span>
                    <button style={styles.attRemoveBtn} onClick={() => removeNew(nf.id)} title="Remove">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={handleSave}>{editData ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
