import React, { useMemo } from 'react';
import useIsMobile from '../utils/useIsMobile';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CORP_TAX_RATE = 0.125;
const HST_RATE = 0.13;

export default function TaxSummary({ transactions, year }) {
  const isMobile = useIsMobile();
  const filtered = useMemo(() => transactions.filter(t => t.year === year), [transactions, year]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const draw = filtered.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0);
    const netProfit = income - expense;
    return { income, expense, draw, netProfit, estimatedCorpTax: Math.max(0, netProfit * CORP_TAX_RATE), estimatedHST: income * HST_RATE };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.filter(t => t.type === 'expense').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const pad = isMobile ? '20px 16px' : '32px 40px';
  const card = { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, padding: isMobile ? 16 : 24 };
  const cardTitle = { fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 };
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.875rem' };
  const val = (color) => ({ fontFamily: "'DM Mono', monospace", color: color || '#e8e8e0', fontWeight: 500 });

  return (
    <div style={{ padding: pad }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#e8e8e0', marginBottom: 6 }}>Tax Summary — FY {year}</div>
      <div style={{ color: '#666660', fontSize: '0.875rem', marginBottom: 24 }}>Estimated figures for planning purposes only. Consult your accountant.</div>

      <div style={{ background: 'rgba(200,240,96,0.05)', border: '1px solid rgba(200,240,96,0.2)', borderRadius: 8, padding: isMobile ? 14 : 20, marginBottom: 20 }}>
        <div style={{ color: '#c8f060', fontWeight: 600, marginBottom: 8, fontSize: '0.875rem' }}>⚠️ Important Notes for Your Accountant</div>
        <div style={{ color: '#666660', fontSize: '0.8rem', lineHeight: 1.7 }}>
          • Laptop purchased Feb 2026 is a capital asset (CCA Class 10/8) — not a full deduction in year 1<br />
          • MyUS shipping and customs duties are deductible as part of equipment acquisition cost<br />
          • Shareholder draws may be classified as salary or dividends — discuss optimal split with accountant<br />
          • HST collected from Procom must be remitted to CRA — check your HST registration threshold<br />
          • NTT Data employment income (from March 9) is separate personal T4 income — not corporate<br />
          • RRSP contributions from bonus income reduce personal taxable income — track separately
        </div>
      </div>

      {/* Cards grid: 1 col on mobile, 2 cols on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20, marginBottom: 24 }}>
        <div style={card}>
          <div style={cardTitle}>Corporate P&L Estimate</div>
          <div style={row}><span>Gross Revenue</span><span style={val('#60f0a8')}>{fmt(totals.income)}</span></div>
          <div style={row}><span>Total Deductible Expenses</span><span style={val('#f06060')}>-{fmt(totals.expense)}</span></div>
          <div style={{ ...row, borderBottom: 'none' }}><span>Net Corporate Profit</span><span style={val(totals.netProfit >= 0 ? '#60f0a8' : '#f06060')}>{fmt(totals.netProfit)}</span></div>
          <div style={{ borderTop: '2px solid #2e2e2e', marginTop: 8, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600 }}>
              <span>Est. Corp Tax (~12.5%)</span><span style={val('#f0a860')}>{fmt(totals.estimatedCorpTax)}</span>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}>HST Estimate</div>
          <div style={row}><span>Revenue (HST base)</span><span style={val()}>{fmt(totals.income)}</span></div>
          <div style={row}><span>HST Collected (13%)</span><span style={val('#f0a860')}>{fmt(totals.estimatedHST)}</span></div>
          <div style={{ ...row, borderBottom: 'none' }}><span style={{ color: '#666660', fontSize: '0.8rem' }}>Verify HST was charged on Procom invoices and check remittance schedule with accountant.</span></div>
        </div>

        <div style={card}>
          <div style={cardTitle}>Shareholder Draws Summary</div>
          <div style={row}><span>Total Draws Taken</span><span style={val('#c8f060')}>{fmt(totals.draw)}</span></div>
          <div style={row}><span>Corporate Profit Remaining</span><span style={val()}>{fmt(Math.max(0, totals.netProfit - totals.draw))}</span></div>
          <div style={{ ...row, borderBottom: 'none' }}><span style={{ color: '#666660', fontSize: '0.8rem' }}>Draws to be classified as salary or dividends at year end</span></div>
        </div>

        <div style={card}>
          <div style={cardTitle}>Key Dates</div>
          {[
            { label: 'HST Remittance', val: 'Quarterly or Annual', sub: 'Confirm with accountant' },
            { label: 'Corp Tax Filing', val: 'June 30, 2027', sub: '6 months after fiscal year end' },
            { label: 'Personal T1 Filing', val: 'April 30, 2027', sub: 'Includes T4 from NTT Data' },
            { label: 'RRSP Deadline', val: 'March 1, 2027', sub: 'For 2026 tax year' },
          ].map(item => (
            <div key={item.label} style={row}>
              <div>
                <div style={{ color: '#e8e8e0' }}>{item.label}</div>
                <div style={{ color: '#666660', fontSize: '0.8rem' }}>{item.sub}</div>
              </div>
              <span style={val('#c8f060')}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {byCategory.length > 0 && (
        <>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Expenses by Category</div>
          <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px', textAlign: 'left', fontWeight: 400, background: '#222' }}>Category</th>
                  <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px', textAlign: 'right', fontWeight: 400, background: '#222' }}>Amount</th>
                  {!isMobile && <th style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px', textAlign: 'right', fontWeight: 400, background: '#222' }}>% of Total</th>}
                </tr>
              </thead>
              <tbody>
                {byCategory.map(([cat, amt]) => (
                  <tr key={cat}>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', borderTop: '1px solid #2e2e2e' }}>{cat}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", color: '#f06060', textAlign: 'right', borderTop: '1px solid #2e2e2e' }}>{fmt(amt)}</td>
                    {!isMobile && <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", color: '#666660', textAlign: 'right', borderTop: '1px solid #2e2e2e' }}>{totals.expense > 0 ? ((amt / totals.expense) * 100).toFixed(1) : 0}%</td>}
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
