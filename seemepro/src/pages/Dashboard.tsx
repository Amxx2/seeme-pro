import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Medal, MapPin, Search, UserCircle, Star, ShieldAlert, Video, Bell, Send, Copy, Check, X, Play, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { sendNativeNotification } from '../utils/notificationService';
import { useTranslation } from 'react-i18next';
import { loadUserProfile, loadLeaderboard, type LeaderboardEntry } from '../utils/supabaseService';

// Fallback leaderboard (shown while loading or if Supabase returns nothing)
const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
    { id: 1, username: "@CyberScanner", score: 15420, rank: 1, medal: 'platinum', country: 'UAE' },
    { id: 2, username: "@TruthSeeker99", score: 14200, rank: 2, medal: 'gold', country: 'KSA' },
    { id: 3, username: "@VoiceTracker", score: 12850, rank: 3, medal: 'gold', country: 'USA' },
    { id: 4, username: "@LieDetectorX", score: 10400, rank: 4, medal: 'silver', country: 'UK' },
    { id: 5, username: "@CryptoAnalyzer", score: 9800, rank: 5, medal: 'silver', country: 'EGY' },
    { id: 6, username: "@EagleEye", score: 8500, rank: 6, medal: 'bronze', country: 'TUR' },
];

const getMedalColor = (medal: string) => {
    switch (medal) {
        case 'platinum': return 'text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.8)] border-cyan-300 bg-cyan-300/10';
        case 'gold': return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] border-yellow-400 bg-yellow-400/10';
        case 'silver': return 'text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)] border-gray-300 bg-gray-300/10';
        case 'bronze': return 'text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)] border-amber-600 bg-amber-600/10';
        default: return 'text-gray-500';
    }
};

