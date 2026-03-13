import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── ATTEMPTS CONFIG ─────────────────────────────────────────────────────────
const ATTEMPTS_CONFIG = {
    voice: { free: 3, adReward: 1, resetHours: 24 },
    video: { free: 2, adReward: 1, resetHours: 24 },
    toxic: { free: 3, adReward: 1, resetHours: 24 },
    hunger: { free: 3, adReward: 1, resetHours: 24 },
    live: { free: 1, adReward: 1, resetHours: 720 }, // monthly, 5 ads needed
};

// ─── RANKS CONFIG ─────────────────────────────────────────────────────────────
export const RANKS = [
    { name: 'مبتدئ', nameEn: 'Rookie', minCoins: 0, icon: '🥉', color: '#CD7F32' },
    { name: 'محقق', nameEn: 'Investigator', minCoins: 100, icon: '🥈', color: '#C0C0C0' },
    { name: 'خبير', nameEn: 'Expert', minCoins: 300, icon: '🥇', color: '#FFD700' },
    { name: 'محلل نخبة', nameEn: 'Elite Analyst', minCoins: 700, icon: '💎', color: '#00FFD4' },
    { name: 'عقل فضي', nameEn: 'Silver Mind', minCoins: 1500, icon: '🧠', color: '#9B59B6' },
    { name: 'أسطورة', nameEn: 'Legend', minCoins: 3000, icon: '👑', color: '#FF6B35' },
];

const ADS_PER_REWARD = 5;

type UserData = {
    isLoggedIn: boolean;
    username: string | null;
    email: string | null;
    avatar: string | null;

    // Auth & Generic
    lastActiveDate: number | null;
    subscriptionTier: 'free' | 'premium_1mo' | 'premium_3mo' | 'premium_6mo' | 'premium_12mo';

    // Core Monetization System Updates (v2)
    credits: {
        voice: number;
        video: number;
        toxic: number;
        hunger: number;
        live: number;
    };
    lastReset: {
        voice: number;
        video: number;
        toxic: number;
        hunger: number;
        live: number;
    };

    coins: number;
    abcoins: number;
    streak: number;
    lastUsedDate: string; // ISO date format YYYY-MM-DD
    liveAdsWatched: number;
    referralCode: string; // "SEEM-" + 5 chars
    referralCoins: number;
};

export type AppNotification = {
    id: string;
    type: 'coin' | 'transfer' | 'support' | 'analysis' | 'system';
    title: string;
    body: string;
    detail?: string;
    timestamp: number;
    read: boolean;
};

export type GameToast = {
    id: string;
    type: 'coins_earned' | 'rank_up' | 'streak' | 'referral' | 'attempts_reset' | 'abcoin';
    message: string;
    icon: string;
    timestamp: number;
};

type AppState = {
    user: UserData;
    language: string;
    gameToasts: GameToast[];

    // Auth
    login: (username: string, email?: string) => void;
    logout: () => void;

    // Gamified Monetization (v2)
    consumeCredit: (feature: 'voice' | 'video' | 'toxic' | 'hunger' | 'live') => boolean;
    addCreditFromAd: (feature: 'voice' | 'video' | 'toxic' | 'hunger' | 'live') => void;
    watchAdForLive: () => boolean;
    checkAndResetCredits: () => void;
    checkStreak: () => void;
    getRank: () => typeof RANKS[0];
    spendAbcoins: (amount: number, feature: 'live' | 'voice') => boolean;

    // Coins
    addCoins: (amount: number) => void;
    addAbcoins: (amount: number) => void;

    // Referral
    generateReferralCode: () => string;
    applyReferral: (code: string) => boolean;

    // Profile
    setLanguage: (lang: string) => void;
    updateAvatar: (dataUrl: string) => void;
    updateUsername: (username: string) => void;
    updateEmail: (email: string) => void;

    // Notifications
    notifications: AppNotification[];
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAllRead: () => void;
    clearNotification: (id: string) => void;

    // Game Toasts
    addGameToast: (toast: Omit<GameToast, 'id' | 'timestamp'>) => void;
    removeGameToast: (id: string) => void;
};

