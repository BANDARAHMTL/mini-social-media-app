import React, { useState, useEffect } from 'react';
import api from '../api';
import './StoryViewer.css';

function StoryViewer({ storyId, onClose, onDelete, userId }) {
  const [story, setStory] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stories/${storyId}`);
      setStory(res.data);

      // If it's the user's own story, load viewers
      if (res.data.user_id === userId) {
        const viewersRes = await api.get(`/stories/${storyId}/viewers`);
        setViewers(viewersRes.data.viewers);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this story?')) return;

    try {
      await api.delete(`/stories/${storyId}`);
      onDelete();
    } catch (err) {
      setError('Failed to delete story');
    }
  };

  if (loading) return <div className="story-viewer">⏳ Loading...</div>;
  if (error) return <div className="story-viewer story-error">{error}</div>;
  if (!story) return <div className="story-viewer">Story not found</div>;

  const isOwner = story.user_id === userId;
  const expiresIn = new Date(story.expires_at) - new Date();
  const hoursLeft = Math.floor(expiresIn / (1000 * 60 * 60));

  return (
    <div className="story-viewer-container">
      {/* Close Button */}
      <button className="story-close-btn" onClick={onClose}>✕</button>

      {/* Story Content */}
      <div className="story-content">
        {story.video_url ? (
          <video src={story.video_url} controls autoPlay />
        ) : (
          <img src={story.image_url} alt="Story" />
        )}

        {/* Story Caption */}
        {story.caption && (
          <div className="story-caption">{story.caption}</div>
        )}
      </div>

      {/* Story Info */}
      <div className="story-info">
        {/* Author Info */}
        <div className="story-author">
          <img
            src={story.author_pic || '👤'}
            alt={story.author_username}
            className="author-pic"
            onError={(e) => (e.target.src = '👤')}
          />
          <div className="author-details">
            <div className="author-name">{story.author_username}</div>
            <div className="story-time">
              {hoursLeft > 0 ? `Expires in ${hoursLeft}h` : 'Expired'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="story-actions">
          {isOwner && (
            <>
              <button
                className="action-btn viewers-btn"
                onClick={() => setShowViewers(!showViewers)}
                title={`${story.view_count} views`}
              >
                👁️ {story.view_count}
              </button>
              <button
                className="action-btn delete-btn"
                onClick={handleDelete}
                title="Delete story"
              >
                🗑️
              </button>
            </>
          )}
          {!isOwner && (
            <div className="view-status">
              {story.viewed_by_me ? '✓ You viewed this' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Viewers List (for owner only) */}
      {isOwner && showViewers && (
        <div className="viewers-list">
          <h3>👁️ Story Viewers ({viewers.length})</h3>
          {viewers.length > 0 ? (
            <div className="viewers-grid">
              {viewers.map((viewer) => (
                <div key={viewer.user_id} className="viewer-item">
                  <img
                    src={viewer.profile_pic || '👤'}
                    alt={viewer.username}
                    onError={(e) => (e.target.src = '👤')}
                  />
                  <div className="viewer-info">
                    <div className="viewer-name">{viewer.username}</div>
                    <div className="viewer-time">
                      {new Date(viewer.viewed_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-viewers">No one has viewed your story yet</div>
          )}
        </div>
      )}
    </div>
  );
}

export default StoryViewer;
