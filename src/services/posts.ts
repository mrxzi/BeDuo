import type { Post, PostComment } from '../types';
import { AuthService } from './auth';

const POSTS_KEY = 'beduo_posts_v1';

const INITIAL_MOCK_POSTS: Post[] = [
  {
    id: 'post_1',
    userId: 'usr_maya',
    username: 'maya_sunset',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
    caption: 'Golden hour at the beach! 🌅',
    location: 'Santa Monica, CA',
    capturedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    isLate: false,
    likeCount: 24,
    isLiked: true,
    comments: [
      {
        id: 'c1',
        postId: 'post_1',
        userId: 'usr_leo',
        username: 'leo_v',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
        text: 'Stunning colors! 😍',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: 'post_2',
    userId: 'usr_sam',
    username: 'sam_code',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1080&q=80',
    caption: 'Late night coding session ☕💻',
    location: 'Coffee & Code Lab',
    capturedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isLate: true,
    lateTimeText: '2 hrs late',
    likeCount: 18,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post_3',
    userId: 'usr_elena',
    username: 'elena_hikes',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80',
    caption: 'Reached the summit! 🏔️',
    location: 'Yosemite National Park',
    capturedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    isLate: false,
    likeCount: 42,
    isLiked: true,
    comments: [],
  },
];

export const PostService = {
  getPosts(): Post[] {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(INITIAL_MOCK_POSTS));
      return INITIAL_MOCK_POSTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOCK_POSTS;
    }
  },

  savePosts(posts: Post[]): void {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  },

  addPost(newPostData: { imageUrl: string; caption?: string; location?: string }): Post {
    const user = AuthService.getCurrentUser();
    const posts = this.getPosts();

    const post: Post = {
      id: `post_${Date.now()}`,
      userId: user?.id || 'usr_anon',
      username: user?.username || 'beduo_creator',
      userAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      imageUrl: newPostData.imageUrl,
      caption: newPostData.caption || '',
      location: newPostData.location || 'Local Moment',
      capturedAt: new Date().toISOString(),
      isLate: false,
      likeCount: 0,
      isLiked: false,
      comments: [],
    };

    const updated = [post, ...posts];
    this.savePosts(updated);

    // Update user post count & streak
    if (user) {
      AuthService.updateProfile({
        postCount: user.postCount + 1,
        streakDays: user.streakDays + 1,
      });
    }

    return post;
  },

  toggleLike(postId: string): Post | null {
    const posts = this.getPosts();
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) return null;

    const target = posts[index];
    const newLiked = !target.isLiked;
    target.isLiked = newLiked;
    target.likeCount += newLiked ? 1 : -1;

    posts[index] = target;
    this.savePosts(posts);
    return target;
  },

  addComment(postId: string, text: string): PostComment | null {
    const posts = this.getPosts();
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) return null;

    const user = AuthService.getCurrentUser();
    const comment: PostComment = {
      id: `c_${Date.now()}`,
      postId,
      userId: user?.id || 'usr_anon',
      username: user?.username || 'user',
      avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      text,
      createdAt: new Date().toISOString(),
    };

    posts[index].comments.push(comment);
    this.savePosts(posts);
    return comment;
  },
};
