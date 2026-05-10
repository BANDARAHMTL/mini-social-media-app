import React from 'react';

const AVATAR_COLORS = [
  ['#e94560','#fff'],['#0f3460','#e94560'],['#00c9a7','#1a1a2e'],
  ['#ffd460','#1a1a2e'],['#7c4dff','#fff'],['#ff6b6b','#fff'],['#0f8b8d','#fff'],
];

function hashColor(username = '') {
  let h = 0;
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export function Avatar({ username = '?', size = 38, onClick, src }) {
  const [bg, fg] = hashColor(username);
  const style = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg, color: fg, fontWeight: 700, fontSize: size * 0.38,
    cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
    border: '2px solid var(--border)', overflow: 'hidden',
    fontFamily: "'DM Mono', monospace",
  };
  if (src) return <img src={src} alt={username} style={{ ...style, objectFit: 'cover' }} onClick={onClick} />;
  return <div style={style} onClick={onClick}>{username.slice(0, 2).toUpperCase()}</div>;
}

export function Spinner() {
  return <div className="spinner" />;
}

export function Toast({ message, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="toast" onClick={onClose}>{message}</div>;
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
}

export function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}
