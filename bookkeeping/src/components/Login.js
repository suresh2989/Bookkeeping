import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const styles = {
  page: {
    minHeight: '100vh', background: '#0f0f0f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  card: {
    background: '#1a1a1a', border: '1px solid #2e2e2e',
    borderRadius: 12, padding: '40px 36px', width: 380, maxWidth: '95vw',
  },
  logo: { fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem', color: '#c8f060', marginBottom: 4 },
  sub: {
    fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#666660',
    letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 32,
  },
  label: {
    display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
    color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    width: '100%', background: '#222', border: '1px solid #2e2e2e', color: '#e8e8e0',
    padding: '11px 14px', borderRadius: 6, fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem', outline: 'none', marginBottom: 16, boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '12px', background: '#c8f060', color: '#0f0f0f',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem', fontWeight: 700, marginTop: 8,
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  error: {
    background: 'rgba(240,96,96,0.1)', border: '1px solid rgba(240,96,96,0.3)',
    color: '#f06060', borderRadius: 6, padding: '10px 14px',
    fontSize: '0.8rem', marginBottom: 16, fontFamily: "'DM Sans', sans-serif",
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Corporate Books</div>
        <div style={styles.sub}>Suresh Kumar Sivasubramaniam · Incorporated</div>

        <form onSubmit={handleLogin}>
          {error && <div style={styles.error}>{error}</div>}

          <div>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
