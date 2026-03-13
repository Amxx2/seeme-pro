import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, Video, Mic, Activity, Skull, Drumstick, X } from 'lucide-react';

interface RewardedAdModalProps {
    isOpen: boolean;
    feature: 'voice' | 'video' | 'toxic' | 'hunger' | 'live';
    onComplete: () => void;
    onClose: () => void;
    adsWatched?: number;
    adsNeeded?: number;
}

const FEATURE_CONFIG = {
    voice: { icon: <Mic className="w-10 h-10 text-cyan-400" />, color: '#00FFD4', label: 'تحليل الصوت' },
    video: { icon: <Video className="w-10 h-10 text-purple-400" />, color: '#9B59B6', label: 'تحليل الفيديو' },
    toxic: { icon: <Skull className="w-10 h-10 text-red-500" />, color: '#FF453A', label: 'كاشف السمية' },
    hunger: { icon: <Drumstick className="w-10 h-10 text-orange-400" />, color: '#FF9F0A', label: 'كاشف الجوع' },
    live: { icon: <Activity className="w-10 h-10 text-green-400" />, color: '#30D158', label: 'المقابلة المباشرة' },
};

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
    isOpen, feature, onComplete, onClose, adsWatched = 0, adsNeeded = 5
}) => {
    const [phase, setPhase] = useState<'intro' | 'watching' | 'rewarded'>('intro');
    const [timeLeft, setTimeLeft] = useState(30);
    const adRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset on open/close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setPhase('intro');
                setTimeLeft(30);
                if (timerRef.current) clearInterval(timerRef.current);
            }, 300);
        }
    }, [isOpen]);

    // Timer
    useEffect(() => {
        if (phase !== 'watching') return;

        // Push AdSense after 300ms delay
        const adTimer = setTimeout(() => {
            try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.warn('AdSense:', e);
            }
        }, 300);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setPhase('rewarded');
                    setTimeout(() => onComplete(), 1500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearTimeout(adTimer);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, onComplete]);

    if (!isOpen) return null;

    const cfg = FEATURE_CONFIG[feature];
    const ringPct = ((30 - timeLeft) / 30) * 100;
    const circumference = 2 * Math.PI * 26;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] flex items-center justify-center p-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    {/* Header */}
                    <div className="relative p-6 text-center border-b border-white/10">
                        <button onClick={onClose} className="absolute top-4 left-4 text-gray-600 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex justify-center mb-3">
                            <div className="p-3 rounded-full" style={{ backgroundColor: cfg.color + '15', border: `1px solid ${cfg.color}30` }}>
                                {cfg.icon}
                            </div>
                        </div>
                        <h2 className="text-white text-xl font-bold">🔓 افتح التحليل المتميز</h2>
                        <p className="text-gray-400 text-xs mt-1">شاهد فيديو قصير لفتح تقريرك فوراً</p>
                    </div>

                    {/* Progress for LIVE */}
                    {feature === 'live' && (
                        <div className="px-6 py-3 bg-white/5 border-b border-white/5">
                            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                <span>التقدم نحو جلسة مباشرة</span>
                                <span style={{ color: cfg.color }}>{adsWatched} / {adsNeeded}</span>
                            </div>
                            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${(adsWatched / adsNeeded) * 100}%`, backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}80` }} />
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="p-6">
                        {/* AD AREA */}
                        <div className="w-full rounded-xl overflow-hidden mb-5 relative"
                            style={{ minHeight: 160, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            {phase === 'intro' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <Play className="w-10 h-10 text-gray-600" />
                                    <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">محتوى مدعوم</span>
                                </div>
                            )}
                            {phase === 'watching' && (
                                <div ref={adRef}>
                                    {/* Real AdSense */}
                                    <div className="w-full h-40 flex flex-col items-center justify-center gap-2 bg-black/20 rounded-xl">
                                        <div className="text-4xl animate-pulse">🎬</div>
                                        <p className="text-xs text-gray-500 font-mono">Sponsored Content</p>
                                    </div>
                                    {/* Fallback behind ad */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center -z-10 gap-2">
                                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: cfg.color }} />
                                        <span className="text-[10px] text-gray-600">جاري تحميل الإعلان...</span>
                                    </div>
                                </div>
                            )}
                            {phase === 'rewarded' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <CheckCircle className="w-14 h-14 text-green-400 drop-shadow-lg" />
                                    <span className="text-green-400 font-bold">✅ تم! جاري الفتح...</span>
                                    <motion.span
                                        initial={{ y: 0, opacity: 1 }}
                                        animate={{ y: -30, opacity: 0 }}
                                        transition={{ duration: 1.2 }}
                                        className="absolute text-yellow-400 font-black text-lg">
                                        +10 🪙
                                    </motion.span>
                                </motion.div>
                            )}
                        </div>

                        {/* Actions */}
                        {phase === 'intro' && (
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => { setPhase('watching'); setTimeLeft(30); }}
                                    className="w-full py-3 rounded-xl font-bold text-black flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                                    style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}aa)`, boxShadow: `0 0 20px ${cfg.color}40` }}>
                                    <Play className="w-4 h-4 fill-current" />
                                    شاهد وافتح التحليل
                                </button>
                                <button onClick={onClose} className="text-gray-500 text-xs hover:text-gray-300 transition-colors text-center">
                                    ربما لاحقاً
                                </button>
                            </div>
                        )}

                        {phase === 'watching' && (
                            <div className="flex flex-col items-center gap-3">
                                {/* Ring Timer */}
                                <div className="relative w-14 h-14">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                                        <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                        <circle cx="28" cy="28" r="26" fill="none"
                                            stroke={cfg.color} strokeWidth="3"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={circumference - (circumference * ringPct / 100)}
                                            strokeLinecap="round"
                                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-base">{timeLeft}</div>
                                </div>
                                <p className="text-xs font-mono animate-pulse" style={{ color: cfg.color }}>
                                    ⏳ انتظر {timeLeft} ثانية...
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
