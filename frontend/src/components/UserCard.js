import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './UI';
import api from '../api';

export default function UserCard({ user: targetUser, initialFollowing }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === targetUser.id;

  const toggleFollow = async (e) => {
    e.stopPropagation();
    if (loading || isSelf) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/users/follow/${targetUser.id}`);
      setFollowing(data.following);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 10 }}
      onClick={() => navigate(`/profile/${targetUser.id}`)}>
      <Avatar username={targetUser.username} size={48} src={targetUser.profile_pic} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{targetUser.username}</div>
        {targetUser.bio && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {targetUser.bio}
          </div>
        )}
      </div>
      {!isSelf && (
        <button onClick={toggleFollow}
          className={following ? 'btn-secondary active' : 'btn-primary'}
          style={{ padding: '7px 16px', fontSize: 13, flexShrink: 0 }}
          disabled={loading}>
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}
