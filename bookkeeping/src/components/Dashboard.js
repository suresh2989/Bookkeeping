import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

const fmt = n => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const styles = {
  container: { padding: '32px 40px' },
  title: { fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: '#e8e8e0', marginBottom: 24 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: (color) => ({
    background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8,
    padding: '20px', position: 'relative', overflow: 'hidden',
  }),
  statBar: (color) => ({
    position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color,
  }),
  statLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
  },
  statVal: (color) => ({
    fontFamily: "'DM Mono', monospace", fontSize: '1.5rem', fontWeight: 500, color,
  }),
  statSub: { fontSize: '0.75rem', color: '#666660', marginTop: 4 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 28 },
  card: {
    background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, padding: 24,
  },
  cardTitle: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20,
  },
  recentTable: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 8, overflow: 'hidden' },
  th: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660',
    letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 16px',
    textAlign: 'left', fontWeight: 400, background: '#222',
  },
  td: { padding: '12px 16px', fontSize: '0.875rem', borderTop: '1px solid #2e2e2e' },
  badge: (type) => ({
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', padding: '3px 8px',
    borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.08em',
    background: type === 'income' ? 'rgba(96,240,168,0.1)' : type === 'expense' ? 'rgba(240,96,96,0.1)' : 'rgba(200,240,96,0.1)',
    color: type === 'income' ? '#60f0a8' : type === 'expense' ? '#f06060' : '#c8f060',
    border: `1px solid ${type === 'income' ? 'rgba(96,240,168,0.2)' : type === 'expense' ? 'rgba(240,96,96,0.2)' : 'rgba(200,240,96,0.2)'}`,
  }),
};

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
  const filtered = useMemo(() => transactions.filter(t => t.year === year), [transactions, year]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const draw = filtered.filter(t => t.type === 'draw').reduce((s, t) => s + t.amount, 0);
    return { income, expense, draw, net: income - expense };
  }, [filtered]);

  const monthlyData = useMemo(() => {
    return MONTHS.map((month, i) => {
      const monthTx = filtered.filter(t => new Date(t.date).getMonth() === i);
      return {
        month,
        Income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Expenses: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [filtered]);

  const pieData = useMemo(() => [
    { name: 'Income', value: totals.income, color: '#60f0a8' },
    { name: 'Expenses', value: totals.expense, color: '#f06060' },
    { name: 'Draws', value: totals.draw, color: '#c8f060' },
  ].filter(d => d.value > 0), [totals]);

  const recent = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return (
    <div style={styles.container}>
      <div style={styles.title}>Dashboard — FY {year}</div>

      <div style={styles.statsRow}>
        {[
          { label: 'Total Income', val: totals.income, color: '#60f0a8', sub: `${filtered.filter(t=>t.type==='income').length} transactions` },
          { label: 'Total Expenses', val: totals.expense, color: '#f06060', sub: `${filtered.filter(t=>t.type==='expense').length} transactions` },
          { label: 'Shareholder Draws', val: totals.draw, color: '#c8f060', sub: `${filtered.filter(t=>t.type==='draw').length} transactions` },
          { label: 'Net Profit', val: totals.net, color: totals.net >= 0 ? '#60f0a8' : '#f06060', sub: 'Before tax' },
        ].map(s => (
          <div key={s.label} style={styles.statCard(s.color)}>
            <div style={styles.statBar(s.color)} />
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statVal(s.color)}>{fmt(s.val)}</div>
            <div style={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Monthly Income vs Expenses</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barSize={10}>
              <XAxis dataKey="month" tick={{ fill: '#666660', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666660', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => '$'+v} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Income" fill="#60f0a8" radius={[3,3,0,0]} />
              <Bar dataKey="Expenses" fill="#f06060" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Breakdown</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend formatter={(val) => <span style={{ color: '#e8e8e0', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>{val}</span>} />
                <Tooltip formatter={(val) => fmt(val)} contentStyle={{ background: '#222', border: '1px solid #2e2e2e', borderRadius: 6, fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#666660' }}>No data yet</div>
          )}
        </div>
      </div>

      <div style={styles.recentTable}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Type', 'Description', 'Category', 'Amount'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#666660', padding: '40px' }}>No transactions yet</td></tr>
            ) : recent.map(t => (
              <tr key={t.id}>
                <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: '#666660' }}>
                  {format(parseISO(t.date), 'MMM d, yyyy')}
                </td>
                <td style={styles.td}><span style={styles.badge(t.type)}>{t.type}</span></td>
                <td style={styles.td}>{t.description}</td>
                <td style={{ ...styles.td, color: '#666660', fontSize: '0.8rem' }}>{t.category}</td>
                <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace", fontWeight: 500, textAlign: 'right',
                  color: t.type === 'income' ? '#60f0a8' : t.type === 'expense' ? '#f06060' : '#c8f060' }}>
                  {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
