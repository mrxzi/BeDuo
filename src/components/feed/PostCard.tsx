import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import type { Post } from '../../types';
import { PostService } from '../../services/posts';

interface PostCardProps {
  post: Post;
  onPostUpdated?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdated }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);

  const handleLike = () => {
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikeCount((prev) => (newStatus ? prev + 1 : prev - 1));
    PostService.toggleLike(post.id);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = PostService.addComment(post.id, commentText.trim());
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      if (onPostUpdated) onPostUpdated();
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <article className="post-card">
      {/* Post Header */}
      <header className="post-header">
        <div className="post-user-info">
          <img
            src={post.userAvatar}
            alt={post.username}
            className="post-avatar"
            loading="lazy"
          />
          <div className="post-user-details">
            <div className="post-username-row">
              <span className="post-username">@{post.username}</span>
              {post.isLate && (
                <span className="post-late-badge">
                  {post.lateTimeText || 'Late'}
                </span>
              )}
            </div>
            <span className="post-location">
              {post.location || 'Local Moment'} • {formatTimeAgo(post.capturedAt)}
            </span>
          </div>
        </div>

        <button type="button" className="post-more-btn" aria-label="Post options">
          <MoreHorizontal size={18} />
        </button>
      </header>

      {/* Main Composited Photo */}
      <div className="post-image-container">
        <img
          src={post.imageUrl}
          alt={`BeDuo post by ${post.username}`}
          className="post-image"
          loading="lazy"
        />
        <div className="post-image-badge">Dual Snap</div>
      </div>

      {/* Post Actions & Caption */}
      <div className="post-footer">
        <div className="post-actions">
          <button
            type="button"
            className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            aria-label="Like post"
          >
            <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#a1a1aa'} />
            <span className="action-count">{likeCount}</span>
          </button>

          <button
            type="button"
            className="action-btn comment-btn"
            onClick={() => setShowComments(!showComments)}
            aria-label="View comments"
          >
            <MessageCircle size={20} color="#a1a1aa" />
            <span className="action-count">{comments.length}</span>
          </button>
        </div>

        {post.caption && (
          <div className="post-caption">
            <strong>@{post.username}</strong> {post.caption}
          </div>
        )}

        {/* Comments section */}
        {showComments && (
          <div className="post-comments-section">
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments" style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <img src={c.avatarUrl} alt={c.username} className="comment-avatar" />
                    <div className="comment-body">
                      <span className="comment-author">@{c.username}</span>
                      <span className="comment-text">{c.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="comment-input"
              />
              <button type="submit" className="comment-submit-btn" disabled={!commentText.trim()}>
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};