// ─── Ad Modal ────────────────────────────────────────────────────────────────
const AdModal = ({ onClose, onReward }: { onClose: () => void; onReward: (coinsEarned: number) => void }) => {
    const [countdown, setCountdown] = useState(5);
    const [canClose, setCanClose] = useState(false);
    const [phase, setPhase] = useState<'ad' | 'reward'>('ad');
    const [coinsEarned] = useState(40); // 200 coins / 5 ads = 40 per ad

    useEffect(() => {
        if (countdown <= 0) { setCanClose(true); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleClaim = () => {
        setPhase('reward');
        onReward(coinsEarned);
        setTimeout(onClose, 1800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <AnimatePresence mode="wait">
                {phase === 'ad' ? (
                    <motion.div
                        key="ad"
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-[#0d1b2a] to-[#0a0f1e]"
                    >
                        {/* Ad Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Sponsored</span>
                            <div className="flex items-center gap-2">
                                {!canClose ? (
                                    <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                                        Skip in {countdown}s
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleClaim}
                                        className="text-xs font-bold text-white bg-green-500/20 border border-green-500/40 hover:bg-green-500/40 px-3 py-1 rounded-full transition-all flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> Claim +{coinsEarned} Coins
                                    </button>
                                )}
                                {canClose && (
                                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Ad Content */}
                        <div className="relative aspect-video bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center gap-4 p-8">
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_rgba(129,140,248,0.5)_0%,_transparent_70%)]" />
                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(129,140,248,0.4)]">
                                    <Play className="w-8 h-8 text-white fill-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">SeemePro Premium</h3>
                                <p className="text-sm text-gray-300 max-w-xs">Unlock unlimited AI scans, priority analysis, and exclusive insights.</p>
                                <div className="mt-4 flex items-center gap-2 justify-center">
                                    <span className="text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-3 py-1 rounded-full font-bold">
                                        🔥 50% OFF — Limited Time
                                    </span>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 5, ease: 'linear' }}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-black/20 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Watch ads to earn coins</span>
                            <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                Learn more <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="reward"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 flex flex-col items-center gap-3 text-center"
                    >
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.6 }}
                            className="text-7xl"
                        >🪙</motion.div>
                        <h3 className="text-2xl font-black text-yellow-400">+{coinsEarned} Coins!</h3>
                        <p className="text-sm text-gray-400">Added to your wallet</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Share Modal ──────────────────────────────────────────────────────────────
const ShareModal = ({ code, onClose, onShare }: { code: string; onClose: () => void; onShare: () => void }) => {
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleShare = async () => {
        const text = `Join me on SeemePro – AI Body Language & Voice Analysis!\nUse my invite code: ${code}\nhttps://seemepro.app`;
        if (navigator.share) {
            try { await navigator.share({ title: 'SeemePro Invite', text }); }
            catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(text);
        }
        if (!shared) {
            setShared(true);
            onShare();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl bg-gradient-to-br from-[#0d1b2a] to-[#0a0f1e] p-6 flex flex-col gap-5"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                    <X className="w-4 h-4" />
                </button>

                <div className="text-center">
                    <div className="text-4xl mb-2">🎁</div>
                    <h3 className="text-xl font-black text-white">Share & Earn</h3>
                    <p className="text-sm text-gray-400 mt-1">Share your code and earn <span className="text-yellow-400 font-bold">+1000 Coins</span></p>
                </div>

                {/* Code display */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Your Invite Code</p>
                        <p className="text-2xl font-black font-mono tracking-widest text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{code}</p>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`p-3 rounded-xl border transition-all ${copied ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold text-gray-300"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={shared}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-bold ${shared
                            ? 'bg-green-500/20 border-green-500/40 text-green-400 cursor-default'
                            : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-300 hover:border-indigo-400/60 hover:from-indigo-500/30 hover:to-purple-500/30'
                            }`}
                    >
                        {shared ? <><Check className="w-4 h-4" /> Claimed!</> : <><Send className="w-4 h-4" /> Share Now</>}
                    </button>
                </div>

                {shared && (
                    <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-xs text-green-400 font-bold"
                    >
                        ✅ +1000 Coins added to your wallet!
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
};

// ─── Quest Progress State (persisted in memory per session) ───────────────────
const Dashboard = () => {
    const { t } = useTranslation();
    const { user, addCoins, addNotification } = useAppStore();
    const navigate = useNavigate();

    // Quest state
    const [videoProgress, setVideoProgress] = useState(0);
    const [adsProgress, setAdsProgress] = useState(0);
    const [adsClaimed, setAdsClaimed] = useState(false);
    const [inviteShared, setInviteShared] = useState(false);

    // Modals
    const [showAdModal, setShowAdModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // ── Supabase live data ─────────────────────────────────────
    const [lbData, setLbData] = useState<LeaderboardEntry[]>(FALLBACK_LEADERBOARD);
    const [lbLoading, setLbLoading] = useState(true);
    const [supaCoins, setSupaCoins] = useState<number | null>(null);
    const [supaScans, setSupaScans] = useState<number | null>(null);

    useEffect(() => {
        // Load leaderboard
        loadLeaderboard(6).then((rows) => {
            if (rows.length > 0) setLbData(rows);
            setLbLoading(false);
        });
        // Load user profile stats from Supabase
        loadUserProfile().then((profile) => {
            if (profile) {
                setSupaCoins(profile.coins);
                setSupaScans(profile.scans_remaining);
            }
        });
    }, []);

    // Derived display values — prefer Supabase data, fall back to local store
    const displayCoins = supaCoins ?? user.coins;
    const displayScans = supaScans ?? (user.credits?.voice ?? 0) + (user.credits?.video ?? 0);

    // Simulate video quest progress from actual video attempts used
    useEffect(() => {
        const v = parseInt(sessionStorage.getItem('questVideos') || '0', 10);
        setVideoProgress(Math.min(v, 3));
        const a = parseInt(sessionStorage.getItem('questAds') || '0', 10);
        setAdsProgress(Math.min(a, 5));
        setAdsClaimed(sessionStorage.getItem('questAdsClaimed') === '1');
        setInviteShared(sessionStorage.getItem('questInviteShared') === '1');
    }, []);

    // ── Handlers ──────────────────────────────────────────────
    const handleVideoQuest = () => {
        navigate('/video');
    };

    const handleWatchAd = () => {
        if (adsClaimed) return;
        setShowAdModal(true);
    };

    const handleAdReward = (coinsEarned: number) => {
        const newCount = adsProgress + 1;
        setAdsProgress(Math.min(newCount, 5));
        sessionStorage.setItem('questAds', String(newCount));
        addCoins(coinsEarned);

        if (newCount >= 5) {
            setAdsClaimed(true);
            sessionStorage.setItem('questAdsClaimed', '1');
            // Full quest reward
            addCoins(200 - coinsEarned); // top up to 200 total
            addNotification({ type: 'coin', title: '🏆 Quest Complete!', body: 'You watched 5 ads and earned 200 coins!', detail: 'Daily Quest Reward' });
            sendNativeNotification('🏆 Quest Complete!', 'You watched 5 ads and earned 200 coins!', 'coin');
        }
    };

    const handleShareQuest = () => {
        setShowShareModal(true);
    };

    const handleInviteShared = () => {
        if (inviteShared) return;
        setInviteShared(true);
        sessionStorage.setItem('questInviteShared', '1');
        addCoins(1000);
        addNotification({ type: 'coin', title: '🎁 Invite Shared!', body: 'You earned 1000 coins for sharing your invite code!', detail: `Code: ${user.referralCode}` });
        sendNativeNotification('🎁 Invite Shared!', 'You earned 1000 coins for sharing your invite code!', 'coin');
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full max-w-[1400px] mx-auto overflow-hidden">

            {/* Modals */}
            <AnimatePresence>
                {showAdModal && (
                    <AdModal
                        key="ad-modal"
                        onClose={() => setShowAdModal(false)}
                        onReward={handleAdReward}
                    />
                )}
                {showShareModal && (
                    <ShareModal
                        key="share-modal"
                        code={user.referralCode ?? 'SEEMEPRO'}
                        onClose={() => setShowShareModal(false)}
                        onShare={handleInviteShared}
                    />
                )}
            </AnimatePresence>

            {/* Left Column - User Dashboard & Quests */}
            <div className="w-full lg:w-[450px] flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8">

                {/* User Identity Card */}
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="flex items-start justify-between mb-6 relative z-10">
                        <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer group/profile">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/50 to-purple-600/50 p-1 flex items-center justify-center relative shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover/profile:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-shadow">
                                <div className="absolute inset-0 rounded-full border border-white/20 animate-[spin_4s_linear_infinite]"></div>
                                {user.avatar ? (
                                    <img src={user.avatar} className="w-full h-full rounded-full object-cover relative z-10" alt="Avatar" />
                                ) : (
                                    <span className="text-2xl font-bold text-white shadow-lg relative z-10">
                                        {user.isLoggedIn ? user.username?.charAt(0).toUpperCase() : '?'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-wide group-hover/profile:text-cyan-400 transition-colors">
                                    {user.isLoggedIn ? user.username : t('guest_user')}
                                </h2>
                                <p className="text-sm font-mono text-gray-400">{t('rank')}: #Unranked</p>
                            </div>
                        </Link>

                        {/* Current Medal */}
                        <div className={`p-2 rounded-xl flex items-center justify-center border ${getMedalColor('bronze')} shadow-lg`}>
                            <Medal className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center group-hover:bg-white/10 transition-colors duration-500">
                            <span id="user-coins" className="text-3xl font-bold text-yellow-400 font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                                {displayCoins.toLocaleString()}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-1">{t('total_coins')}</span>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center group-hover:bg-white/10 transition-colors duration-500">
                            <span id="user-scans" className="text-3xl font-bold text-analysis font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">
                                {displayScans}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-1">{t('total_scans')}</span>
                        </div>
                    </div>
                </div>

                {/* Quests & Tasks Tab */}
                <div className="flex-1 glass-card rounded-3xl p-6 flex flex-col gap-6 hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" /> {t('daily_quests')}
                        </h3>
                        <QuestTimer />
                    </div>

                    <div className="space-y-4">
                        {/* Quest 1: Analyze Videos */}
                        <QuestCard
                            title={t('quest_videos')}
                            reward={500}
                            progress={videoProgress}
                            total={3}
                            icon={<Video className="w-5 h-5" />}
                            isCompleted={videoProgress >= 3}
                            actionLabel={t('go_analyze')}
                            onAction={handleVideoQuest}
                        />
                        {/* Quest 2: Watch Ads */}
                        <QuestCard
                            title={t('quest_ads')}
                            reward={200}
                            progress={Math.min(adsProgress, 5)}
                            total={5}
                            icon={<ShieldAlert className="w-5 h-5" />}
                            isCompleted={adsClaimed}
                            actionLabel={adsClaimed ? `${t('claimed')} ✓` : t('watch_ad_count', { count: Math.min(adsProgress, 5) })}
                            onAction={handleWatchAd}
                            disabled={adsClaimed}
                        />
                        {/* Quest 3: Share Invite */}
                        <QuestCard
                            title={t('quest_invite')}
                            reward={1000}
                            progress={inviteShared ? 1 : 0}
                            total={1}
                            icon={<UserCircle className="w-5 h-5" />}
                            isCompleted={inviteShared}
                            actionLabel={inviteShared ? `${t('shared')} ✓` : t('share_code')}
                            onAction={handleShareQuest}
                            disabled={inviteShared}
                        />
                    </div>
                </div>

                {/* Test Notifications */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 hover:-translate-y-1 transition-transform duration-300">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Notification Lab
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <TestNotifyBtn
                            label="Coins"
                            type="coin"
                            title="🪙 Real-time Coins!"
                            body="You just received 500 Cyber-Coins from a referral."
                            detail="TXID: 0x55AE...F2"
                        />
                        <TestNotifyBtn
                            label="Support"
                            type="support"
                            title="🎧 Support Reply"
                            body="Agent Sarah: I have reviewed your analysis and it looks perfect."
                            detail="Ticket #1024"
                        />
                        <TestNotifyBtn
                            label="Analysis"
                            type="analysis"
                            title="🔬 Analysis Ready"
                            body="The video 'Interview_01.mp4' has been processed successfully."
                            detail="98% Clarity Score"
                        />
                        <TestNotifyBtn
                            label="Transfer"
                            type="transfer"
                            title="💸 Transfer Success"
                            body="You successfully transferred 250 coins to @TruthSeeker."
                            detail="Fee: 0.5 Coins"
                        />
                    </div>
                </div>
            </div>

            {/* Right Column - Global Leaderboard */}
            <div className="flex-1 glass-panel rounded-3xl p-6 lg:p-8 flex flex-col h-full ring-1 ring-white/5 shadow-2xl group">

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" /> {t('global_leaderboard')}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">{t('leaderboard_desc')}</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('search_user')}
                            className="w-full bg-black/50 border border-accent rounded-full py-2 ps-10 pe-4 text-sm font-mono focus:outline-none focus:border-primary/50 text-white transition-colors placeholder:text-gray-600"
                        />
                    </div>
                </div>

                {/* Podium UI for Top 3 */}
                <div className="hidden sm:flex items-end justify-center gap-4 mb-16 mt-6 px-4">
                    {/* 2nd Place */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-gray-400 p-1 bg-gray-400/10 backdrop-blur-md">
                                <UserCircle className="w-full h-full text-gray-400" />
                            </div>
                            <div className="absolute -top-2 -right-2 rtl:right-auto rtl:-left-2 bg-gray-400 text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0a0c16]">2</div>
                        </div>
                        <div className="w-24 h-24 bg-white/5 border border-white/10 border-b-0 rounded-t-2xl flex flex-col items-center justify-center">
                            <span className="text-white font-bold text-xs truncate w-20 text-center">{lbData[1]?.username ?? '@TruthSeeker99'}</span>
                            <span className="text-gray-400 text-[10px] font-mono">{((lbData[1]?.score ?? 14200) / 1000).toFixed(1)}k pts</span>
                        </div>
                    </motion.div>

                    {/* 1st Place (Center & Tallest) */}
                    <motion.div
                        initial={{ y: 70, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-yellow-400 p-1 bg-yellow-400/10 shadow-[0_0_30px_rgba(250,204,21,0.3)] backdrop-blur-md">
                                <UserCircle className="w-full h-full text-yellow-400" />
                            </div>
                            <div className="absolute -top-2 -right-2 rtl:right-auto rtl:-left-2 bg-yellow-400 text-black text-[12px] font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#0a0c16]">1</div>
                        </div>
                        <div className="w-32 h-36 bg-gradient-to-b from-yellow-400/20 via-white/5 to-transparent border border-yellow-400/30 border-b-0 rounded-t-3xl flex flex-col items-center justify-center">
                            <span className="text-white font-black text-sm truncate w-28 text-center px-1">{lbData[0]?.username ?? '@CyberScanner'}</span>
                            <span className="text-yellow-400 text-xs font-mono font-bold tracking-widest mt-1">{((lbData[0]?.score ?? 15420) / 1000).toFixed(1)}k pts</span>
                            <div className="mt-2 px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/30">
                                <span className="text-[10px] text-yellow-400 uppercase font-black">Platinum Elite</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-amber-600 p-1 bg-amber-600/10 backdrop-blur-md">
                                <UserCircle className="w-full h-full text-amber-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 rtl:right-auto rtl:-left-2 bg-amber-600 text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0a0c16]">3</div>
                        </div>
                        <div className="w-24 h-20 bg-white/5 border border-white/10 border-b-0 rounded-t-2xl flex flex-col items-center justify-center">
                            <span className="text-white font-bold text-xs truncate w-20 text-center">{lbData[2]?.username ?? '@VoiceTracker'}</span>
                            <span className="text-gray-400 text-[10px] font-mono">{((lbData[2]?.score ?? 12850) / 1000).toFixed(1)}k pts</span>
                        </div>
                    </motion.div>
                </div>

                {/* Leaderboard List */}
                <div id="leaderboard-list" className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {lbLoading ? (
                        // Loading skeleton
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse gap-4">
                                <div className="w-8 h-5 bg-white/10 rounded" />
                                <div className="w-10 h-10 bg-white/10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-white/10 rounded w-32" />
                                    <div className="h-2 bg-white/10 rounded w-20" />
                                </div>
                                <div className="h-4 bg-white/10 rounded w-16" />
                            </div>
                        ))
                    ) : (
                        lbData.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex items-center p-4 rounded-2xl border transition-all hover:translate-x-2 cursor-pointer
                       ${i < 3
                                        ? 'glass-card border-primary/30 hover:border-primary-light shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20'}`}
                            >
                                <div className="w-10 text-center font-bold text-gray-500 font-mono text-lg">
                                    {p.rank}
                                </div>

                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 ps-4 border-s border-accent/30">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${getMedalColor(p.medal ?? 'bronze')}`}>
                                            <UserCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm lg:text-base">{p.username}</h4>
                                            <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {p.country ?? '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:items-end font-mono">
                                        <span className="text-yellow-400 font-bold tracking-wider">{p.score.toLocaleString()}</span>
                                        <span className="text-[10px] text-gray-500 uppercase">{t('power_score')}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>

        </div>
    )
}

// ─── Quest Timer ──────────────────────────────────────────────────────────────
const QuestTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calc = () => {
            const now = new Date();
            const reset = new Date();
            reset.setHours(24, 0, 0, 0);
            const diff = reset.getTime() - now.getTime();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        calc();
        const t = setInterval(calc, 1000);
        return () => clearInterval(t);
    }, []);

    const { t } = useTranslation();
    return <span className="text-xs font-mono text-gray-400">{t('quest_resets')} {timeLeft}</span>;
};

// ─── Quest Card ───────────────────────────────────────────────────────────────
const QuestCard = ({ title, reward, progress, total, icon, isCompleted, actionLabel, onAction, disabled }: {
    title: string; reward: number; progress: number; total: number; icon: React.ReactNode;
    isCompleted?: boolean; actionLabel?: string; onAction?: () => void; disabled?: boolean;
}) => {
    const [pulse, setPulse] = useState(false);

    const handleClick = () => {
        if (disabled || isCompleted) return;
        setPulse(true);
        setTimeout(() => setPulse(false), 400);
        onAction?.();
    };

    return (
        <motion.div
            whileTap={!disabled && !isCompleted ? { scale: 0.97 } : {}}
            className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden
                ${isCompleted
                    ? 'bg-truth/5 border-truth/20'
                    : disabled
                        ? 'bg-white/5 border-white/5 opacity-60 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                }
            `}
            onClick={handleClick}
        >
            {isCompleted && <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+Cgk8cGF0aCBkPSJNMCAwbDQwIDQwIiBzdHJva2U9InJnYmEoMzQsIDE5NywgOTQsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]"></div>}

            {/* Pulse ring on click */}
            <AnimatePresence>
                {pulse && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-indigo-500/20 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${isCompleted ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-accent/50 border-accent text-gray-400'}`}>
                        {isCompleted ? <Check className="w-5 h-5" /> : icon}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${isCompleted ? 'text-truth line-through opacity-70' : 'text-white'}`}>{title}</h4>
                        <span className="text-xs font-mono text-yellow-400 flex items-center gap-1 mt-1">
                            +{reward} Coins
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-mono font-bold ${isCompleted ? 'text-truth' : 'text-gray-400'}`}>
                        {progress}/{total}
                    </span>
                    {!isCompleted ? (
                        <>
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                                    initial={false}
                                    animate={{ width: `${(progress / total) * 100}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                            {actionLabel && (
                                <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded hover:bg-indigo-500/20 transition-colors">
                                    {actionLabel}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-[10px] uppercase font-bold text-truth bg-truth/10 px-2 py-1 rounded">Claimed</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const TestNotifyBtn = ({ label, type, title, body, detail }: any) => {
    const addNotification = useAppStore(state => state.addNotification);

    const handleTrigger = () => {
        // 1. Add to in-app store
        addNotification({ type, title, body, detail });
        // 2. Trigger native OS notification + Sound
        sendNativeNotification(title, body, type);
    };

    return (
        <button
            onClick={handleTrigger}
            className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-[11px] font-bold text-gray-300 group"
        >
            <span className="truncate">{label}</span>
            <Send className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};

export default Dashboard;
