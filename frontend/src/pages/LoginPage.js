import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.username || !form.email || !form.password) throw new Error('All fields required');
        await register(form.username, form.email, form.password, form.bio);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-base)' }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 60, color: 'var(--accent)', letterSpacing: -3, lineHeight: 1 }}>pulse.</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>where thoughts become signal</div>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--bg-base)', borderRadius: 10, padding: 4 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-muted)', border: 'none',
            }}>{m === 'login' ? 'Sign in' : 'Sign up'}</button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && <input placeholder="Username" value={form.username} onChange={set('username')} />}
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} />
          <input type="password" placeholder="Password" value={form.password} onChange={set('password')} />
          {mode === 'register' && <textarea placeholder="Bio (optional)" value={form.bio} onChange={set('bio')} style={{ minHeight: 64 }} />}
          {error && <div style={{ color: 'var(--accent)', fontSize: 13 }}>{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, justifyContent: 'center' }}>
            {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {mode === 'login' && (
          <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-base)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--accent)' }}>Demo credentials (password: password123)</div>
            <div>nova@pulse.dev</div>
            <div>pixel@pulse.dev</div>
            <div>echo@pulse.dev</div>
          </div>
        )}
      </div>
    </div>
  );
}
