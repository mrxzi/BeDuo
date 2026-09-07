import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Camera } from 'lucide-react';
import { PostCard } from '../components/feed/PostCard';
import { DailyPromptCard } from '../components/feed/DailyPromptCard';
import { PostService } from '../services/posts';
import type { Post } from '../types';
import logoImg from '../assets/logo.png';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = () => {
    setPosts(PostService.getPosts());
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="page-container feed-page">
      {/* Top App Bar */}
      <header className="app-header">
        <div className="brand-logo">
          <img src={logoImg} alt="BeDuo" className="brand-logo-img" />
          <span className="logo-dot" />
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => navigate('/camera')}
            aria-label="Open Camera"
          >
            <Camera size={20} />
          </button>
        </div>
      </header>

      {/* Hero Daily Moment Prompt */}
      <section className="feed-hero-section">
        <DailyPromptCard />
      </section>

      {/* Feed List */}
      <section className="feed-posts-section">
        <h3 className="section-title">Today's Snaps</h3>

        {posts.length === 0 ? (
          <div className="empty-feed-card">
            <p>No BeDuo photos captured today yet.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate('/camera')}
            >
              Be the first to capture!
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onPostUpdated={loadPosts} />
          ))
        )}
      </section>
    </div>
  );
};
