import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Camera, Coins, Mic, Video, Zap, Shield, Share2,
    Copy, Check, Mail, Lock, Globe, Headphones,
    ChevronRight, LogOut, Star, Gift, Edit2,
    Medal, Trophy, Award, Activity, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useTranslation } from 'react-i18next';

/* ─────────────────────────────────────────────── */
type Tab = 'overview' | 'settings';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

const PRESET_NAMES = [
    "Cyber Ninja", "Neural Detective", "Truth Seeker",
    "Shadow Operative", "Void Walker", "Neon Samurai",
    "Jedi Investigator", "Ghost Protocol"
];

const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&backgroundColor=02040a",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Neon&backgroundColor=02040a",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&backgroundColor=02040a",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Void&backgroundColor=02040a"
];

const Profile = () => {
    const { t } = useTranslation();
    const { user, setLanguage, language, updateAvatar, updateEmail, updateUsername, logout, addCreditFromAd } = useAppStore();

    const [tab, setTab] = useState<Tab>('overview');
    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [copied, setCopied] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Ad simulation state
    const [showAdModal, setShowAdModal] = useState(false);
    const [adProgress, setAdProgress] = useState(0);

    // AI History State
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user.isLoggedIn) {
                setHistoryLoading(false);
                return;
            }
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) return;
                const { data } = await supabase
                    .from('ai_analyses')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (data) setHistory(data);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchHistory();
    }, [user.isLoggedIn]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── Avatar upload ── */
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert(t('max_size_2mb', { defaultValue: 'Max size is 2MB' })); return; }
        const reader = new FileReader();
        reader.onload = () => updateAvatar(reader.result as string);
        reader.readAsDataURL(file);
    };

    /* ── Copy referral code ── */
    const copyReferral = () => {
        if (!user.referralCode) return;
        navigator.clipboard.writeText(`https://seemepro.app/ref/${user.referralCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    /* ── Share via native share API ── */
    const shareReferral = async () => {
        const url = `https://seemepro.app/ref/${user.referralCode}`;
        if (navigator.share) {
            await navigator.share({ title: 'SeemePro', text: '🔍 اكتشف الحقيقة مع SeemePro — ادخل كودي واحصل على مميزات مجانية!', url });
        } else {
            copyReferral();
        }
    };

    /* ── Simulate Ad watch ── */
    const handleWatchAdClick = () => {
        setShowAdModal(true);
        setAdProgress(0);
        let progress = 0;
        const timer = setInterval(() => {
            progress += 3.33; // Approx 3 seconds simulated ad
            setAdProgress(Math.min(progress, 100));
            if (progress >= 100) {
                clearInterval(timer);
                setTimeout(() => {
                    setShowAdModal(false);
                    addCreditFromAd('video');
                    alert(t('reward_unlocked', { defaultValue: '🎉 Reward Unlocked!' }));
                }, 500);
            }
        }, 100);
    };

    /* ── Change Email via Supabase ── */
    const handleChangeEmail = async () => {
        if (!newEmail.includes('@')) { setFeedbackMsg(t('invalid_email', { defaultValue: 'Please enter a valid email.' })); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            updateEmail(newEmail);
            setFeedbackMsg(t('confirmation_sent', { defaultValue: '✅ Confirmation sent to your new email!' }));
            setNewEmail('');
            setTimeout(() => { setShowEmailModal(false); setFeedbackMsg(''); }, 2000);
        } catch (err: any) {
            setFeedbackMsg(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    /* ── Change Password via Supabase ── */
    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) { setFeedbackMsg(t('passwords_mismatch', { defaultValue: 'Passwords do not match.' })); return; }
        if (newPassword.length < 6) { setFeedbackMsg(t('password_too_short', { defaultValue: 'Password must be at least 6 characters.' })); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setFeedbackMsg(t('password_updated', { defaultValue: '✅ Password updated successfully!' }));
            setNewPassword(''); setConfirmPassword('');
            setTimeout(() => { setShowPasswordModal(false); setFeedbackMsg(''); }, 2000);
        } catch (err: any) {
            setFeedbackMsg(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { icon: Mic, label: t('voice_attempts', { defaultValue: 'Voice Attempts' }), value: user.credits?.voice ?? 0, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
        { icon: Video, label: t('video_attempts', { defaultValue: 'Video Attempts' }), value: user.credits?.video ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        { icon: Coins, label: t('coins', { defaultValue: 'Coins' }), value: user.coins, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
        { icon: Gift, label: t('referral_coins', { defaultValue: 'Referral Coins' }), value: user.referralCoins ?? 0, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    ];

    return (
        <div className="max-w-2xl mx-auto pb-10">

            {/* ── Avatar + Identity card ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel border-white/5 rounded-3xl mb-6 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">

                {/* Hero Banner الغلاف الساحر */}
                <div className="h-32 w-full bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1620641788421-a11a95e28d5c?q=80&w=2000&auto=format&fit=crop')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-transparent to-transparent opacity-90" />
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent z-10" />

                <div className="p-8 pt-0 -mt-12 relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-6">
                        {/* Avatar صورة ملكية */}
                        <div className="relative flex-shrink-0 z-20">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-white/5 border-2 border-cyan-400/50 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                                {user.avatar
                                    ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                    : <span className="text-4xl font-black text-cyan-400">
                                        {user.username?.charAt(0).toUpperCase() ?? <User className="w-10 h-10" />}
                                    </span>
                                }
                            </div>
                            {/* Camera button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-2 border-[#0a0c16] hover:scale-110 transition-transform shadow-lg"
                            >
                                <Camera className="w-3.5 h-3.5 text-white" />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>

                        <div className="flex-1 w-full text-center sm:text-left mt-2 sm:mt-0 sm:pb-2">
                            <div className="flex items-center justify-center sm:justify-start gap-3">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight truncate drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                    {user.isLoggedIn ? user.username : t('anonymous', { defaultValue: 'Anonymous' })}
                                </h2>
                                {user.isLoggedIn && (
                                    <button onClick={() => { setEditName(user.username || ''); setShowIdentityModal(true); }} className="text-gray-500 hover:text-cyan-400 transition-colors bg-white/5 p-1.5 rounded-lg border border-white/10 flex-shrink-0" title={t('edit_identity', { defaultValue: 'Edit Identity' })}>
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {user.email && <p className="text-gray-400 text-xs font-mono mt-1 truncate">{user.email}</p>}

                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                                <span className={`text-[10px] border px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-[0_0_10px_currentColor]
                                    ${user.subscriptionTier === 'free' ? 'bg-white/5 border-gray-500/50 text-gray-300' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'}`}>
                                    {user.subscriptionTier === 'free' ? t('free_operative', { defaultValue: 'Free Operative' }) : `⭐ ${t('jedi_master')}`}
                                </span>
                            </div>
                        </div>

                        {/* Logout & Action Buttons */}
                        <div className="flex-shrink-0 flex items-center gap-2 self-start sm:self-center">
                            <button onClick={logout}
                                className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all"
                                title="Logout">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Medals & Trophies Section */}
                    <div className="grid grid-cols-3 gap-3 mb-6 border-t border-white/5 pt-6">
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 group">
                            <Award className="w-8 h-8 text-yellow-500 mb-2 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] transition-all" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{t('master_analyst', { defaultValue: 'Master Analyst' })}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-gray-400/10 to-transparent border border-gray-400/20 group">
                            <Medal className="w-8 h-8 text-gray-300 mb-2 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(209,213,219,0.8)] transition-all" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{t('truth_seeker', { defaultValue: 'Truth Seeker' })}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-amber-700/10 to-transparent border border-amber-700/20 group">
                            <Trophy className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(217,119,6,0.8)] transition-all" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{t('early_adopter', { defaultValue: 'Early Adopter' })}</span>
                        </div>
                    </div>
                    {user.referralCode && (
                        <div className="mt-6 p-4 bg-white/3 border border-white/8 rounded-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-cyan-400" />
                                    <span className="text-sm font-bold text-white">{t('invite_friends', { defaultValue: 'Invite Friends' })}</span>
                                </div>
                                <span className="text-xs text-green-400 font-mono">+100 {t('coins')} / {t('referral', { defaultValue: 'referral' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black/50 border border-accent/40 rounded-xl px-4 py-2.5 font-mono text-cyan-400 text-sm tracking-widest">
                                    {user.referralCode}
                                </div>
                                <button onClick={copyReferral}
                                    className="px-3 py-2.5 bg-accent rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                                    title="Copy link">
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                </button>
                                <button onClick={shareReferral}
                                    className="px-3 py-2.5 bg-primary/20 rounded-xl border border-primary/30 hover:bg-primary/30 transition-colors"
                                    title={t('share', { defaultValue: 'Share' })}>
                                    <Share2 className="w-4 h-4 text-primary" />
                                </button>
                            </div>
                            {copied && <p className="text-[11px] text-green-400 mt-2 font-mono text-center sm:text-left">✅ {t('referral_copied', { defaultValue: 'Invite link copied!' })}</p>}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Tabs ── */}
            <div className="flex gap-2 mb-6 glass-card p-1.5 rounded-2xl border border-white/10">
                {(['overview', 'settings'] as Tab[]).map(t_type => (
                    <button key={t_type}
                        onClick={() => setTab(t_type)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all
                            ${tab === t_type ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-white'}`}>
                        {t_type === 'overview' ? `📊 ${t('overview')}` : `⚙️ ${t('settings')}`}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">

                {/* ══ OVERVIEW TAB ══ */}
                {tab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {stats.map(({ icon: Icon, label, value, color, bg }) => (
                                <div key={label} className={`glass-card rounded-2xl p-5 ${bg} hover:-translate-y-1 transition-transform duration-300`}>
                                    <Icon className={`w-5 h-5 ${color} mb-3`} />
                                    <div className={`text-3xl font-black ${color}`}>{value}</div>
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Live History Section */}
                        <div className="glass-panel border-white/5 rounded-3xl p-6 mb-6 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-analysis" />
                                    <h3 className="font-black text-white uppercase tracking-widest text-sm">{t('live_history', { defaultValue: 'Live Analysis History' })}</h3>
                                </div>
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/20">{t('last_7_days', { defaultValue: 'Last 7 Days' })}</span>
                            </div>

                            <div className="space-y-3">
                                {historyLoading ? (
                                    <div className="text-center text-gray-500 text-xs py-4">{t('loading', { defaultValue: 'Loading...' })}</div>
                                ) : history.length === 0 ? (
                                    <div className="text-center text-gray-500 text-xs py-4">{t('no_history', { defaultValue: 'No analysis history found.' })}</div>
                                ) : (
                                    history.map((record) => (
                                        <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                                <Calendar className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                                                <div>
                                                    <p className="font-mono text-xs text-white">
                                                        {record.id.split('-')[0]} • <span className="text-gray-400">{t(`${record.type.toLowerCase()}_scan`, { defaultValue: `${record.type} Scan` })}</span>
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                                        {new Date(record.created_at).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t('honesty_index', { defaultValue: 'Honesty Index' })}</span>
                                                    <span className={`font-mono text-sm font-bold ${record.truth_score > 80 ? 'text-truth drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : record.truth_score > 50 ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-lie drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}>
                                                        {record.truth_score}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Ad Reward */}
                        <div className="glass-panel border-white/5 rounded-3xl p-6 mb-6 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-black mb-1">{t('monthly_ad_rewards', { defaultValue: 'Monthly Ad Rewards' })}</p>
                                    <h3 className="text-white font-black text-lg">{t('watch_5_ads_reward', { defaultValue: 'Watch 5 Ads → Free Video' })}</h3>
                                </div>
                                <Zap className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-gray-500 font-bold">Progress to Free Live Report</span>
                                    <span className="text-white font-black">{user.liveAdsWatched ?? 0} / 5</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2">
                                    <motion.div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-white"
                                        initial={{ width: 0 }} animate={{ width: `${((user.liveAdsWatched ?? 0) / 5) * 100}%` }}
                                        transition={{ duration: 0.8 }} />
                                </div>
                                <div className="flex justify-between mt-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <div key={n} className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black transition-colors
                                            ${n <= (user.liveAdsWatched ?? 0) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/3 border-white/8 text-gray-700'}`}>
                                            {n}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleWatchAdClick}
                                className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-gray-100 active:scale-98 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" /> {t('watch_ad')}
                            </button>
                        </div>

                        {/* Upgrade */}
                        {user.subscriptionTier === 'free' && (
                            <div className="bg-white rounded-3xl p-6 text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <Shield className="w-6 h-6" />
                                    <p className="font-black text-lg uppercase tracking-tight">Ascend to Jedi Master</p>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">{t('jedi_master_desc', { defaultValue: 'Unlimited analyses, real-time interrogation & priority AI.' })}</p>
                                <Link to="/premium">
                                    <button className="w-full py-3 rounded-xl bg-black text-white font-black uppercase tracking-widest text-sm hover:bg-gray-900 transition-colors">
                                        {t('view_plans', { defaultValue: 'View Plans' })}
                                    </button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ SETTINGS TAB ══ */}
                {tab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="glass-panel border-white/5 rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">

                        {/* Language */}
                        <div className="p-6 border-b border-white/6">
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="w-5 h-5 text-primary" />
                                <span className="font-bold text-white">Language</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {LANGUAGES.map(lang => (
                                    <button key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                                            ${language === lang.code
                                                ? 'bg-primary text-white border border-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                                : 'bg-white/5 text-gray-400 border border-white/8 hover:bg-white/10'}`}>
                                        <span>{lang.flag}</span>
                                        <span className="text-xs">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Change Email */}
                        <button onClick={() => setShowEmailModal(true)}
                            className="w-full flex items-center justify-between p-6 border-b border-white/6 hover:bg-white/3 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-cyan-400" />
                                <div className="text-left">
                                    <p className="font-bold text-white">Change Email</p>
                                    <p className="text-xs text-gray-500 font-mono">{user.email ?? 'Not set'}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </button>

                        {/* Change Password */}
                        <button onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center justify-between p-6 border-b border-white/6 hover:bg-white/3 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-purple-400" />
                                <div className="text-left">
                                    <p className="font-bold text-white">Change Password</p>
                                    <p className="text-xs text-gray-500">Update your account password</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </button>

                        {/* Customer Support */}
                        <a href="mailto:support@seemepro.app"
                            className="w-full flex items-center justify-between p-6 border-b border-white/6 hover:bg-white/3 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Headphones className="w-5 h-5 text-green-400" />
                                <div className="text-left">
                                    <p className="font-bold text-white">Customer Support</p>
                                    <p className="text-xs text-gray-500">support@seemepro.app</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </a>

                        {/* Premium */}
                        <Link to="/premium"
                            className="w-full flex items-center justify-between p-6 hover:bg-white/3 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Star className="w-5 h-5 text-yellow-400" />
                                <div className="text-left">
                                    <p className="font-bold text-white">{t('upgrade_plan', { defaultValue: 'Upgrade Plan' })}</p>
                                    <p className="text-xs text-gray-500">{t('unlock_unlimited', { defaultValue: 'Unlock unlimited access' })}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Change Email Modal ── */}
            <AnimatePresence>
                {showEmailModal && (
                    <Modal title="Change Email" icon={<Mail className="w-5 h-5 text-cyan-400" />}
                        onClose={() => { setShowEmailModal(false); setFeedbackMsg(''); }}>
                        <input type="email" placeholder="New email address" value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="w-full bg-black/50 border border-accent/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60 font-mono text-sm mb-4" />
                        {feedbackMsg && <p className={`text-sm mb-3 ${feedbackMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{feedbackMsg}</p>}
                        <button onClick={handleChangeEmail} disabled={loading}
                            className="w-full py-3 bg-primary text-white font-black rounded-xl uppercase tracking-widest text-sm hover:bg-blue-500 transition-colors disabled:opacity-50">
                            {loading ? 'Updating...' : 'Update Email'}
                        </button>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── Change Password Modal ── */}
            <AnimatePresence>
                {showPasswordModal && (
                    <Modal title="Change Password" icon={<Lock className="w-5 h-5 text-purple-400" />}
                        onClose={() => { setShowPasswordModal(false); setFeedbackMsg(''); }}>
                        <input type="password" placeholder="New password" value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full bg-black/50 border border-accent/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60 font-mono text-sm mb-3" />
                        <input type="password" placeholder="Confirm new password" value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-black/50 border border-accent/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60 font-mono text-sm mb-4" />
                        {feedbackMsg && <p className={`text-sm mb-3 ${feedbackMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{feedbackMsg}</p>}
                        <button onClick={handleChangePassword} disabled={loading}
                            className="w-full py-3 bg-purple-600 text-white font-black rounded-xl uppercase tracking-widest text-sm hover:bg-purple-500 transition-colors disabled:opacity-50">
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── Edit Identity Modal ── */}
            <AnimatePresence>
                {showIdentityModal && (
                    <Modal title="Edit Identity" icon={<User className="w-5 h-5 text-cyan-400" />}
                        onClose={() => setShowIdentityModal(false)}>
                        <div className="mb-6">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Alias / Name</label>
                            <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                                className="w-full bg-black/50 border border-accent/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/60 font-mono text-sm mb-3 outline-none" />

                            <p className="text-xs text-gray-500 mb-2 font-mono">Or choose a generated alias:</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {PRESET_NAMES.map(name => (
                                    <button key={name} onClick={() => setEditName(name)} className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-md text-cyan-500/80 font-mono transition-colors uppercase tracking-widest">
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">System Avatars</label>
                            <div className="flex gap-3 justify-between mb-2">
                                {PRESET_AVATARS.map((url, i) => (
                                    <button key={i} onClick={() => updateAvatar(url)} className={`w-14 h-14 rounded-xl border-2 transition-all overflow-hidden p-1 ${user.avatar === url ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)] bg-cyan-500/20' : 'border-white/10 hover:border-white/30 bg-black/50'}`}>
                                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-contain filter drop-shadow-md" />
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-500 text-center">Or click the camera icon on your profile to upload custom image.</p>
                        </div>

                        <button onClick={() => { updateUsername(editName || 'Anonymous'); setShowIdentityModal(false); }} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-colors shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                            {t('save_identity', { defaultValue: 'Save Identity' })}
                        </button>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── Simulated Ad Modal ── */}
            <AnimatePresence>
                {showAdModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
                        <div className="absolute top-6 left-6 text-white/50 text-xs font-mono tracking-widest uppercase">
                            {t('sponsored_transmission', { defaultValue: 'Sponsored Transmission' })}
                        </div>
                        <button
                            disabled={adProgress < 100}
                            onClick={() => setShowAdModal(false)}
                            className={`absolute top-6 right-6 px-4 py-2 border rounded-full text-xs font-black uppercase tracking-widest transition-all ${adProgress >= 100 ? 'border-white text-white hover:bg-white/10' : 'border-white/20 text-white/20'}`}
                        >
                            Skip &gt;&gt;
                        </button>

                        <div className="text-center w-full max-w-sm px-6">
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(0,255,255,0.1)]">
                                <Zap className="w-10 h-10 text-cyan-400" />
                            </motion.div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t('analyzing_ad', { defaultValue: 'Analyzing Ad Stream...' })}</h3>
                            <p className="text-gray-400 text-sm mb-8 font-mono">{t('ad_dont_close', { defaultValue: 'Do not close this window to receive your reward.' })}</p>

                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-white"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${adProgress}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                            <p className="text-right mt-2 text-xs text-cyan-400 font-mono">{Math.floor(adProgress)}%</p>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ── Reusable Modal ── */
const Modal = ({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0d0f1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
                {icon}
                <h3 className="font-black text-white text-lg">{title}</h3>
            </div>
            {children}
        </motion.div>
    </motion.div>
);

export default Profile;
