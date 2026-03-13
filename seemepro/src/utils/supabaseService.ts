import { supabase } from '../config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserProfile = {
    id: string;
    username: string | null;
    coins: number;
    scans_remaining: number;
    badges: string[];
};

export type LeaderboardEntry = {
    id: string | number;
    username: string;
    score: number;
    rank: number;
    country?: string;
    medal?: string;
};

// ─── Startup diagnostics ──────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string;

console.log('[supabaseService] VITE_SUPABASE_URL    :', supabaseUrl ? '✅ present' : '❌ MISSING');
console.log('[supabaseService] VITE_SUPABASE_ANON_KEY:', supabaseKey ? `✅ ${supabaseKey.slice(0, 20)}…` : '❌ MISSING');
console.log('[aiChatService]   VITE_OPENAI_API_KEY  :', openaiKey ? `✅ ${openaiKey.slice(0, 10)}…` : '❌ MISSING');

// ─── loadUserProfile ──────────────────────────────────────────────────────────
/**
 * Fetches the current authenticated user's profile from the `profiles` table.
 * Returns null if the user is not authenticated or no profile exists.
 * Defaults coins and scans_remaining to 0 if the DB value is null.
 */
export async function loadUserProfile(): Promise<UserProfile | null> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, coins, scans_remaining, badges')
            .eq('id', user.id)
            .single();

        if (error || !data) {
            console.error('[supabaseService] profiles fetch error:', error?.message);
            return null;
        }

        const profile: UserProfile = {
            id: data.id,
            username: data.username ?? null,
            coins: data.coins ?? 0,
            scans_remaining: data.scans_remaining ?? 0,
            badges: data.badges ?? [],
        };

        console.log('✅ Supabase Connected — profile loaded:', {
            username: profile.username,
            coins: profile.coins,
            scans_remaining: profile.scans_remaining,
        });

        return profile;
    } catch (err) {
        console.error('[supabaseService] Unexpected error in loadUserProfile:', err);
        return null;
    }
}

// ─── loadLeaderboard ──────────────────────────────────────────────────────────
/**
 * Fetches the top N users from the `global_leaderboard` view.
 * Falls back to an empty array on error.
 */
export async function loadLeaderboard(limit = 6): Promise<LeaderboardEntry[]> {
    try {
        const { data, error } = await supabase
            .from('global_leaderboard')
            .select('id, username, score, rank, country, medal')
            .order('rank', { ascending: true })
            .limit(limit);

        if (error || !data) {
            console.error('[supabaseService] global_leaderboard fetch error:', error?.message);
            return [];
        }

        console.log(`✅ Supabase Connected — leaderboard loaded (${data.length} entries)`);
        return data as LeaderboardEntry[];
    } catch (err) {
        console.error('[supabaseService] Unexpected error in loadLeaderboard:', err);
        return [];
    }
}

