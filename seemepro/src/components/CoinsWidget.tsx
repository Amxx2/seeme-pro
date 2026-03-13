import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, CheckCircle2, Copy, Share2, Zap, ShieldAlert, Award } from 'lucide-react';
import { useAppStore, RANKS } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

export const CoinsWidget: React.FC = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user, getRank, spendAbcoins, addGameToast } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const rank = getRank();
    const currentRankIndex = RANKS.findIndex(r => r.name === rank.name);
    const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;

    const progress = nextRank
        ? Math.min(100, (user.coins / nextRank.minCoins) * 100)
        : 100;

    const copyReferral = () => {
        if (!user.referralCode) return;
        navigator.clipboard.writeText(user.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        addGameToast({ type: 'referral', message: 'تم نسخ كود الدعوة!', icon: '📋' });
    };

    const shareOnWhatsApp = () => {
        const text = `🔍 جرب SeeMePro - أقوى محلل سلوكي بالذكاء الاصطناعي!\nاحصل على تحليل مجاني بكود الدعوة: ${user.referralCode}\n🔗 https://gorgeous-bienenstitch-89a7d3.netlify.app?ref=${user.referralCode}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleSpend = (amount: number, feature: 'live' | 'voice') => {
        const success = spendAbcoins(amount, feature);
        if (!success) {
            addGameToast({ type: 'abcoin', message: 'رصيد AbCoins غير كافٍ', icon: '❌' });
        }
    };

    return (
        <div className="fixed top-20 right-4 lg:right-8 z-50 flex flex-col items-end pointer-events-none" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Minimal Pill */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto flex items-center gap-3 bg-black/60 backdrop-blur-md border border-yellow-500/30 rounded-full px-4 py-1.5 shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:bg-black/80 hover:scale-105 transition-all w-fit"
            >
                <div className="flex items-center gap-1.5 font-bold text-sm text-yellow-500 mr-2">
                    <span className="text-lg drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">{rank.icon}</span>
                    <span className="hidden sm:inline text-white/90">{rank.name}</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-1.5 font-bold text-sm text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span>{user.coins.toLocaleString()}</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-1.5 font-bold text-sm text-cyan-400">
                    <Zap className="w-4 h-4" />
                    <span>{user.abcoins}</span>
                </div>
            </button>

            {/* Dropdown Card */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="pointer-events-auto mt-3 w-72 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 text-left rtl:text-right"
                    >
                        {/* Current Status */}
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">المستوى الحالي</span>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{rank.icon}</span>
                                <span className="text-xl font-black text-white" style={{ color: rank.color }}>{rank.name}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {nextRank && (
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                    <span>{user.coins} / {nextRank.minCoins}</span>
                                    <span>للوصول إلى {nextRank.icon} {nextRank.name}</span>
                                </div>
                                <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)] transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Ranks Ladder */}
                        <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1 stylish-scrollbar">
                            {RANKS.map((r) => (
                                <div key={r.name} className={`flex justify-between items-center text-xs p-1.5 rounded-lg ${user.coins >= r.minCoins ? 'bg-white/10' : 'opacity-40'}`}>
                                    <div className="flex items-center gap-2">
                                        <span>{r.icon}</span>
                                        <span className="font-bold text-white" style={{ color: r.color }}>{r.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-gray-400">{r.minCoins}</span>
                                        {user.coins >= r.minCoins ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <div className="w-3 h-3 border border-white/20 rounded-full" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="w-full h-px bg-white/10 my-1" />

                        <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5 text-xs font-bold text-gray-300">
                            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-blue-400" />Live Ads: {user.liveAdsWatched}</span>
                            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-orange-400" />Streak: {user.streak}</span>
                        </div>

                        {/* AbCoin Store */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">💎 Spend AbCoins</span>
                            <button onClick={() => handleSpend(3, 'live')} className="w-full relative overflow-hidden group border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl p-2.5 transition-colors flex justify-between items-center text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-cyan-400" /> 3 AbCoins</span>
                                <span className="text-purple-300">→ 1 Live Credit 🔴</span>
                            </button>
                            <button onClick={() => handleSpend(1, 'voice')} className="w-full border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-xl p-2 transition-colors flex justify-between items-center text-xs font-bold text-white">
                                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-cyan-400" /> 1 AbCoin</span>
                                <span className="text-cyan-300">→ 5 Voice Credits 🎙️</span>
                            </button>
                        </div>

                        {/* Referral Section */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold">Invite & Earn 50 🪙</span>
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">New</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={copyReferral} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold py-2 rounded-xl transition-colors border border-white/10">
                                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                                    {copied ? 'Copied' : user.referralCode}
                                </button>
                                <button onClick={shareOnWhatsApp} className="w-10 flex items-center justify-center bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 text-[#25D366] rounded-xl transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
