import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, timeAgo } from './UI';
import api from '../api';

// Share Arrow Icon Component
const ShareIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const CopyIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 9h6M9 13h6M9 17h3" />
  </svg>
);

const SendIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M21 17c.7-1.3 1-2.8 1-4.5 0-4-3-7-7-7" />
  </svg>
);

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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const shareMenuRef = useRef(null);
  const shareButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target) && 
          shareButtonRef.current && !shareButtonRef.current.contains(event.target)) {
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

  const toggleShare = async (e) => {
    e?.stopPropagation();
    try {
      console.log(`[SHARE] Attempting to share post ${post.id}`);
      const { data } = await api.post(`/posts/${post.id}/share`);
      console.log('[SHARE] Success:', data);
      setPost(p => ({ 
        ...p, 
        shared_by_me: data.shared, 
        share_count: data.share_count 
      }));
      setShowShareMenu(false);
      
      // Show feedback
      if (data.shared) {
        alert('✅ Post reposted to your profile!');
      } else {
        alert('🗑️ Repost removed from your profile');
      }
    } catch (error) {
      console.error('[SHARE] Failed:', error?.response?.data || error.message);
      alert(`Failed to share post: ${error?.response?.data?.message || error.message}`);
    }
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
    if (shareButtonRef.current) {
      const rect = shareButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setShowShareMenu(!showShareMenu);
  };

  const sharePostLink = (e) => {
    e.stopPropagation();
    try {
      const postLink = `${window.location.origin}/profile/${post.author_id}?post=${post.id}`;
      console.log('[COPY_LINK] Copying to clipboard:', postLink);
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(postLink).then(() => {
          console.log('[COPY_LINK] Success - copied to clipboard');
          alert('Post link copied to clipboard!');
          setShowShareMenu(false);
        }).catch((err) => {
          console.error('[COPY_LINK] Clipboard API failed:', err);
          // Fallback to older method
          fallbackCopyToClipboard(postLink);
        });
      } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(postLink);
      }
    } catch (error) {
      console.error('[COPY_LINK] Error:', error);
      alert('Failed to copy link');
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      console.log('[COPY_LINK] Fallback success - used execCommand');
      alert('Post link copied to clipboard!');
      setShowShareMenu(false);
    } catch (err) {
      console.error('[COPY_LINK] Fallback failed:', err);
      alert('Failed to copy link. Please copy manually: ' + text);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const shareViaMessage = (e) => {
    e.stopPropagation();
    try {
      const postLink = `${window.location.origin}/profile/${post.author_id}?post=${post.id}`;
      const message = `Check out this post from ${post.author_username}: ${postLink}`;
      console.log('[SHARE_MESSAGE] Navigating to messages with post');
      navigate(`/messages/${post.author_id}`, { state: { prefilledMessage: message } });
      setShowShareMenu(false);
    } catch (error) {
      console.error('[SHARE_MESSAGE] Failed:', error);
      alert('Failed to navigate to messages');
    }
  };

  return (
    <div className="card" style={{ marginBottom: 12, transition: 'border .2s' }}>
      {/* Repost Indicator */}
      {post.is_shared_from && (
        <div style={{ padding: '10px 20px', background: 'linear-gradient(135deg, rgba(49,162,76,0.05), rgba(49,162,76,0.02))', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📤</span>
          <span>{post.author_username} <strong style={{ color: 'var(--text)' }}>reposted</strong> from <strong style={{ color: '#31a24c' }}>{post.original_author_username}</strong></span>
        </div>
      )}
      {/* Header */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div
            style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${post.author_id}`)}>
            <Avatar username={post.author_username} size={44} src={post.author_pic} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{post.author_username}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{timeAgo(post.created_at)}</div>
            </div>
          </div>
          {isOwner && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditing(v => !v); setEditContent(post.content); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  fontSize: 18, 
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-input)';
                  e.target.style.color = '#0084ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'var(--text-muted)';
                }}>✏️</button>
              <button onClick={handleDelete}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  fontSize: 18, 
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-input)';
                  e.target.style.color = '#e94560';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'var(--text-muted)';
                }}>🗑️</button>
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
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text)', marginBottom: (post.image_url || post.video_url) ? 14 : 0 }}>{post.content}</p>
            {post.image_url && (
              <div style={{
                width: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                marginTop: 12,
                backgroundColor: 'var(--bg-input)',
                aspectRatio: 'auto',
              }}>
                <img 
                  src={post.image_url} 
                  alt="Post image" 
                  loading="lazy"
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '100vh',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  onError={(e) => {
                    e.target.parentElement.style.display = 'none';
                  }} 
                />
              </div>
            )}
            {post.video_url && (
              <div style={{
                width: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                marginTop: 12,
                backgroundColor: '#000',
                position: 'relative',
              }}>
                <video 
                  src={post.video_url} 
                  controls
                  loading="lazy"
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '100vh',
                    backgroundColor: '#000'
                  }}
                  onError={(e) => {
                    e.target.parentElement.style.display = 'none';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  📹
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px', display: 'flex', alignItems: 'center', position: 'relative', backgroundColor: 'var(--bg-input)', borderRadius: '0 0 12px 12px' }}>
        <button onClick={toggleLike} style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: post.liked_by_me ? '#e94560' : 'var(--text-muted)',
          fontSize: 13,
          fontWeight: 500,
          padding: '8px 12px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = post.liked_by_me ? 'rgba(233, 69, 96, 0.1)' : 'rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}>
          <span style={{ fontSize: 18 }}>{post.liked_by_me ? '❤️' : '🤍'}</span>
          <span>Like</span>
          <span style={{ fontSize: 12, marginLeft: 'auto' }}>{post.like_count > 0 ? post.like_count : ''}</span>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)', margin: '0 4px' }}></div>

        <button onClick={loadComments} style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: showComments ? '#0084ff' : 'var(--text-muted)',
          fontSize: 13,
          fontWeight: 500,
          padding: '8px 12px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = showComments ? 'rgba(0, 132, 255, 0.1)' : 'rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span>Comment</span>
          <span style={{ fontSize: 12, marginLeft: 'auto' }}>{post.comment_count > 0 ? post.comment_count : ''}</span>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)', margin: '0 4px' }}></div>

        <div style={{ flex: 1, position: 'relative' }}>
          <button ref={shareButtonRef} onClick={handleShare} style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: post.shared_by_me ? '#31a24c' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = post.shared_by_me ? 'rgba(49, 162, 76, 0.1)' : 'rgba(0,0,0,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}>
            <ShareIcon color={post.shared_by_me ? '#31a24c' : 'currentColor'} size={18} />
            <span>Share</span>
            <span style={{ fontSize: 12, marginLeft: 'auto' }}>{post.share_count > 0 ? post.share_count : ''}</span>
          </button>
        </div>
      </div>

      {showShareMenu && createPortal(
        <div 
          ref={shareMenuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 10000,
            minWidth: 240,
            overflow: 'hidden',
          }}>
          <button onClick={toggleShare} style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: post.shared_by_me ? '#31a24c' : 'var(--text)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            borderBottom: '1px solid var(--border)',
            transition: 'background-color 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }} 
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-input)'} 
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            <ShareIcon color={post.shared_by_me ? '#31a24c' : 'currentColor'} size={20} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>{post.shared_by_me ? 'Shared to Profile' : 'Share to Profile'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>Add to your profile</span>
            </div>
          </button>
          <button onClick={sharePostLink} style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            borderBottom: '1px solid var(--border)',
            transition: 'background-color 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }} 
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-input)'} 
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            <CopyIcon color="currentColor" size={20} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>Copy Link</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>Copy to clipboard</span>
            </div>
          </button>
          <button onClick={shareViaMessage} style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'background-color 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }} 
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-input)'} 
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            <SendIcon color="currentColor" size={20} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>Send Message</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>Share via messages</span>
            </div>
          </button>
        </div>,
        document.body
      )}

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
