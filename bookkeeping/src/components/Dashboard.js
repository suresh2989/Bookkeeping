import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import useIsMobile from '../utils/useIsMobile';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const badge = (type) => ({
  fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', padding: '3px 8px',
  borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.08em',
  background: type === 'income' ? 'rgba(96,240,168,0.1)' : type === 'expense' ? 'rgba(240,96,96,0.1)' : 'rgba(200,240,96,0.1)',
  color: type === 'income' ? '#60f0a8' : type === 'expense' ? '#f06060' : '#c8f060',
  border: `1px solid ${type === 'income' ? 'rgba(96,240,168,0.2)' : type === 'expense' ? 'rgba(240,96,96,0.2)' : 'rgba(200,240,96,0.2)'}`,
});

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: '#222', border: '1px solid #2e2e2e', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#666660', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: '0.8rem', color: p.fill, fontFamily: "'DM Mono', monospace" }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ transactions, year }) {
  const isMobile = useIsMobile();
  const filtered = useMemo(() => transactions.filter(t => t.year === year), [transactions, year]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const draw = filtered.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0);
    return { income, expense, draw, net: income - expense };
  }, [filtered]);

  const monthlyData = useMemo(() => MONTHS.map((month, i) => {
    const monthTx = filtered.filter(t => new Date(t.date).getMonth() === i);
    return {
      month,
      Income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      Expenses: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }), [filtered]);

  const pieData = useMemo(() => [
    { name: 'Income', value: totals.income, color: '#60f0a8' },
    { name: 'Expenses', value: totals.expense, color: '#f06060' },
    { name: 'Draws', value: totals.draw, color: '#c8f060' },
  ].filter(d => d.value > 0), [totals]);

  const recent = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const pad = isMobile ? '20px 16px' : '32px 40px';

  const stats = [
    { label: 'Total Income', val: totals.income, color: '#60f0a8', sub: `${filtered.filter(t => t.type === 'income').length} transactions` },
    { label: 'Total Expenses', val: totals.expense, color: '#f06060', sub: `${filtered.filter(t => t.type === 'expense').length} transactions` },
    { label: 'Draws', val: totals.draw, color: '#c8f060', sub: `${filtered.filter(t => t.type === 'draw').length} transactions` },
    { label: 'Net Profit', val: totals.net, color: totals.net >= 0 ? '#60f0a8' : '#f06060', sub: 'Before tax' },
  ];

  return (
    <div style={{ padding: pad }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#e8e8e0', marginBottom: 20 }}>
        Dashboard — FY {year}
      </div>

      {/* Stat cards: 2x2 on mobile, 4x1 on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, padding: isMobile ? 14 : 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: isMobile ? '0.55rem' : '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 500, color: s.color }}>{fmt(s.val)}</div>
            {!isMobile && <div style={{ fontSize: '0.75rem', color: '#666660', marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts: stacked on mobile, side-by-side on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile ? 12 : 20, marginBottom: 24 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, padding: isMobile ? 16 : 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Monthly Income vs Expenses</div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <BarChart data={monthlyData} barSize={isMobile ? 6 : 10}>
              <XAxis dataKey="month" tick={{ fill: '#666660', fontSize: isMobile ? 9 : 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666660', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} width={isMobile ? 45 : 55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Income" fill="#60f0a8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f06060" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, padding: isMobile ? 16 : 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Breakdown</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={isMobile ? 40 : 55} outerRadius={isMobile ? 65 : 85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend formatter={val => <span style={{ color: '#e8e8e0', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>{val}</span>} />
                <Tooltip formatter={val => fmt(val)} contentStyle={{ background: '#222', border: '1px solid #2e2e2e', borderRadius: 6, fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#666660' }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px', background: '#222' }}>
          Recent Transactions
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666660' }}>No transactions yet</div>
        ) : isMobile ? (
          // Mobile: card list
          recent.map(t => (
            <div key={t.id} style={{ padding: '12px 16px', borderTop: '1px solid #2e2e2e', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', color: '#e8e8e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={badge(t.type)}>{t.type}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660' }}>{format(parseISO(t.date), 'MMM d')}</span>
                </div>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: '0.9rem', flexShrink: 0, color: t.type === 'income' ? '#60f0a8' : t.type === 'expense' ? '#f06060' : '#c8f060' }}>
                {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
              </span>
            </div>
          ))
        ) : (
          // Desktop: table
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Date', 'Type', 'Description', 'Category', 'Amount'].map(h => (
                <th key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 400, background: '#222' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recent.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', borderTop: '1px solid #2e2e2e', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#666660' }}>{format(parseISO(t.date), 'MMM d, yyyy')}</td>
                  <td style={{ padding: '12px 16px', borderTop: '1px solid #2e2e2e' }}><span style={badge(t.type)}>{t.type}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', borderTop: '1px solid #2e2e2e' }}>{t.description}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#666660', borderTop: '1px solid #2e2e2e' }}>{t.category}</td>
                  <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontWeight: 500, textAlign: 'right', borderTop: '1px solid #2e2e2e', color: t.type === 'income' ? '#60f0a8' : t.type === 'expense' ? '#f06060' : '#c8f060' }}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
