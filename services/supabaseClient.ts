// src/services/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
    );
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Store session in localStorage (default)
        storage: localStorage,
        // Automatically refresh token before it expires
        autoRefreshToken: true,
        // Persist session across browser tabs
        persistSession: true,
        // Detect session from URL (useful for email confirmations)
        detectSessionInUrl: true
    }
});

// TypeScript types for your database
export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    created_at: string;
                    selected_university_id: string;
                    last_active: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    created_at?: string;
                    selected_university_id?: string;
                    last_active?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    created_at?: string;
                    selected_university_id?: string;
                    last_active?: string;
                };
            };
            chat_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    university_id: string;
                    title: string;
                    created_at: string;
                    last_modified: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    university_id: string;
                    title?: string;
                    created_at?: string;
                    last_modified?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    university_id?: string;
                    title?: string;
                    created_at?: string;
                    last_modified?: string;
                };
            };
            messages: {
                Row: {
                    id: string;
                    session_id: string;
                    text: string;
                    sender: 'user' | 'ai';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    text: string;
                    sender: 'user' | 'ai';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    text?: string;
                    sender?: 'user' | 'ai';
                    created_at?: string;
                };
            };
            user_stats: {
                Row: {
                    user_id: string;
                    experience_points: number;
                    level: number;
                    total_messages: number;
                    badges_unlocked: any; // JSONB
                    topics_explored: string[];
                    last_message_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    experience_points?: number;
                    level?: number;
                    total_messages?: number;
                    badges_unlocked?: any;
                    topics_explored?: string[];
                    last_message_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    user_id?: string;
                    experience_points?: number;
                    level?: number;
                    total_messages?: number;
                    badges_unlocked?: any;
                    topics_explored?: string[];
                    last_message_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
};