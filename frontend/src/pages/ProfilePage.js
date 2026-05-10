import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner, EmptyState } from '../components/UI';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import UserCard from '../components/UserCard';
import api from '../api';
import './ProfilePage.css';

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
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [id, navigate]);

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
    setSearchQuery(''); // Clear search when changing tabs
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
      <div className="profile-cover">
        <div className="profile-header-inner">
          <div className="profile-top">
            <Avatar username={profile.username} size={76} src={profile.profile_pic} />
            <div className="profile-actions">
              {isOwn ? (
                <button onClick={() => setEditing(v => !v)} className="btn-secondary">
                  {editing ? 'Cancel' : 'Edit profile'}
                </button>
              ) : (
                <>
                  <button onClick={() => navigate(`/messages/${profile.id}`)} className="btn-secondary">
                    Message
                  </button>
                  <button onClick={toggleFollow} className={profile.is_following ? 'btn-secondary active' : 'btn-primary'}
                    disabled={followLoading}>
                    {profile.is_following ? 'Following' : 'Follow'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profile-username">{profile.username}</div>

          {editing ? (
            <div className="profile-edit-form">
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio" />
              <div className="profile-edit-row">
                <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} placeholder="Birthday" />
                <input type="text" value={editContact} onChange={e => setEditContact(e.target.value)} placeholder="Contact Number" />
              </div>
              <div className="profile-edit-row">
                <input type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="School / University" />
                <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Address" />
              </div>
              <div className="profile-pic-upload">
                Profile picture:
                <input type="file" accept="image/*" onChange={e => setEditPicFile(e.target.files[0])} />
              </div>
              <button className="btn-primary profile-save-btn" onClick={saveProfile}>Save changes</button>
            </div>
          ) : (
            <>
              <div className="profile-bio">{profile.bio || 'No bio yet.'}</div>
              <div className="profile-details">
                {profile.school && <div className="profile-detail-item">🎓 {profile.school}</div>}
                {profile.address && <div className="profile-detail-item">📍 {profile.address}</div>}
                {profile.birthday && <div className="profile-detail-item">🎂 {profile.birthday}</div>}
                {profile.contact_number && <div className="profile-detail-item">📞 {profile.contact_number}</div>}
              </div>
            </>
          )}

          <div className="profile-tabs">
            {[
              { key: 'posts',     label: 'Posts',     count: profile.posts_count },
              { key: 'followers', label: 'Followers',  count: profile.followers_count },
              { key: 'following', label: 'Following',  count: profile.following_count },
            ].map(s => (
              <button key={s.key} onClick={() => handleTabChange(s.key)} className={`profile-tab ${tab === s.key ? 'active' : ''}`}>
                <div className="profile-tab-count">{s.count}</div>
                <div className="profile-tab-label">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="page-wrapper profile-tab-content">
        <div style={{ marginBottom: 16 }}>
          <input 
            type="text" 
            placeholder={`Search ${tab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text)',
              fontSize: '14px'
            }}
          />
        </div>

        {tab === 'posts' && (
          <>
            {isOwn && <CreatePost onPost={handlePost} />}
            {posts.length === 0 && <EmptyState icon="📝" title="No posts yet" />}
            {posts
              .filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(p => <PostCard key={p.id} post={p} onDelete={handleDelete} />)
            }
            {posts.length > 0 && posts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <EmptyState icon="🔍" title="No posts match your search" />
            )}
          </>
        )}
        {tab === 'followers' && (
          followers.length === 0
            ? <EmptyState icon="👥" title="No followers yet" />
            : followers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).length === 0
              ? <EmptyState icon="🔍" title="No followers match your search" />
              : followers
                .filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(u => <UserCard key={u.id} user={u} initialFollowing={false} />)
        )}
        {tab === 'following' && (
          following.length === 0
            ? <EmptyState icon="👥" title="Not following anyone" />
            : following.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).length === 0
              ? <EmptyState icon="🔍" title="No users match your search" />
              : following
                .filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(u => <UserCard key={u.id} user={u} initialFollowing={true} />)
        )}
      </div>
    </div>
  );
}
