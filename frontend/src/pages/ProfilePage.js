import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner, EmptyState } from '../components/UI';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import UserCard from '../components/UserCard';
import api from '../api';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editPicFile, setEditPicFile] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwn = id === me.id;

  useEffect(() => {
    setLoading(true);
    setTab('posts');
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/posts/user/${id}`),
    ]).then(([{ data: prof }, { data: p }]) => {
      setProfile(prof);
      setPosts(p);
      setEditBio(prof.bio || '');
      setEditBirthday(prof.birthday || '');
      setEditAddress(prof.address || '');
      setEditContact(prof.contact_number || '');
      setEditSchool(prof.school || '');
      setEditPicFile(null);
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadFollowers = async () => {
    const { data } = await api.get(`/users/${id}/followers`);
    setFollowers(data);
  };
  const loadFollowing = async () => {
    const { data } = await api.get(`/users/${id}/following`);
    setFollowing(data);
  };

  const handleTabChange = async (t) => {
    setTab(t);
    if (t === 'followers' && !followers.length) await loadFollowers();
    if (t === 'following' && !following.length) await loadFollowing();
  };

  const toggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/follow/${id}`);
      setProfile(p => ({
        ...p,
        is_following: data.following,
        followers_count: p.followers_count + (data.following ? 1 : -1),
      }));
    } catch {} finally { setFollowLoading(false); }
  };

  const saveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('bio', editBio);
      formData.append('birthday', editBirthday);
      formData.append('address', editAddress);
      formData.append('contact_number', editContact);
      formData.append('school', editSchool);
      if (editPicFile) {
        formData.append('profile_pic', editPicFile);
      }
      
      const { data } = await api.put(`/users/${me.id}`, formData);
      setProfile(p => ({ ...p, ...data }));
      updateUser(data);
      setEditing(false);
    } catch {}
  };

  const handlePost = (p) => setPosts(prev => [p, ...prev]);
  const handleDelete = (pid) => setPosts(prev => prev.filter(x => x.id !== pid));

  if (loading) return <div className="page-wrapper"><Spinner /></div>;
  if (!profile) return null;

  return (
    <div>
      {/* Cover */}
      <div style={{ background: 'var(--bg-up)', padding: '32px 16px 0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ paddingTop: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <Avatar username={profile.username} size={76} src={profile.profile_pic} />
            <div style={{ display: 'flex', gap: 8 }}>
              {isOwn ? (
                <button onClick={() => setEditing(v => !v)} className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>
                  {editing ? 'Cancel' : 'Edit profile'}
                </button>
              ) : (
                <>
                  <button onClick={() => navigate(`/messages/${profile.id}`)} className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>
                    Message
                  </button>
                  <button onClick={toggleFollow} className={profile.is_following ? 'btn-secondary active' : 'btn-primary'}
                    style={{ padding: '7px 16px', fontSize: 13 }} disabled={followLoading}>
                    {profile.is_following ? 'Following' : 'Follow'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: -0.5 }}>{profile.username}</div>

          {editing ? (
            <div style={{ marginTop: 10 }}>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio" style={{ minHeight: 60, marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} placeholder="Birthday" style={{ flex: 1 }} />
                <input type="text" value={editContact} onChange={e => setEditContact(e.target.value)} placeholder="Contact Number" style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="School / University" style={{ flex: 1 }} />
                <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Address" style={{ flex: 1 }} />
              </div>
              <div style={{ marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                Profile picture:
                <input type="file" accept="image/*" onChange={e => setEditPicFile(e.target.files[0])} style={{ display: 'block', marginTop: 4, color: 'var(--text)' }} />
              </div>
              <button className="btn-primary" onClick={saveProfile} style={{ padding: '7px 18px', fontSize: 13 }}>Save changes</button>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>{profile.bio || 'No bio yet.'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                {profile.school && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🎓 {profile.school}</div>}
                {profile.address && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📍 {profile.address}</div>}
                {profile.birthday && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🎂 {profile.birthday}</div>}
                {profile.contact_number && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📞 {profile.contact_number}</div>}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 0, marginTop: 20, borderTop: '1px solid var(--border-faint)' }}>
            {[
              { key: 'posts',     label: 'Posts',     count: profile.posts_count },
              { key: 'followers', label: 'Followers',  count: profile.followers_count },
              { key: 'following', label: 'Following',  count: profile.following_count },
            ].map(s => (
              <button key={s.key} onClick={() => handleTabChange(s.key)} style={{
                flex: 1, padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center',
                borderBottom: tab === s.key ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
                <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{s.count}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="page-wrapper" style={{ paddingTop: 20 }}>
        {tab === 'posts' && (
          <>
            {isOwn && <CreatePost onPost={handlePost} />}
            {posts.length === 0 && <EmptyState icon="📝" title="No posts yet" />}
            {posts.map(p => <PostCard key={p.id} post={p} onDelete={handleDelete} />)}
          </>
        )}
        {tab === 'followers' && (
          followers.length === 0
            ? <EmptyState icon="👥" title="No followers yet" />
            : followers.map(u => <UserCard key={u.id} user={u} initialFollowing={false} />)
        )}
        {tab === 'following' && (
          following.length === 0
            ? <EmptyState icon="👥" title="Not following anyone" />
            : following.map(u => <UserCard key={u.id} user={u} initialFollowing={true} />)
        )}
      </div>
    </div>
  );
}
