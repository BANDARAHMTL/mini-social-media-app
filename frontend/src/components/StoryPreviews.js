import React, { useState, useEffect } from 'react';
import api from '../api';
import StoryViewer from './StoryViewer';
import './StoryPreviews.css';

function StoryPreviews({ userId }) {
  const [storiesFeed, setStoriesFeed] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoriesFeed();
    // Refresh every 30 seconds to show new stories
    const interval = setInterval(loadStoriesFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStoriesFeed = async () => {
    try {
      const res = await api.get('/stories/feed');
      // Group stories by user
      const storyGroups = {};
      res.data.stories.forEach((story) => {
        const key = story.user_id;
        if (!storyGroups[key]) {
          storyGroups[key] = {
            user_id: story.user_id,
            author_username: story.author_username,
            author_pic: story.author_pic,
            stories: []
          };
        }
        storyGroups[key].stories.push(story);
      });

      setStoriesFeed(Object.values(storyGroups));
      setLoading(false);
    } catch (err) {
      console.error('Failed to load stories:', err);
      setLoading(false);
    }
  };

  const handleStorySelect = (story) => {
    setSelectedStoryId(story.id);
  };

  const handleStoryClose = () => {
    setSelectedStoryId(null);
    // Reload stories to update view counts
    loadStoriesFeed();
  };

  const handleStoryDelete = () => {
    handleStoryClose();
    loadStoriesFeed();
  };

  if (loading) {
    return <div className="story-previews">⏳ Loading stories...</div>;
  }

  if (storiesFeed.length === 0) {
    return (
      <div className="story-previews empty">
        <p>📖 No stories yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="story-previews">
      <div className="stories-container">
        {storiesFeed.map((group) => (
          <div
            key={group.user_id}
            className={`story-circle-wrapper ${group.stories.some(s => s.viewed_by_me) ? 'viewed' : 'unviewed'}`}
          >
            <button
              className="story-circle"
              onClick={() => handleStorySelect(group.stories[0])}
              title={`${group.author_username}'s story`}
            >
              <img
                src={group.author_pic || '👤'}
                alt={group.author_username}
                onError={(e) => (e.target.src = '👤')}
              />
              <div className="story-count-badge">{group.stories.length}</div>
            </button>
            <span className="story-username">{group.author_username}</span>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {selectedStoryId && (
        <StoryViewer
          storyId={selectedStoryId}
          onClose={handleStoryClose}
          onDelete={handleStoryDelete}
          userId={userId}
        />
      )}
    </div>
  );
}

export default StoryPreviews;
