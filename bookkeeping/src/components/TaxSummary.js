import React, { useMemo } from 'react';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const styles = {
  container: { padding: '32px 40px' },
  title: { fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: '#e8e8e0', marginBottom: 8 },
  subtitle: { color: '#666660', fontSize: '0.875rem', marginBottom: 28 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  card: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, padding: 24 },
  cardTitle: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
  },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.875rem' },
  rowLast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', fontSize: '0.95rem', fontWeight: 600 },
  label: { color: '#e8e8e0' },
  sublabel: { color: '#666660', fontSize: '0.8rem' },
  val: (color) => ({ fontFamily: "'DM Mono', monospace", color: color || '#e8e8e0', fontWeight: 500 }),
  noteBox: {
    background: 'rgba(200,240,96,0.05)', border: '1px solid rgba(200,240,96,0.2)',
    borderRadius: 8, padding: 20, marginBottom: 20,
  },
  noteTitle: { color: '#c8f060', fontWeight: 600, marginBottom: 8, fontSize: '0.875rem' },
  noteText: { color: '#666660', fontSize: '0.8rem', lineHeight: 1.6 },
  categoryTable: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, overflow: 'hidden' },
  th: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px',
    textAlign: 'left', fontWeight: 400, background: '#222',
  },
  td: { padding: '12px 16px', fontSize: '0.875rem', borderTop: '1px solid #2e2e2e' },
};

const CORP_TAX_RATE = 0.125; // ~12.5% small business rate Ontario
const HST_RATE = 0.13;

export default function TaxSummary({ transactions, year }) {
  const filtered = useMemo(() => transactions.filter(t => t.year === year), [transactions, year]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const draw = filtered.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0);
    const netProfit = income - expense;
    const estimatedCorpTax = Math.max(0, netProfit * CORP_TAX_RATE);
    const estimatedHST = income * HST_RATE;
    return { income, expense, draw, netProfit, estimatedCorpTax, estimatedHST };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <div style={styles.container}>
      <div style={styles.title}>Tax Summary — FY {year}</div>
      <div style={styles.subtitle}>Estimated figures for planning purposes only. Consult your accountant for final numbers.</div>

      <div style={styles.noteBox}>
        <div style={styles.noteTitle}>⚠️ Important Notes for Your Accountant</div>
        <div style={styles.noteText}>
          • Laptop purchased Feb 2026 is a capital asset (CCA Class 10/8) — not a full deduction in year 1<br/>
          • MyUS shipping and customs duties are deductible as part of equipment acquisition cost<br/>
          • Shareholder draws may be classified as salary or dividends — discuss optimal split with accountant<br/>
          • HST collected from Procom must be remitted to CRA — check your HST registration threshold<br/>
          • NTT Data employment income (from March 9) is separate personal T4 income — not corporate<br/>
          • RRSP contributions from bonus income reduce personal taxable income — track separately
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Corporate P&L Estimate</div>
          <div style={styles.row}>
            <span style={styles.label}>Gross Revenue</span>
            <span style={styles.val('#60f0a8')}>{fmt(totals.income)}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Total Deductible Expenses</span>
            <span style={styles.val('#f06060')}>-{fmt(totals.expense)}</span>
          </div>
          <div style={{ ...styles.row, borderBottom: 'none' }}>
            <span style={styles.label}>Net Corporate Profit</span>
            <span style={styles.val(totals.netProfit >= 0 ? '#60f0a8' : '#f06060')}>{fmt(totals.netProfit)}</span>
          </div>
          <div style={{ borderTop: '2px solid #2e2e2e', marginTop: 8, paddingTop: 12 }}>
            <div style={styles.rowLast}>
              <span style={styles.label}>Est. Corp Tax (~12.5%)</span>
              <span style={styles.val('#f0a860')}>{fmt(totals.estimatedCorpTax)}</span>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>HST Estimate</div>
          <div style={styles.row}>
            <span style={styles.label}>Revenue (HST base)</span>
            <span style={styles.val()}>{fmt(totals.income)}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>HST Collected (13%)</span>
            <span style={styles.val('#f0a860')}>{fmt(totals.estimatedHST)}</span>
          </div>
          <div style={{ ...styles.row, borderBottom: 'none' }}>
            <span style={{ ...styles.sublabel }}>Note: Verify if HST was actually charged on Procom invoices and check your remittance schedule with your accountant.</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Shareholder Draws Summary</div>
          <div style={styles.row}>
            <span style={styles.label}>Total Draws Taken</span>
            <span style={styles.val('#c8f060')}>{fmt(totals.draw)}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Corporate Profit Remaining</span>
            <span style={styles.val()}>{fmt(Math.max(0, totals.netProfit - totals.draw))}</span>
          </div>
          <div style={{ ...styles.row, borderBottom: 'none' }}>
            <span style={styles.sublabel}>Draws to be classified as salary or dividends at year end by your accountant</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Key Dates</div>
          {[
            { label: 'HST Remittance', val: 'Quarterly or Annual', sub: 'Confirm with accountant' },
            { label: 'Corp Tax Filing', val: 'June 30, 2027', sub: '6 months after fiscal year end' },
            { label: 'Personal T1 Filing', val: 'April 30, 2027', sub: 'Includes T4 from NTT Data' },
            { label: 'RRSP Deadline', val: 'March 1, 2027', sub: 'For 2026 tax year contributions' },
          ].map(item => (
            <div key={item.label} style={styles.row}>
              <div>
                <div style={styles.label}>{item.label}</div>
                <div style={styles.sublabel}>{item.sub}</div>
              </div>
              <span style={styles.val('#c8f060')}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {byCategory.length > 0 && (
        <>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Expenses by Category
          </div>
          <div style={styles.categoryTable}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={styles.th}>Category</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map(([cat, amt]) => (
                  <tr key={cat}>
                    <td style={styles.td}>{cat}</td>
                    <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace", color: '#f06060', textAlign: 'right' }}>{fmt(amt)}</td>
                    <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace", color: '#666660', textAlign: 'right' }}>
                      {totals.expense > 0 ? ((amt / totals.expense) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
