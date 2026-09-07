import React from 'react';
import { Heart, MessageCircle, UserPlus, Zap } from 'lucide-react';
import type { NotificationItem } from '../types';

const MOCK_NOTIFS: NotificationItem[] = [
  {
    id: 'n1',
    userId: 'usr_demo',
    fromUsername: 'maya_sunset',
    fromAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    type: 'like',
    text: 'liked your BeDuo photo',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    userId: 'usr_demo',
    fromUsername: 'leo_v',
    fromAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    type: 'comment',
    text: 'commented: "Awesome composition!"',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: true,
  },
  {
    id: 'n3',
    userId: 'usr_demo',
    fromUsername: 'BeDuo System',
    fromAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    type: 'daily_prompt',
    text: 'Time to BeDuo! 2 hours remaining to post.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
  },
];

export const NotificationsPage: React.FC = () => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <Heart size={10} fill="#ef4444" color="#ef4444" />;
      case 'comment':
        return <MessageCircle size={10} color="#a1a1aa" />;
      case 'follow':
        return <UserPlus size={10} color="#ccff00" />;
      case 'daily_prompt':
        return <Zap size={10} color="#ccff00" fill="#ccff00" />;
    }
  };

  return (
    <div className="page-container notifs-page">
      <header className="page-header">
        <h2>Activity</h2>
      </header>

      <div className="notifs-list">
        {MOCK_NOTIFS.map((item) => (
          <div
            key={item.id}
            className={`notif-item ${!item.read ? 'unread' : ''}`}
          >
            <div className="notif-avatar-col">
              <img
                src={item.fromAvatar}
                alt={item.fromUsername}
                className="notif-avatar"
              />
              <span className="notif-type-badge">{getIcon(item.type)}</span>
            </div>

            <div className="notif-content">
              <p className="notif-text">
                <strong>@{item.fromUsername}</strong> {item.text}
              </p>
              <span className="notif-time">Recently</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
