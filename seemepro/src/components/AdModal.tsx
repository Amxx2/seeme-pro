import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdModalProps {
    isOpen: boolean;
    onComplete: () => void;
    onClose: () => void;
    feature: 'voice' | 'video' | 'toxic' | 'hunger' | 'live';
    adsNeeded?: number;
    adsWatched?: number;
}

const FEATURE_LABELS: Record<string, { icon: string; label: string; reward: string }> = {
    voice: { icon: '🎙️', label: 'تحليل الصوت', reward: '+1 محاولة صوت + 10 🪙' },
    video: { icon: '🎬', label: 'تحليل الفيديو', reward: '+1 محاولة فيديو + 10 🪙' },
    toxic: { icon: '☢️', label: 'كاشف السموم', reward: '+1 محاولة كشف + 10 🪙' },
    hunger: { icon: '🍗', label: 'ماسح الجوع', reward: '+1 محاولة مسح + 10 🪙' },
    live: { icon: '🔴', label: 'المقابلة المباشرة', reward: '+1 محاولة LIVE + 50 🪙' },
};

const AdModal = ({ isOpen, onComplete, onClose, feature, adsNeeded = 1, adsWatched = 0 }: AdModalProps) => {
    const [seconds, setSeconds] = useState(30);
    const [isDone, setIsDone] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const adInitialized = useRef(false);

    const featureInfo = FEATURE_LABELS[feature] || FEATURE_LABELS.voice;
    const isLive = feature === 'live';

    useEffect(() => {
        if (!isOpen) {
            setSeconds(30);
            setIsDone(false);
            setShowReward(false);
            adInitialized.current = false;
            return;
        }

        // Reset on open
        setSeconds(30);
        setIsDone(false);
        setShowReward(false);

        timerRef.current = setInterval(() => {
            setSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setIsDone(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Init AdSense
        try {
            if (!adInitialized.current) {
                adInitialized.current = true;
                setTimeout(() => {
                    try {
                        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                    } catch (_) { }
                }, 200);
            }
        } catch (_) { }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen]);

    const handleClaim = () => {
        setShowReward(true);
        setTimeout(() => {
            onComplete();
        }, 1200);
    };

    if (!isOpen) return null;

    const progress = ((30 - seconds) / 30) * 100;
    const circumference = 2 * Math.PI * 38;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md"
                    dir="rtl"
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="relative bg-[#0a0c16] rounded-3xl border border-yellow-500/30 shadow-[0_0_60px_rgba(250,204,21,0.15)] w-full max-w-md mx-4 overflow-hidden"
                    >
                        {/* Gold glow top border */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{featureInfo.icon}</span>
                                <div>
                                    <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest">🎯 إعلان مجاني</p>
                                    <p className="text-white font-black text-sm">شاهد إعلاناً للحصول على محاولة إضافية</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-600 hover:text-gray-400 transition-colors text-xs"
                                disabled={!isDone && seconds > 0}
                            >
                                {isDone ? '✕' : '🔒'}
                            </button>
                        </div>

                        {/* Live progress */}
                        {isLive && (
                            <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-red-400 text-xs font-bold">
                                        📺 الإعلان {adsWatched + 1} من {adsNeeded}
                                    </span>
                                    <span className="text-gray-500 text-xs">{adsWatched}/{adsNeeded} مكتمل</span>
                                </div>
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(adsWatched / adsNeeded) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Ad Area */}
                        <div className="px-6 py-4">
                            <div
                                id="seemepro-ad-slot"
                                className="w-full min-h-[250px] bg-black/30 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center relative"
                            >
                                <ins
                                    className="adsbygoogle"
                                    style={{ display: 'block', minHeight: 250, width: '100%' }}
                                    data-ad-client="ca-pub-4433736715872551"
                                    data-ad-slot="auto"
                                    data-ad-format="auto"
                                    data-full-width-responsive="true"
                                />
                                {/* Fallback design when AdSense isn't loaded */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 flex items-center justify-center mb-3 animate-pulse">
                                        <span className="text-2xl">📢</span>
                                    </div>
                                    <p className="text-gray-600 text-xs font-mono tracking-wider">ADVERTISEMENT</p>
                                    <p className="text-gray-700 text-xs">SeeMePro Premium Partner</p>
                                </div>
                            </div>
                        </div>

                        {/* Countdown + Claim */}
                        <div className="px-6 pb-6 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-6">
                                {/* Circular progress */}
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 90 90">
                                        <circle
                                            cx="45" cy="45" r="38"
                                            fill="none"
                                            stroke="rgba(255,255,255,0.05)"
                                            strokeWidth="5"
                                        />
                                        <motion.circle
                                            cx="45" cy="45" r="38"
                                            fill="none"
                                            stroke={isDone ? '#22c55e' : '#eab308'}
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {isDone ? (
                                            <span className="text-green-400 text-2xl font-black">✓</span>
                                        ) : (
                                            <span className="text-yellow-400 font-black text-xl">{seconds}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    {!isDone ? (
                                        <p className="text-gray-400 text-sm text-center">
                                            ⏳ انتظر <span className="text-yellow-400 font-black">{seconds}</span> ثانية...
                                        </p>
                                    ) : (
                                        <p className="text-green-400 text-sm font-bold text-center animate-pulse">✅ الإعلان منتهي!</p>
                                    )}
                                    <p className="text-yellow-400/70 text-xs text-center mt-1">المكافأة: {featureInfo.reward}</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isDone && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        onClick={handleClaim}
                                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-105 transition-all"
                                    >
                                        ✅ تم! احصل على محاولتك
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Reward popup animation */}
                            <AnimatePresence>
                                {showReward && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, y: -60, scale: 1.2 }}
                                        exit={{ opacity: 0, y: -100 }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none text-3xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]"
                                    >
                                        +10 🪙
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AdModal;
