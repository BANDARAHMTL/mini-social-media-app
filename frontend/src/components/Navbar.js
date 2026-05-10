import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './UI';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--bg-nav)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: 'var(--accent)', letterSpacing: -1 }}>
          pulse.
        </Link>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[{ to: '/', label: 'Feed' }, { to: '/explore', label: 'Explore' }].map(n => (
            <Link key={n.to} to={n.to} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: isActive(n.to) ? 'var(--bg-input)' : 'transparent',
              color: isActive(n.to) ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all .15s',
            }}>{n.label}</Link>
          ))}
          
          <button onClick={toggleTheme} style={{
            background: 'none', border: 'none', padding: '6px 10px', 
            fontSize: 16, cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', marginLeft: 4
          }} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link to={`/profile/${user.id}`} style={{ marginLeft: 8 }}>
            <Avatar username={user.username} size={32} src={user.profile_pic} />
          </Link>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12, marginLeft: 8 }}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
