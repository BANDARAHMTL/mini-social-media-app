import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './UI';
import api from '../api';

export default function CreatePost({ onPost }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [showMedia, setShowMedia] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      
      const { data } = await api.post('/posts', formData);
      onPost?.(data);
      setContent('');
      setMediaFile(null);
      setMediaType(null);
      setShowMedia(false);
    } catch {} finally { setLoading(false); }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    }
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
          {showMedia && (
            <input 
              type="file" 
              accept="image/*,video/*"
              onChange={handleMediaChange}
              style={{ marginBottom: 8, color: 'var(--text-muted)' }} 
            />
          )}
          {mediaFile && (
            <div style={{ marginBottom: 8, padding: 8, backgroundColor: 'var(--bg-secondary)', borderRadius: 4 }}>
              <small style={{ color: 'var(--text-muted)' }}>
                📎 {mediaType === 'video' ? '🎥' : '🖼️'} {mediaFile.name}
              </small>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { 
                setShowMedia(v => !v); 
                setMediaFile(null);
                setMediaType(null);
              }} style={{
                background: 'none', border: 'none', color: showMedia ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer',
              }}>
                📷 {showMedia ? 'Remove media' : 'Add media'}
              </button>
            </div>
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
