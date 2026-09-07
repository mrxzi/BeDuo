import type { Post, PostComment } from '../types';
import { AuthService } from './auth';

const POSTS_KEY = 'beduo_posts_v1';

const INITIAL_MOCK_POSTS: Post[] = [];

export const PostService = {
  getPosts(): Post[] {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
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
