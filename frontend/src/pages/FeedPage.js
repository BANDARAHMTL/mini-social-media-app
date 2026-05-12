import React, { useState, useEffect } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import CreateStory from '../components/CreateStory';
import StoryPreviews from '../components/StoryPreviews';
import { Spinner, EmptyState } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/posts');
      setPosts(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handlePost = (newPost) => setPosts(p => [newPost, ...p]);
  const handleDelete = (id) => setPosts(p => p.filter(x => x.id !== id));

  return (
    <div className="page-wrapper">
      {/* Stories Section */}
      <StoryPreviews userId={user?.id} />

      {/* Create Story Button / Form */}
      {showCreateStory ? (
        <CreateStory onStoryCreated={() => setShowCreateStory(false)} />
      ) : (
        <button
          className="create-story-toggle"
          onClick={() => setShowCreateStory(true)}
          title="Create a story"
        >
          📖 Create Story
        </button>
      )}

      {/* Create Post */}
      <CreatePost onPost={handlePost} />

      {loading && <Spinner />}
      {!loading && posts.length === 0 && (
        <EmptyState icon="📡" title="Your feed is empty" subtitle="Follow people in Explore to see their posts here" />
      )}
      {posts.map(p => <PostCard key={p.id} post={p} onDelete={handleDelete} />)}
    </div>
  );
}
