import React, { useState, useEffect } from 'react';
import api from '../api';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import { Spinner, EmptyState } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function ExplorePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('people');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [followMap, setFollowMap] = useState({});

  useEffect(() => {
    if (tab === 'people') loadUsers();
    else loadPosts();
  }, [tab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [{ data: allUsers }, { data: followingList }] = await Promise.all([
        api.get('/users'),
        api.get(`/users/${user.id}/following`),
      ]);
      const fm = {};
      followingList.forEach(u => { fm[u.id] = true; });
      setFollowMap(fm);
      setUsers(allUsers.filter(u => u.id !== user.id));
    } catch {} finally { setLoading(false); }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/posts/explore');
      setPosts(data);
    } catch {} finally { setLoading(false); }
  };

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-surface)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
        {['people', 'posts'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none',
            background: tab === t ? 'var(--accent)' : 'transparent',
            color: tab === t ? 'var(--text)' : 'var(--text-muted)',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'people' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" style={{ marginBottom: 16 }} />
          {loading && <Spinner />}
          {!loading && filtered.length === 0 && <EmptyState icon="🔍" title="No users found" />}
          {filtered.map(u => <UserCard key={u.id} user={u} initialFollowing={!!followMap[u.id]} />)}
        </>
      )}

      {tab === 'posts' && (
        <>
          {loading && <Spinner />}
          {!loading && posts.length === 0 && <EmptyState icon="📝" title="No posts yet" />}
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </>
      )}
    </div>
  );
}
