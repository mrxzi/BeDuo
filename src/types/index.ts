export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
  postCount: number;
  streakDays: number;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  rearFrameUrl?: string;
  frontFrameUrl?: string;
  caption?: string;
  location?: string;
  capturedAt: string;
  isLate: boolean;
  lateTimeText?: string;
  likeCount: number;
  isLiked?: boolean;
  comments: PostComment[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  fromUsername: string;
  fromAvatar: string;
  type: 'like' | 'comment' | 'follow' | 'daily_prompt';
  text: string;
  createdAt: string;
  read: boolean;
  postImageUrl?: string;
}

export interface DailyMomentState {
  isActive: boolean;
  promptTime: string; // ISO string
  expiresAt: string; // ISO string
  windowMinutes: number;
  hasPostedToday: boolean;
}
