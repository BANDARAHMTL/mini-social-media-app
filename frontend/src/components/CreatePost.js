import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './UI';
import api from '../api';

export default function CreatePost({ onPost }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showImg, setShowImg] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const { data } = await api.post('/posts', formData);
      onPost?.(data);
      setContent('');
      setImageFile(null);
      setShowImg(false);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar username={user.username} size={40} src={user.profile_pic} />
        <div style={{ flex: 1 }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            style={{ minHeight: 72, marginBottom: 8 }}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit(); }}
          />
          {showImg && (
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
              style={{ marginBottom: 8, color: 'var(--text-muted)' }} 
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => { setShowImg(v => !v); setImageFile(null); }} style={{
              background: 'none', border: 'none', color: showImg ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13, cursor: 'pointer',
            }}>
              📷 {showImg ? 'Remove image' : 'Add image'}
            </button>
            <button className="btn-primary" onClick={submit} disabled={loading || !content.trim()}
              style={{ padding: '8px 20px' }}>
              {loading ? '…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
