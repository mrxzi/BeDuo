import type { UserProfile } from '../types';

const AUTH_KEY = 'beduo_current_user';

export const DEMO_USER: UserProfile = {
  id: 'usr_demo_123',
  username: 'alex_explorer',
  fullName: 'Alex Vance',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  bio: 'Capturing real moments ✨',
  postCount: 14,
  streakDays: 5,
  createdAt: new Date().toISOString(),
};

export const AuthService = {
  getCurrentUser(): UserProfile | null {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) {
      // Default auto-login to DEMO_USER for smooth immediate testing
      localStorage.setItem(AUTH_KEY, JSON.stringify(DEMO_USER));
      return DEMO_USER;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEMO_USER;
    }
  },

  login(username: string): UserProfile {
    const user: UserProfile = {
      ...DEMO_USER,
      id: `usr_${Date.now()}`,
      username: username || 'duo_creator',
      fullName: username ? username.toUpperCase() : 'BeDuo User',
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
  },

  updateProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getCurrentUser() || DEMO_USER;
    const updated = { ...current, ...updates };
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    return updated;
  },
};
