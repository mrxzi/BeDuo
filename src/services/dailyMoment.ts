import type { DailyMomentState } from '../types';

export const DailyMomentService = {
  getDailyState(): DailyMomentState {
    const now = new Date();
    const promptTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0); // 12:00 PM today
    const expiresAt = new Date(promptTime.getTime() + 2 * 60 * 60 * 1000); // 2-hour window

    return {
      isActive: now >= promptTime && now <= expiresAt,
      promptTime: promptTime.toISOString(),
      expiresAt: expiresAt.toISOString(),
      windowMinutes: 120,
      hasPostedToday: false,
    };
  },

  getTimeRemainingText(): string {
    const state = this.getDailyState();
    const now = new Date();
    const expires = new Date(state.expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 'Time window closed';

    const mins = Math.floor(diffMs / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${mins}m ${secs.toString().padStart(2, '0')}s remaining`;
  },
};
