import {
    Bell, Coins, CreditCard, Headphones, Activity, Info,
    Check, Trash2, X, Zap, Star, Clock, ChevronRight, Sparkles,
    BellRing, RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ─── Type icons & colours ─────────────────────────────────────────────────────
const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string; dot: string }> = {
    coin: { icon: <Coins className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/25', dot: '#facc15' },
    transfer: { icon: <CreditCard className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', dot: '#34d399' },
    support: { icon: <Headphones className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/25', dot: '#22d3ee' },
    analysis: { icon: <Activity className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25', dot: '#a78bfa' },
    system: { icon: <Info className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25', dot: '#60a5fa' },
};

// ─── Demo notifications injected on first open ────────────────────────────────
const DEMO_NOTIFICATIONS = [
    {
        type: 'support' as const,
        title: 'رد الدعم على طلبك 🎧',
        body: 'مرحباً! تم مراجعة مشكلتك وسيتم حلها خلال 24 ساعة. شكراً لصبرك.',
        detail: 'Ticket #SP-2847 | الأولوية: عالية | الوكيل: أحمد محمود',
    },
    {
        type: 'system' as const,
        title: 'تحديث جديد متاح ✨',
        body: 'تم إطلاق الإصدار 2.5 — يتضمن تحليل الصوت بالذكاء الاصطناعي، وتحسينات على الأداء، وميزات جديدة.',
        detail: 'v2.5.0 · PWA Update · ادخل التطبيق لتطبيق التحديث',
    },
    {
        type: 'coin' as const,
        title: 'حصلت على مكافأة كوينز 💰',
        body: 'تم إضافة 150 كوينز كمكافأة ترحيب. يمكنك استخدامها لفتح تحليلات حصرية.',
        detail: 'الرصيد الجديد: 150 كوينز',
    },
    {
        type: 'transfer' as const,
        title: 'تجديد الاشتراك تلقائياً 💳',
        body: 'تم تجديد اشتراكك الشهري بنجاح. استمتع بوصول غير محدود طوال الشهر القادم.',
        detail: 'الخطة: Premium · التاريخ: Feb 27, 2026',
    },
];

// ─── Time helper ──────────────────────────────────────────────────────────────
const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'الآن';
    if (s < 3600) return `${Math.floor(s / 60)} د`;
    if (s < 86400) return `${Math.floor(s / 3600)} س`;
    return `${Math.floor(s / 86400)} ي`;
};

// ─── Animated bell ring ───────────────────────────────────────────────────────
const BellButton = ({ unread, isOpen, onClick }: { unread: number; isOpen: boolean; onClick: () => void }) => {
    const shouldWiggle = unread > 0 && !isOpen;
    return (
        <motion.button
            id="notification-bell-btn"
            onClick={onClick}
            whileTap={{ scale: 0.88 }}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border
                ${isOpen
                    ? 'bg-white/15 border-white/25 text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                    : 'bg-white/4 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
        >
            {/* Pulse ring when unread */}
            {shouldWiggle && (
                <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/20 pointer-events-none" />
            )}

            <motion.div
                animate={shouldWiggle ? {
                    rotate: [0, -18, 18, -12, 12, -6, 6, 0],
                } : { rotate: 0 }}
                transition={shouldWiggle ? {
                    duration: 0.8,
                    repeat: Infinity,
                    repeatDelay: 3.5,
                    ease: 'easeInOut'
                } : {}}
            >
                {shouldWiggle ? (
                    <BellRing className="w-4 h-4" />
                ) : (
                    <Bell className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'scale-90' : ''}`} />
                )}
            </motion.div>

            {/* Badge */}
            <AnimatePresence>
                {unread > 0 && (
                    <motion.span
                        key="badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1.5 -right-1.5 rtl:right-auto rtl:-left-1.5 min-w-[20px] h-5 bg-gradient-to-br from-red-500 to-rose-600 rounded-full border-2 border-[#02040a] flex items-center justify-center text-[9px] font-black text-white px-1 shadow-[0_0_12px_#ef4444]"
                    >
                        {unread > 9 ? '9+' : unread}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

// ─── Single card ──────────────────────────────────────────────────────────────
const NotifCard = ({
    n, onClear, onNavigate
}: {
    n: { id: string; type: string; title: string; body: string; detail?: string; timestamp: number; read: boolean };
    onClear: () => void;
    onNavigate: () => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const meta = TYPE_META[n.type] ?? TYPE_META.system;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className={`relative group px-4 py-3 transition-colors cursor-pointer rounded-xl mx-2 mb-1
                ${!n.read ? 'bg-white/4' : 'hover:bg-white/3'}`}
            onClick={() => {
                if (n.detail) setExpanded(v => !v);
                onNavigate();
            }}
        >
            {/* Unread stripe */}
            {!n.read && (
                <div
                    className="absolute start-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full"
                    style={{ background: meta.dot, boxShadow: `0 0 8px ${meta.dot}` }}
                />
            )}

            <div className="flex gap-3 items-start">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${meta.bg} ${meta.color}`}>
                    {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-[13px] font-bold leading-snug ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                            {n.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {timeAgo(n.timestamp)}
                            </span>
                            <button
                                onClick={e => { e.stopPropagation(); onClear(); }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-700 hover:text-red-400 transition-all"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>

                    {/* Expandable detail */}
                    <AnimatePresence>
                        {expanded && n.detail && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={`mt-2 px-3 py-2 rounded-lg border text-[10px] font-mono ${meta.bg} ${meta.color} leading-relaxed`}>
                                    {n.detail}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {n.detail && (
                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${meta.color} opacity-60`}>
                            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            {expanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
const NotificationCenter = () => {
    const { notifications, addNotification, markAllRead, clearNotification } = useAppStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleNavigate = (type: string) => {
        setIsOpen(false);
        switch (type) {
            case 'support': navigate('/contact'); break;
            case 'coin': navigate('/profile'); break;
            case 'transfer': navigate('/premium'); break;
            case 'analysis': navigate('/dashboard'); break;
            case 'system': navigate('/dashboard'); break;
            default: navigate('/dashboard'); break;
        }
    };
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [demoLoaded, setDemoLoaded] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;
    const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

    // Close on outside click
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Inject demo notifications the first time panel opens
    const handleOpen = () => {
        if (!isOpen && !demoLoaded && notifications.length === 0) {
            DEMO_NOTIFICATIONS.forEach((n, i) => {
                setTimeout(() => addNotification(n), i * 120);
            });
            setDemoLoaded(true);
        }
        // mark all read after short delay
        if (isOpen) {
            setIsOpen(false);
            return;
        }
        setIsOpen(true);
        setTimeout(() => markAllRead(), 1500);
    };

    // Request browser permission
    useEffect(() => {
        if (isOpen && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [isOpen]);

    // Clear all
    const clearAll = () => {
        notifications.forEach(n => clearNotification(n.id));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <BellButton unread={unreadCount} isOpen={isOpen} onClick={handleOpen} />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        className="absolute right-0 rtl:right-auto rtl:left-0 mt-3 w-[22rem] sm:w-[26rem] bg-[#02040a] border border-white/10 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] z-50 overflow-hidden"
                        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)' }}
                    >
                        {/* ── Header ── */}
                        <div className="px-5 pt-4 pb-3 border-b border-white/6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-sm font-black text-white tracking-wide">الإشعارات</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[9px] font-black bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            {unreadCount} جديد
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {notifications.length > 0 && (
                                        <>
                                            <button
                                                onClick={() => markAllRead()}
                                                className="p-1.5 text-gray-600 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors"
                                                title="تعليم الكل كمقروء"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={clearAll}
                                                className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                                title="مسح الكل"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Filter tabs */}
                            <div className="flex gap-1 bg-white/4 rounded-xl p-1">
                                {(['all', 'unread'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filter === f
                                            ? 'bg-white text-black shadow'
                                            : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {f === 'all' ? 'الكل' : `غير مقروء (${unreadCount})`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Category legend ── */}
                        <div className="flex gap-2 overflow-x-auto px-5 py-2.5 border-b border-white/5 scrollbar-none">
                            {Object.entries(TYPE_META).map(([key, meta]) => (
                                <div key={key} className={`flex-shrink-0 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
                                    {meta.icon}
                                    {key === 'coin' ? 'كوينز' : key === 'transfer' ? 'تحويلات' : key === 'support' ? 'دعم' : key === 'analysis' ? 'تحليل' : 'نظام'}
                                </div>
                            ))}
                        </div>

                        {/* ── List ── */}
                        <div className="max-h-[380px] overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ffffff15 transparent' }}>
                            <AnimatePresence initial={false}>
                                {filtered.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-14 flex flex-col items-center justify-center text-center px-6"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4 relative">
                                            <Bell className="w-7 h-7 text-gray-700" />
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-green-500" />
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-gray-500">كل شيء محدّث ✅</p>
                                        <p className="text-[11px] text-gray-700 mt-1 leading-relaxed">
                                            {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات حتى الآن'}
                                        </p>
                                        <button
                                            onClick={() => {
                                                DEMO_NOTIFICATIONS.forEach((n, i) =>
                                                    setTimeout(() => addNotification(n), i * 150)
                                                );
                                            }}
                                            className="mt-4 flex items-center gap-1.5 text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors font-bold"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            تحميل إشعارات تجريبية
                                        </button>
                                    </motion.div>
                                ) : (
                                    filtered.map(n => (
                                        <NotifCard
                                            key={n.id}
                                            n={n}
                                            onClear={() => clearNotification(n.id)}
                                            onNavigate={() => handleNavigate(n.type)}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── Footer ── */}
                        {notifications.length > 0 && (
                            <div className="px-5 py-3 border-t border-white/5 bg-white/2 flex items-center justify-between">
                                <p className="text-[10px] text-gray-700 font-bold">
                                    {notifications.length} إشعار
                                    {unreadCount > 0 && <span className="text-cyan-600"> · {unreadCount} غير مقروء</span>}
                                </p>
                                <div className="flex items-center gap-3">
                                    <a href="/premium" className="flex items-center gap-1 text-[10px] text-yellow-500 hover:text-yellow-300 transition-colors font-bold">
                                        <Star className="w-3 h-3" />
                                        الاشتراكات
                                    </a>
                                    <a href="/profile" className="flex items-center gap-1 text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors font-bold">
                                        <Zap className="w-3 h-3" />
                                        الكوينز
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
