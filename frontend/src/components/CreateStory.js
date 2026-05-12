import React, { useState, useRef } from 'react';
import api from '../api';
import './CreateStory.css';

function CreateStory({ onStoryCreated }) {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setError('');
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!mediaFile) {
      setError('Please select an image or video');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('media', mediaFile);
      if (caption.trim()) {
        formData.append('caption', caption);
      }

      const response = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reset form
      setMediaFile(null);
      setMediaType(null);
      setCaption('');
      fileInputRef.current.value = '';

      if (onStoryCreated) onStoryCreated(response.data.story);

      alert('Story posted! 📖');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-story-container">
      <h2>📖 Create Story</h2>
      <form onSubmit={handleCreateStory} className="create-story-form">
        {/* Media Input */}
        <div className="media-input-section">
          <label htmlFor="media-input" className="media-input-label">
            {mediaFile ? (
              <div className="media-preview">
                <span>{mediaType === 'video' ? '🎥' : '🖼️'} {mediaFile.name}</span>
              </div>
            ) : (
              <span>➕ Select Image or Video</span>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="media-input"
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden-input"
          />
        </div>

        {/* Caption Input */}
        <textarea
          placeholder="Add a caption (optional)..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="caption-textarea"
          maxLength="500"
        />

        {/* Character Count */}
        <div className="char-count">{caption.length}/500</div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!mediaFile || loading}
          className="submit-btn"
        >
          {loading ? '⏳ Posting...' : '📤 Post Story'}
        </button>
      </form>
    </div>
  );
}

export default CreateStory;
