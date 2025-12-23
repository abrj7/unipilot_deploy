// src/services/statsService.ts

import { supabase } from './supabaseClient';
import { UserStats, Badge } from '../types';
import { getUserId } from './authService';
import { INITIAL_BADGES } from '../constants';

/**
 * Get user stats from Supabase
 */
export const getUserStats = async (): Promise<UserStats> => {
    const userId = await getUserId();
    if (!userId) {
        // Return default stats if not authenticated
        return {
            experience: 0,
            level: 1,
            badges: INITIAL_BADGES,
            nextLevelXP: 100,
            topicsExplored: [],
            messagesCount: 0,
        };
    }

    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching user stats:', error);
        // Return default stats on error
        return {
            experience: 0,
            level: 1,
            badges: INITIAL_BADGES,
            nextLevelXP: 100,
            topicsExplored: [],
            messagesCount: 0,
        };
    }

    // Merge badges from database with initial badges structure
    const badgesFromDb = data.badges_unlocked || [];
    const badges = INITIAL_BADGES.map((badge) => ({
        ...badge,
        unlocked: badgesFromDb.some((b: any) => b.id === badge.id),
    }));

    return {
        experience: data.experience_points,
        level: data.level,
        badges,
        nextLevelXP: calculateNextLevelXP(data.level),
        topicsExplored: data.topics_explored || [],
        messagesCount: data.total_messages,
    };
};

/**
 * Calculate XP required for next level
 */
const calculateNextLevelXP = (level: number): number => {
    return level * 100;
};

/**
 * Calculate level from XP
 */
const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 100) + 1;
};

/**
 * Update user stats in Supabase
 */
export const updateUserStats = async (
    updates: Partial<{
        experience: number;
        level: number;
        badges: Badge[];
        topicsExplored: string[];
        messagesCount: number;
    }>
): Promise<void> => {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    const updateData: any = {};

    if (updates.experience !== undefined) {
        updateData.experience_points = updates.experience;
        // Recalculate level based on XP
        updateData.level = calculateLevel(updates.experience);
    }

    if (updates.badges !== undefined) {
        // Store only unlocked badges
        const unlockedBadges = updates.badges
            .filter((b) => b.unlocked)
            .map((b) => ({ id: b.id, name: b.name, unlockedAt: new Date().toISOString() }));
        updateData.badges_unlocked = unlockedBadges;
    }

    if (updates.topicsExplored !== undefined) {
        updateData.topics_explored = updates.topicsExplored;
    }

    if (updates.messagesCount !== undefined) {
        updateData.total_messages = updates.messagesCount;
        updateData.last_message_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('user_stats')
        .update(updateData)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating user stats:', error);
        throw new Error(error.message);
    }
};

/**
 * Add XP to user
 */
export const addExperience = async (xpAmount: number): Promise<UserStats> => {
    const currentStats = await getUserStats();
    const newXP = currentStats.experience + xpAmount;
    const newLevel = calculateLevel(newXP);

    await updateUserStats({
        experience: newXP,
    });

    return {
        ...currentStats,
        experience: newXP,
        level: newLevel,
        nextLevelXP: calculateNextLevelXP(newLevel),
    };
};

/**
 * Unlock a badge for the user
 */
export const unlockBadge = async (badgeId: string): Promise<boolean> => {
    const currentStats = await getUserStats();

    // Check if badge is already unlocked
    const badge = currentStats.badges.find((b) => b.id === badgeId);
    if (!badge || badge.unlocked) {
        return false;
    }

    // Update badges
    const updatedBadges = currentStats.badges.map((b) =>
        b.id === badgeId ? { ...b, unlocked: true } : b
    );

    await updateUserStats({ badges: updatedBadges });

    // Award XP for unlocking badge
    await addExperience(50);

    return true;
};

/**
 * Add a topic to explored topics
 */
export const addExploredTopic = async (topic: string): Promise<void> => {
    const currentStats = await getUserStats();

    if (!currentStats.topicsExplored.includes(topic)) {
        const updatedTopics = [...currentStats.topicsExplored, topic];
        await updateUserStats({ topicsExplored: updatedTopics });

        // Check if we should unlock the explorer badge
        if (updatedTopics.length >= 3) {
            await unlockBadge('explorer');
        }
    }
};

/**
 * Increment message count
 */
export const incrementMessageCount = async (): Promise<void> => {
    const currentStats = await getUserStats();
    const newCount = currentStats.messagesCount + 1;

    await updateUserStats({ messagesCount: newCount });

    // Award XP for each message
    await addExperience(10);

    // Check badge conditions
    if (newCount === 1) {
        await unlockBadge('freshman');
    }

    // Check night owl badge (if message sent after 10 PM)
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
        await unlockBadge('night_owl');
    }
};

/**
 * Process user interaction (message sent)
 * This is a convenience function that handles XP, badges, and topics
 */
export const processUserInteraction = async (
    messageText: string,
    topics: string[] = []
): Promise<{ newBadges: Badge[]; leveledUp: boolean }> => {
    const oldStats = await getUserStats();

    // Increment message count and award XP
    await incrementMessageCount();

    // Add explored topics
    for (const topic of topics) {
        await addExploredTopic(topic);
    }

    const newStats = await getUserStats();

    // Check if user leveled up
    const leveledUp = newStats.level > oldStats.level;

    // Get newly unlocked badges
    const newBadges = newStats.badges.filter(
        (badge, idx) => badge.unlocked && !oldStats.badges[idx].unlocked
    );

    // Check if user reached level 5 for keener badge
    if (newStats.level >= 5) {
        await unlockBadge('scholar');
    }

    return { newBadges, leveledUp };
};

/**
 * Get user context summary for AI
 * This generates a summary of user stats for better AI responses
 */
export const generateUserContextSummary = async (): Promise<string> => {
    const stats = await getUserStats();

    const summary = `
User Level: ${stats.level}
Total Messages: ${stats.messagesCount}
Topics Explored: ${stats.topicsExplored.join(', ') || 'None yet'}
Unlocked Badges: ${stats.badges.filter((b) => b.unlocked).map((b) => b.name).join(', ') || 'None yet'}
  `.trim();

    return summary;
};

/**
 * Reset user stats (for testing or user request)
 */
export const resetUserStats = async (): Promise<void> => {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('user_stats')
        .update({
            experience_points: 0,
            level: 1,
            total_messages: 0,
            badges_unlocked: [],
            topics_explored: [],
        })
        .eq('user_id', userId);

    if (error) {
        console.error('Error resetting user stats:', error);
        throw new Error(error.message);
    }
};

/**
 * Get leaderboard (optional feature)
 */
export const getLeaderboard = async (limit: number = 10): Promise<any[]> => {
    const { data, error } = await supabase
        .from('user_stats')
        .select('user_id, experience_points, level, total_messages')
        .order('experience_points', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }

    return data || [];
};