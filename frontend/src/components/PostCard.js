import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, timeAgo } from './UI';
import api from '../api';

export default function PostCard({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImageUrl, setEditImageUrl] = useState(post.image_url || '');
  const [editVideoUrl, setEditVideoUrl] = useState(post.video_url || '');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  const isOwner = post.author_id === user.id;

  const toggleLike = async () => {
    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      setPost(p => ({ ...p, liked_by_me: data.liked, like_count: data.like_count }));
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
    } catch {}
  };

  const handleEdit = async () => {
    try {
      const { data } = await api.put(`/posts/${post.id}`, { 
        content: editContent, 
        image_url: editImageUrl,
        video_url: editVideoUrl 
      });
      setPost(data);
      setEditing(false);
    } catch {}
  };

  const loadComments = async () => {
    if (showComments) return setShowComments(false);
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/posts/${post.id}/comments`);
      setComments(data);
      setShowComments(true);
    } catch {} finally { setLoadingComments(false); }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/comment`, { comment_text: commentText });
      setComments(c => [...c, data]);
      setPost(p => ({ ...p, comment_count: p.comment_count + 1 }));
      setCommentText('');
    } catch {} finally { setSubmitting(false); }
  };

  const deleteComment = async (cId) => {
    try {
      await api.delete(`/posts/${post.id}/comment/${cId}`);
      setComments(c => c.filter(x => x.id !== cId));
      setPost(p => ({ ...p, comment_count: Math.max(0, p.comment_count - 1) }));
    } catch {}
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const sharePostLink = (e) => {
    e.stopPropagation();
    const postLink = `${window.location.origin}/profile/${post.author_id}?post=${post.id}`;
    navigator.clipboard.writeText(postLink);
    setShowShareMenu(false);
    alert('Post link copied to clipboard!');
  };

  const shareViaMessage = (e) => {
    e.stopPropagation();
    const postLink = `${window.location.origin}/profile/${post.author_id}?post=${post.id}`;
    const message = `Check out this post from ${post.author_username}: ${postLink}`;
    navigate(`/messages/${post.author_id}`, { state: { prefilledMessage: message } });
    setShowShareMenu(false);
  };

  return (
    <div className="card" style={{ marginBottom: 12, transition: 'border .2s' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div
            style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${post.author_id}`)}>
            <Avatar username={post.author_username} size={40} src={post.author_pic} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{post.author_username}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{timeAgo(post.created_at)}</div>
            </div>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setEditing(v => !v); setEditContent(post.content); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>✏️</button>
              <button onClick={handleDelete}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>🗑️</button>
            </div>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <div>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ marginBottom: 8 }} />
            <input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} placeholder="Image URL (optional)" style={{ marginBottom: 8 }} />
            <input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} placeholder="Video URL (optional)" style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={handleEdit} style={{ padding: '7px 16px', fontSize: 13 }}>Save</button>
              <button className="btn-secondary" onClick={() => setEditing(false)} style={{ padding: '7px 16px', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text)', marginBottom: (post.image_url || post.video_url) ? 12 : 0 }}>{post.content}</p>
            {post.image_url && (
              <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 8, marginTop: 8, maxHeight: 320, objectFit: 'cover' }}
                onError={e => e.target.style.display = 'none'} />
            )}
            {post.video_url && (
              <video src={post.video_url} controls style={{ width: '100%', borderRadius: 8, marginTop: 8, maxHeight: 400, backgroundColor: '#000' }}
                onError={e => e.target.style.display = 'none'} />
            )}
          </>
        )}
      </div>

      {/* Action bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 20px', display: 'flex', gap: 20, alignItems: 'center', position: 'relative' }}>
        <button onClick={toggleLike} style={{
          background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 5,
          color: post.liked_by_me ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: 13, fontWeight: 500,
        }}>
          <span style={{ fontSize: 17 }}>{post.liked_by_me ? '❤️' : '🤍'}</span> {post.like_count}
        </button>
        <button onClick={loadComments} style={{
          background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 5,
          color: showComments ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500,
        }}>
          💬 {post.comment_count}
        </button>
        <div style={{ position: 'relative' }} ref={shareMenuRef}>
          <button onClick={handleShare} style={{
            background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 5,
            color: showShareMenu ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500,
          }}>
            📤 Share
          </button>
          {showShareMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: 180,
              marginTop: 4,
            }} onClick={(e) => e.stopPropagation()}>
              <button onClick={sharePostLink} style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'none',
                color: 'var(--text)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 13,
                borderBottom: '1px solid var(--border)',
                transition: 'background-color 0.2s',
              }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-input)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                📋 Copy link
              </button>
              <button onClick={shareViaMessage} style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'none',
                color: 'var(--text)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'background-color 0.2s',
              }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-input)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                💬 Send as message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px' }}>
          {loadingComments && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>Loading…</div>}
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
              <Avatar username={c.username} size={28} src={c.profile_pic}
                onClick={() => navigate(`/profile/${c.user_id}`)} />
              <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${c.user_id}`)}>{c.username}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{timeAgo(c.created_at)}</span>
                    {c.user_id === user.id && (
                      <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{c.comment_text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Avatar username={user.username} size={30} src={user.profile_pic} />
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment…" style={{ flex: 1, fontSize: 13 }} />
            <button type="submit" className="btn-primary" style={{ padding: '7px 14px', fontSize: 13, flexShrink: 0 }}
              disabled={submitting}>→</button>
          </form>
        </div>
      )}
    </div>
  );
}