const generateReferralCode = () => `SEEM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialUser: UserData = {
    isLoggedIn: false,
    username: null,
    email: null,
    avatar: null,
    lastActiveDate: null,
    subscriptionTier: 'free',
    credits: {
        voice: 3,
        video: 2,
        toxic: 3,
        hunger: 3,
        live: 1,
    },
    lastReset: {
        voice: 0,
        video: 0,
        toxic: 0,
        hunger: 0,
        live: 0,
    },
    coins: 0,
    abcoins: 0,
    streak: 0,
    lastUsedDate: '',
    liveAdsWatched: 0,
    referralCode: '',
    referralCoins: 0,
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: initialUser,
            language: 'en',
            notifications: [],
            gameToasts: [],

            login: (username, email) => set((state) => {
                const now = Date.now();
                const lastActive = state.user.lastActiveDate;
                const missed = !lastActive || (now - lastActive > 12 * 60 * 60 * 1000);
                if (missed) {
                    setTimeout(() => {
                        get().addNotification({
                            type: 'system',
                            title: 'اشتقنالك كتير! 👋',
                            body: 'بقالك كتير مدخلتش التطبيق، فيه مميزات وتحديثات جديدة نزلت ادخل استكشفها!'
                        });
                    }, 2000);
                }
                return {
                    user: {
                        ...state.user,
                        isLoggedIn: true,
                        username,
                        email: email ?? state.user.email,
                        referralCode: state.user.referralCode ?? generateReferralCode(),
                        lastActiveDate: now,
                    }
                };
            }),

            logout: () => set((state) => ({ user: { ...initialUser, language: state.language } as any })),

            // ─── CONSUME CREDIT ────────────────────────────────────────────────────────
            consumeCredit: (feature) => {
                const { user } = get();
                if (user.subscriptionTier !== 'free') return true;
                if (user.credits[feature] <= 0) return false;

                set((state) => ({
                    user: {
                        ...state.user,
                        credits: {
                            ...state.user.credits,
                            [feature]: state.user.credits[feature] - 1
                        }
                    }
                }));
                return true;
            },

            // ─── ADD CREDIT FROM AD ───────────────────────────────────────────────
            addCreditFromAd: (feature) => {
                set((state) => ({
                    user: {
                        ...state.user,
                        credits: {
                            ...state.user.credits,
                            [feature]: state.user.credits[feature] + 1
                        }
                    }
                }));
                get().addCoins(10);
                get().addGameToast({ type: 'coins_earned', message: '+10 🪙 كوينز مكافأة الإعلان!', icon: '🪙' });
            },

            // ─── CHECK & RESET CREDITS ─────────────────────────────────────────────
            checkAndResetCredits: () => {
                const { user } = get();
                const now = Date.now();
                const updates: Partial<UserData['credits']> = {};
                const resetUpdates: Partial<UserData['lastReset']> = {};
                const toasts: Array<Omit<GameToast, 'id' | 'timestamp'>> = [];

                type FeatureKey = 'voice' | 'video' | 'toxic' | 'hunger' | 'live';
                const features: FeatureKey[] = ['voice', 'video', 'toxic', 'hunger', 'live'];

                features.forEach((feature) => {
                    const config = ATTEMPTS_CONFIG[feature];
                    const lastReset = user.lastReset[feature] || 0;
                    const hoursElapsed = (now - lastReset) / (1000 * 60 * 60);

                    if (hoursElapsed >= config.resetHours) {
                        updates[feature] = Math.max(user.credits[feature], config.free);
                        resetUpdates[feature] = now;
                        if (config.free > 0) {
                            toasts.push({
                                type: 'attempts_reset',
                                message: `⏰ تجددت المحاولات! حصلت على ${config.free} محاولات مجانية لـ ${feature}`,
                                icon: '⏰',
                            });
                        }
                    }
                });

                if (Object.keys(updates).length > 0) {
                    set((state) => ({
                        user: {
                            ...state.user,
                            credits: { ...state.user.credits, ...updates },
                            lastReset: { ...state.user.lastReset, ...resetUpdates }
                        }
                    }));
                    toasts.forEach(t => get().addGameToast(t));
                }
            },

            // ─── WATCH AD FOR LIVE ──────────────────────────────────────────────────
            watchAdForLive: () => {
                const { user } = get();
                const newLiveAds = user.liveAdsWatched + 1;

                if (newLiveAds >= ADS_PER_REWARD) {
                    set((state) => ({
                        user: {
                            ...state.user,
                            liveAdsWatched: 0,
                            credits: {
                                ...state.user.credits,
                                live: state.user.credits.live + 1
                            }
                        }
                    }));
                    get().addCoins(50);
                    get().addGameToast({ type: 'coins_earned', message: '🔴 اكتملت 5 إعلانات! تم فتح حصة Live واحدة! +50 🪙', icon: '🔴' });
                    return true;
                }

                set((state) => ({ user: { ...state.user, liveAdsWatched: newLiveAds } }));
                get().addCoins(10);
                return false;
            },

            // ─── ADD COINS ──────────────────────────────────────────────────────────
            addCoins: (amount) => {
                const prevRank = get().getRank();
                set((state) => ({
                    user: { ...state.user, coins: state.user.coins + amount }
                }));
                const newRank = get().getRank();
                if (newRank.minCoins > prevRank.minCoins) {
                    // Rank up!
                    get().addGameToast({
                        type: 'rank_up',
                        message: `${newRank.icon} ترقية الرتبة! أنت الآن ${newRank.name}`,
                        icon: newRank.icon,
                    });
                    // Web Audio API beep
                    try {
                        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const oscillator = ctx.createOscillator();
                        const gainNode = ctx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(ctx.destination);
                        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
                        oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
                        oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
                        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                        oscillator.start(ctx.currentTime);
                        oscillator.stop(ctx.currentTime + 0.5);
                    } catch (_) { }
                }
            },

            // ─── ADD ABCOINS ─────────────────────────────────────────────────────────
            addAbcoins: (amount) => {
                set((state) => ({
                    user: { ...state.user, abcoins: state.user.abcoins + amount }
                }));
            },

            // ─── SPEND ABCOINS ───────────────────────────────────────────────────────
            spendAbcoins: (amount, feature) => {
                const { user } = get();
                if (user.abcoins < amount) return false;

                set((state) => ({
                    user: {
                        ...state.user,
                        abcoins: state.user.abcoins - amount,
                        credits: {
                            ...state.user.credits,
                            ...(feature === 'live'
                                ? { live: state.user.credits.live + 1 }
                                : { voice: state.user.credits.voice + 5 })
                        }
                    }
                }));
                get().addGameToast({
                    type: 'coins_earned',
                    message: feature === 'live' ? '💎 تم شراء محاولة Live!' : '💎 تم شراء 5 محاولات صوتية!',
                    icon: '💎',
                });
                return true;
            },

            // ─── GET RANK ────────────────────────────────────────────────────────────
            getRank: () => {
                const { user } = get();
                const coins = user.coins;
                let currentRank = RANKS[0];
                for (const rank of RANKS) {
                    if (coins >= rank.minCoins) currentRank = rank;
                    else break;
                }
                return currentRank;
            },

            // ─── REFERRAL ────────────────────────────────────────────────────────────
            generateReferralCode: () => {
                const code = generateReferralCode();
                set((state) => ({ user: { ...state.user, referralCode: code } }));
                return code;
            },

            applyReferral: (code) => {
                const { user } = get();
                if (!code || code === user.referralCode) return false;
                // Apply referral bonus (adds flat credits)
                set((state) => ({
                    user: {
                        ...state.user,
                        coins: state.user.coins + 50,
                        credits: {
                            ...state.user.credits,
                            voice: state.user.credits.voice + 1,
                            video: state.user.credits.video + 1,
                            toxic: state.user.credits.toxic + 1,
                            hunger: state.user.credits.hunger + 1,
                        }
                    }
                }));
                get().addGameToast({ type: 'referral', message: '🎁 كود دعوة مفعّل! +50 🪙', icon: '🎁' });
                return true;
            },

            // ─── STREAK ──────────────────────────────────────────────────────────────
            checkStreak: () => {
                const { user } = get();
                const today = getTodayDate();
                const lastUsed = user.lastUsedDate;

                if (lastUsed === today) return; // already checked today

                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

                let newStreak = 1;
                let bonus = 0;

                if (lastUsed === yesterdayStr) {
                    newStreak = user.streak + 1;
                } else if (lastUsed && lastUsed < yesterdayStr) {
                    newStreak = 1; // reset
                }

                bonus = newStreak * 5;

                // Prepare state updates including milestone rewards
                const nextUserObj = {
                    ...user,
                    streak: newStreak,
                    lastUsedDate: today,
                };

                // Set the store immediately to avoid duplicate streak logic overriding updates downstream
                set({ user: nextUserObj });

                get().addCoins(bonus);

                // Add specific streak bonuses AFTER regular updates
                if (newStreak >= 30) {
                    get().addAbcoins(5);
                    get().addGameToast({ type: 'streak', message: '🏆 30 يوم متواصل! +5 AbCoins 💎', icon: '🏆' });
                } else if (newStreak >= 7) {
                    set((s) => ({
                        user: {
                            ...s.user,
                            credits: {
                                ...s.user.credits,
                                voice: s.user.credits.voice + 1,
                                video: s.user.credits.video + 1,
                                toxic: s.user.credits.toxic + 1,
                                hunger: s.user.credits.hunger + 1,
                            }
                        }
                    }));
                }

                if (newStreak > 1) {
                    get().addGameToast({
                        type: 'streak',
                        message: `🔥 ${newStreak} أيام متواصلة! +${bonus} 🪙`,
                        icon: '🔥',
                    });
                }
            },

            // ─── PROFILE ─────────────────────────────────────────────────────────────
            setLanguage: (lang) => set({ language: lang }),
            updateAvatar: (dataUrl) => set((state) => ({ user: { ...state.user, avatar: dataUrl } })),
            updateUsername: (username) => set((state) => ({ user: { ...state.user, username } })),
            updateEmail: (email) => set((state) => ({ user: { ...state.user, email } })),

            // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
            addNotification: (n) => set((state) => {
                const newNotification: AppNotification = {
                    ...n,
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: Date.now(),
                    read: false
                };
                return { notifications: [newNotification, ...state.notifications].slice(0, 50) };
            }),

            markAllRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true }))
            })),

            clearNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),

            // ─── GAME TOASTS ──────────────────────────────────────────────────────────
            addGameToast: (toast) => set((state) => {
                const newToast: GameToast = {
                    ...toast,
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: Date.now(),
                };
                return { gameToasts: [...state.gameToasts, newToast].slice(-5) };
            }),

            removeGameToast: (id) => set((state) => ({
                gameToasts: state.gameToasts.filter(t => t.id !== id)
            })),
        }),
        {
            name: 'seemepro_store',
            version: 4,
            migrate: (_persistedState: any, _version: number) => {
                return { user: initialUser, language: 'en' };
            },
        }
    )
);
