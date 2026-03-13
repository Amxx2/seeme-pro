import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import {
    Video, Mic, Activity, Coins,
    Menu, X, Globe, Skull, Drumstick, User, LogOut, Zap, ChevronDown, Check, Shield, FileText, Info, Mail, Users, MessageCircle
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingTour from '../components/OnboardingTour';
import NotificationCenter from '../components/NotificationCenter';
import LegalDisclaimerFooter from '../components/LegalDisclaimerFooter';
import SiteFooter from '../components/SiteFooter';
import LiveTicker from '../components/LiveTicker';
import { CoinsWidget } from '../components/CoinsWidget';

// Unique SEEMEPRO eye icon — matches landing page silver gradient identity
const SeemeProEye = ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="eyeGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
        </defs>
        <ellipse cx="18" cy="18" rx="16" ry="9" stroke="url(#eyeGrad)" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="5.5" stroke="url(#eyeGrad)" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="2.5" fill="url(#eyeGrad)" />
        <line x1="18" y1="6" x2="18" y2="4" stroke="url(#eyeGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="32" x2="18" y2="30" stroke="url(#eyeGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="18" x2="2" y2="18" stroke="url(#eyeGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="34" y1="18" x2="32" y2="18" stroke="url(#eyeGrad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const MainLayout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { user, language, setLanguage, logout } = useAppStore();

    const [langDropdownOpen, setLangDropdownOpen] = useState(false);

    const LANGUAGES = [
        { code: 'en', label: 'English' },
        { code: 'ar', label: 'العربية' },
        { code: 'fr', label: 'Français' },
        { code: 'tr', label: 'Türkçe' },
        { code: 'zh', label: '中文' },
    ];

     
    const handleLogout = useCallback(() => {
        logout();
        navigate('/');
    }, [logout, navigate]);

    const menuItems = [
        { path: '/dashboard', label: t('dashboard'), icon: <Activity className="w-5 h-5" /> },
        { path: '/voice', label: t('voice_analysis'), icon: <Mic className="w-5 h-5" /> },
        { path: '/video', label: t('video_analysis'), icon: <Video className="w-5 h-5" /> },
        { path: '/live', label: t('live_interview'), icon: <Activity className="w-5 h-5" /> },
        { path: '/hr', label: t('hr_dashboard', 'HR Dashboard'), icon: <Users className="w-5 h-5" /> },
    ];

    const viralItems = [
        { path: '/toxic', label: t('toxic_detector'), icon: <Skull className="w-5 h-5 text-red-400" />, badge: '🔥 Viral' },
        { path: '/hunger', label: t('hunger_scanner'), icon: <Drumstick className="w-5 h-5 text-orange-400" />, badge: '😄 Fun' },
        { path: '/chat', label: 'المجتمع الحي', icon: <MessageCircle className="w-5 h-5 text-blue-400" />, badge: '💬 Live' },
        { path: '/clans', label: 'الكلانات', icon: <Shield className="w-5 h-5 text-yellow-400" />, badge: '⚔️ Social' },
    ];

    // Stable background particles for the sidebar
    const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: `${(i * 7.3) % 100}%`,
        y: `${(i * 13.1) % 100}%`,
        size: `${1 + (i * 0.3) % 2}px`,
        opacity: 0.05 + (i * 0.02) % 0.15,
    })), []);

    return (
        <>
            <LiveTicker />
            <CoinsWidget />
            <div className="flex h-[100dvh] pt-[max(env(safe-area-inset-top,36px),36px)] bg-transparent overflow-x-hidden text-foreground pb-safe" dir={language === 'ar' ? 'rtl' : 'ltr'}>

                {/* Mobile Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* ===== SIDEBAR ===== */}
                <aside
                    className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col glass-panel border-r-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 
                        ${isSidebarOpen
                            ? 'translate-x-0'
                            : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')}`}
                >
                    {/* Particle background in sidebar */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {particles.map(p => (
                            <div key={p.id} className="absolute rounded-full bg-cyan-400"
                                style={{ left: p.x, top: p.y, width: p.size, height: p.size, opacity: p.opacity }} />
                        ))}
                    </div>

                    {/* Logo */}
                    <div className="flex items-center justify-between h-20 px-6 border-b border-white/5 relative z-10">
                        <Link to="/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <SeemeProEye className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tighter text-white">SEEME<span className="text-gray-500">PRO</span></h1>
                                <p className="text-[9px] text-cyan-500/70 uppercase tracking-[0.2em] font-bold">Truth Has Another Dimension</p>
                            </div>
                        </Link>
                        <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto relative z-10">

                        {/* Core features */}
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.25em] px-3 mb-3">Core Modules</p>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                            ? 'bg-white/8 text-white border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.03)]'
                                            : 'text-gray-500 hover:bg-white/5 hover:text-gray-200 hover:translate-x-1'}`}
                                >
                                    {isActive && (
                                        <div className="absolute start-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-full shadow-[0_0_8px_#00ffff]" />
                                    )}
                                    <span className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Viral features */}
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.25em] px-3 mb-3 mt-6">🔥 Viral Features</p>
                        {viralItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                            ? 'bg-white/8 text-white border border-white/10'
                                            : 'text-gray-500 hover:bg-white/5 hover:text-gray-200 hover:translate-x-1'}`}
                                >
                                    {item.icon}
                                    <span className="font-bold text-sm flex-1">{item.label}</span>
                                    <span className="text-[9px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full font-bold">{item.badge}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Legal Links */}
                    <div className="px-3 pb-4 relative z-10">
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.25em] px-3 mb-3">{t('legal')}</p>
                        <div className="flex flex-col gap-1">
                            {[
                                { path: '/privacy', icon: <Shield className="w-3.5 h-3.5" />, key: 'privacy_policy' },
                                { path: '/terms', icon: <FileText className="w-3.5 h-3.5" />, key: 'terms_of_service' },
                                { path: '/about', icon: <Info className="w-3.5 h-3.5" />, key: 'about_us' },
                                { path: '/contact', icon: <Mail className="w-3.5 h-3.5" />, key: 'contact_us' },
                            ].map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-gray-600 hover:bg-white/5 hover:text-gray-300 transition-colors text-xs font-bold uppercase tracking-wide"
                                >
                                    <span className="text-gray-600">{item.icon}</span>
                                    {t(item.key)}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* User card */}
                    <div className="p-4 border-t border-white/5 relative z-10">
                        {user.isLoggedIn ? (
                            <div className="glass-card rounded-2xl p-3 hover:-translate-y-1 transition-transform duration-300">
                                <Link to="/profile" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 mb-3 group/profile cursor-pointer hover:bg-white/5 p-2 rounded-xl -m-2 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-white/5 border border-cyan-500/20 flex items-center justify-center font-black text-cyan-400 text-sm shadow-[0_0_10px_rgba(0,255,255,0.1)] overflow-hidden transition-transform group-hover/profile:scale-105">
                                        {user.avatar ? (
                                            <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                                        ) : (
                                            user.username?.charAt(0).toUpperCase() ?? '?'
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-black text-sm text-white truncate group-hover/profile:text-cyan-400 transition-colors">{user.username}</p>
                                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                                            <Coins className="w-3 h-3" />
                                            <span>{user.coins}</span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        <User className="w-3 h-3" />
                                        {t('profile')}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-colors text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        <LogOut className="w-3 h-3" />
                                        {t('logout')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link to="/">
                                <div className="w-full py-3 rounded-xl bg-white text-black font-black text-sm uppercase tracking-wider text-center hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                    {t('login')}
                                </div>
                            </Link>
                        )}
                    </div>
                </aside>

                {/* ===== MAIN CONTENT ===== */}
                <div className="flex flex-col flex-1 w-full overflow-hidden">

                    {/* Top Header */}
                    <header className="h-16 flex items-center justify-between px-5 lg:px-8 glass-panel border-b-0 border-r-0 z-30 relative rounded-none">
                        <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Page title (hidden mobile) */}
                        <div className="hidden lg:block">
                            <span className="text-xs text-gray-600 font-black uppercase tracking-[0.3em]">
                                {menuItems.find(m => m.path === location.pathname)?.label ??
                                    viralItems.find(m => m.path === location.pathname)?.label ?? 'SEEMEPRO'}
                            </span>
                        </div>

                        {/* Stats + Actions */}
                        <div className="flex items-center gap-3">
                            {/* Stats bar */}
                            <div className="hidden lg:flex items-center gap-4 bg-white/3 px-5 py-2 rounded-xl border border-white/8">
                                <div className="flex items-center gap-1.5 text-xs">
                                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                                    <span className="text-gray-400 font-bold">{user.credits?.voice ?? 0}</span>
                                    <span className="text-gray-700">{t('voice_analysis').split(' ')[0].toLowerCase()}</span>
                                </div>
                                <div className="w-px h-4 bg-white/10" />
                                <div className="flex items-center gap-1.5 text-xs">
                                    <Video className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-gray-400 font-bold">{user.credits?.video ?? 0}</span>
                                    <span className="text-gray-700">{t('video_analysis').split(' ')[0].toLowerCase()}</span>
                                </div>
                                <div className="w-px h-4 bg-white/10" />
                                <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                                    <Coins className="w-3.5 h-3.5" />
                                    <span className="font-bold">{user.coins}</span>
                                </div>
                            </div>

                            {/* Premium button */}
                            <Link to="/premium">
                                <button className="hidden sm:flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                                    <Zap className="w-3.5 h-3.5" />
                                    {t('ascend')}
                                </button>
                            </Link>

                            {/* Language Dropdown Container */}
                            <div className="relative">
                                <button
                                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                    className="w-9 h-9 sm:w-auto sm:px-3 rounded-xl bg-white/3 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/8 transition-colors text-gray-400 hover:text-white"
                                >
                                    <Globe className="w-4 h-4" />
                                    <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider">{language}</span>
                                    <ChevronDown className={`w-3 h-3 hidden sm:block transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />

                                    {/* Mobile indicator */}
                                    <span className="sm:hidden absolute -top-1 -right-1 bg-white text-black text-[8px] font-black px-1 rounded-md uppercase">
                                        {language}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {langDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 min-w-[150px] bg-[#0a0c16] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 backdrop-blur-xl"
                                        >
                                            <div className="p-2 flex flex-col gap-1">
                                                {LANGUAGES.map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => {
                                                            setLanguage(lang.code);
                                                            setLangDropdownOpen(false);
                                                        }}
                                                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${language === lang.code ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                                    >
                                                        <span>{lang.label}</span>
                                                        {language === lang.code && <Check className="w-3 h-3" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Notifications */}
                            <NotificationCenter />
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent relative pb-24 sm:pb-8">
                        {/* Subtle starfield grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
                        <div className="relative z-10 p-5 lg:p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                >
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                            <LegalDisclaimerFooter />
                            <SiteFooter />
                        </div>
                    </main>
                </div>
            </div>
            <OnboardingTour />
        </>
    );
};

export default MainLayout;
