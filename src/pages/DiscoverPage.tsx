import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { PostService } from '../services/posts';

export const DiscoverPage: React.FC = () => {
  const posts = PostService.getPosts();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  return (
    <div className="page-container discover-page">
      <header className="page-header">
        <div>
          <h2>Explore</h2>
          <p className="page-subtitle">Recent dual snaps from around the world</p>
        </div>
      </header>

      <div className="discover-grid">
        {posts.map((post) => (
          <div
            key={post.id}
            className="grid-item"
            onClick={() => setSelectedPost(post.imageUrl)}
          >
            <img src={post.imageUrl} alt={post.caption || 'Moment'} loading="lazy" />
            <div className="grid-overlay">
              <span className="grid-username">@{post.username}</span>
              <span className="grid-likes" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Heart size={12} fill="#ef4444" color="#ef4444" />
                <span>{post.likeCount}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox viewer */}
      {selectedPost && (
        <div className="lightbox-backdrop" onClick={() => setSelectedPost(null)}>
          <div className="lightbox-content">
            <img src={selectedPost} alt="Full view" />
          </div>
        </div>
      )}
    </div>
  );
};
