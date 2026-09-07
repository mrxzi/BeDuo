import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Settings, Flame, Edit3 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { PostService } from '../services/posts';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const allPosts = PostService.getPosts();
  const userPosts = allPosts.filter((p) => p.username === user?.username || p.userId === user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    AuthService.updateProfile({ fullName, bio });
    setIsEditing(false);
  };

  return (
    <div className="page-container profile-page">
      <header className="page-header profile-header">
        <h2>Profile</h2>
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Profile Info */}
      <section className="profile-hero">
        <div className="avatar-wrapper">
          <img
            src={user?.avatarUrl}
            alt={user?.username}
            className="profile-avatar"
          />
          <div className="streak-badge" title="Daily streak">
            <Flame size={12} fill="#ccff00" color="#ccff00" />
            <span>{user?.streakDays || 0}d</span>
          </div>
        </div>

        <h3 className="profile-name">{user?.fullName || 'Duo Creator'}</h3>
        <p className="profile-username">@{user?.username || 'user'}</p>
        {user?.bio && <p className="profile-bio">{user.bio}</p>}

        <div className="profile-stats-row">
          <div className="stat-card">
            <span className="stat-num">{userPosts.length}</span>
            <span className="stat-label">Moments</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{user?.streakDays || 0}</span>
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">100%</span>
            <span className="stat-label">Realness</span>
          </div>
        </div>

        <button
          type="button"
          className="secondary-btn edit-profile-btn"
          onClick={() => setIsEditing(true)}
        >
          <Edit3 size={14} />
          <span>Edit Profile</span>
        </button>
      </section>

      {/* User's Photos Grid */}
      <section className="profile-gallery">
        <h4 className="section-title">Your Memories</h4>
        {userPosts.length === 0 ? (
          <div className="empty-gallery" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-secondary)' }}>
            <p style={{ marginBottom: 12 }}>You haven't posted any BeDuo moments yet.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate('/camera')}
            >
              Take Your First Duo Photo
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {userPosts.map((post) => (
              <div key={post.id} className="gallery-item">
                <img src={post.imageUrl} alt="Memory" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="lightbox-backdrop" onClick={() => setIsEditing(false)}>
          <form
            className="edit-modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveProfile}
          >
            <h3>Edit Profile</h3>
            <label className="input-label">
              Full Name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="modal-input"
              />
            </label>
            <label className="input-label">
              Bio
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="modal-textarea"
                rows={3}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
