import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, CheckCircle2, Activity, ArrowRight, Play, Globe2, Sparkles, Zap, ChevronDown, Check, Fingerprint, Eye, BrainCircuit, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import SiteFooter from '../components/SiteFooter';

// Single shared AudioContext — reused across all sounds (Chrome autoplay policy compliant)
let _audioCtx: AudioContext | null = null;
const getCtx = (): AudioContext => {
    if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
};

const playSaberIgnite = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.2);
        osc.connect(filter); filter.connect(gainNode); gainNode.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch (e) { }
};

const playHeavyMechanicalGate = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.8);
        osc.connect(filter); filter.connect(gainNode); gainNode.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
    } catch (e) { }
};

const playKyberCrystalPing = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gainNode); gainNode.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) { }
};

const playAmbientEngineHum = () => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.18);
    } catch (e) { }
};

// === Main Component ===

const Home = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, language, setLanguage } = useAppStore();

    // UI States
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [alias, setAlias] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);

    // Stable particle data - generated once via useMemo so Math.random() isn't called on every render
    const particles = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${(i * 2.04) % 100}%`,
        height: `${40 + (i * 3.7) % 100}px`,
        opacity: 0.1 + (i * 0.009) % 0.5,
        duration: 0.5 + (i * 0.059) % 1.5,
        delay: (i * 0.041) % 2,
    })), []);

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'ar', label: 'العربية' },
        { code: 'fr', label: 'Français' },
    ];

    // Track scroll for header glassmorphism
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const openAuthGateway = (mode: 'login' | 'signup') => {
        setAuthMode(mode);
        setAuthModalOpen(true);
        playHeavyMechanicalGate();
    };

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();

        if (authMode === 'signup' && !agreed) {
            alert(t('accept_treaty_alert', { defaultValue: 'Access Denied: You must accept the Grand Treaty.' }));
            return;
        }

        playSaberIgnite();
        setIsAuthenticating(true);

        setTimeout(() => {
            playKyberCrystalPing();
            login(alias || email.split('@')[0] || 'Jedi_Operative');
            setIsAuthenticating(false);
            setAuthModalOpen(false);
            navigate('/dashboard');
        }, 2000);
    };

    return (
        <div
            onClick={playAmbientEngineHum}
            className="min-h-screen bg-[#02040a] text-white selection:bg-[#fff] selection:text-black font-sans relative"
        >

            {/* === 1. TOP HEADER NAVIGATION === */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#02040a]/80 backdrop-blur-xl border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between">

                    {/* Left: Language & Theme Controls */}
                    <div className="relative">
                        <button
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            onMouseEnter={playKyberCrystalPing}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 backdrop-blur-md"
                        >
                            <Globe2 className="w-4 h-4" />
                            <span className="uppercase font-bold">{language}</span>
                            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Language Dropdown */}
                        <AnimatePresence>
                            {langDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full mt-2 left-0 min-w-[150px] bg-[#0a0c16] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 backdrop-blur-xl"
                                >
                                    <div className="p-2 flex flex-col gap-1">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setLanguage(lang.code as any);
                                                    setLangDropdownOpen(false);
                                                    playKyberCrystalPing();
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

                    {/* Right: Auth Action Gates */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => openAuthGateway('login')}
                            onMouseEnter={playKyberCrystalPing}
                            className="text-sm font-bold text-gray-300 hover:text-white transition-colors px-4 py-2 uppercase tracking-wider relative group"
                        >
                            {t('log_in')}
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                        </button>

                        <button
                            onClick={() => openAuthGateway('signup')}
                            onMouseEnter={playSaberIgnite}
                            className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2"
                        >
                            <Zap className="w-4 h-4" />
                            {t('start_now')}
                        </button>
                    </div>
                </div>
            </header>

            {/* === 2. CENTER PIECE HERO (WEB3 X STAR WARS) === */}
            <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-screen flex flex-col items-center justify-center overflow-hidden">

                {/* Live Background: Space Warp / Data Stream (stable seeds) */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            className="absolute w-[2px] rounded-full bg-cyan-500/80 shadow-[0_0_10px_#00ffff]"
                            style={{
                                left: p.left,
                                top: `-20vh`,
                                height: p.height,
                                opacity: p.opacity,
                            }}
                            animate={{ y: ['0vh', '140vh'] }}
                            transition={{
                                duration: p.duration,
                                repeat: Infinity,
                                ease: 'linear',
                                delay: p.delay,
                            }}
                        />
                    ))}
                </div>

                {/* Imposing Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[1200px] max-h-[1200px] pointer-events-none z-0">
                    {/* Central Glowing Orb (Like a hyperdrive core) */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_50%)] animate-pulse" style={{ animationDuration: '4s' }} />
                    {/* Top spotlight */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                </div>

                {/* Abstract Data Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] pointer-events-none opacity-20 z-0">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 border border-t-white/30 rounded-full" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: 'linear' }} className="absolute inset-10 border border-b-white/20 rounded-full" />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: 'linear' }} className="absolute inset-24 border border-l-white/10 border-dashed rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full">

                    {/* The Monolithic Brand Name */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-8 relative"
                    >
                        {/* Shimmer effect behind text */}
                        <div className="absolute -inset-x-20 inset-y-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-2xl"></div>

                        <h1 className="text-7xl sm:text-8xl lg:text-[12rem] font-black tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-600 drop-shadow-[0_10px_30px_rgba(255,255,255,0.15)] relative z-10">
                            SEEME<span className="text-gray-500">PRO</span>
                        </h1>
                    </motion.div>

                    {/* Epic Manifesto Subtitle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="max-w-3xl mb-12"
                    >
                        <p className="text-xl sm:text-2xl text-gray-400 font-light leading-relaxed tracking-wide">
                            {t('manifesto_subtitle')} <br className="hidden sm:block" />
                            <b className="text-white font-medium">{t('manifesto_desc')}</b>
                        </p>
                    </motion.div>

                    {/* Central Dual Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
                    >
                        {/* The Primary Web3 Style Button */}
                        <button
                            onClick={() => openAuthGateway('signup')}
                            onMouseEnter={playSaberIgnite}
                            className="group relative w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-lg uppercase tracking-widest rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                <Sparkles className="w-5 h-5 text-gray-600 group-hover:text-black transition-colors" />
                                {t('initiate_core')}
                            </span>
                            {/* Saber swipe hover effect */}
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gray-300 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-12 z-0"></div>
                        </button>

                        {/* The Secondary Cinematic Button - opens demo video modal */}
                        <button
                            onClick={() => { setVideoModalOpen(true); playHeavyMechanicalGate(); }}
                            onMouseEnter={playKyberCrystalPing}
                            className="group relative w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/20 text-white font-bold text-lg uppercase tracking-widest rounded-full hover:bg-white/5 hover:border-white transition-all backdrop-blur-md"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <Play className="w-5 h-5 group-hover:text-white text-gray-400 transition-colors" fill="currentColor" />
                                {t('transmit_feed')}
                            </span>
                        </button>
                    </motion.div>
                </div>

                {/* Animated Scroll Indicator guiding to Features */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
                >
                    <span className="text-xs tracking-widest uppercase font-bold">Scroll Details</span>
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                        <ArrowRight className="w-4 h-4 rotate-90" />
                    </motion.div>
                </motion.div>

            </main>

            {/* === 2.5 ANIMATED FEATURES SECTION === */}
            <section className="relative py-32 px-6 border-t border-white/5 bg-[#02040a] overflow-hidden">
                <div className="max-w-[1400px] mx-auto">

                    <div className="text-center mb-20 relative z-10">
                        <span className="text-gray-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block">{t('core_capabilities')}</span>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter">
                            {t('unveil_the_unseen').split(' ').slice(0, 2).join(' ')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">{t('unveil_the_unseen').split(' ').slice(2).join(' ')}</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {/* Feature 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="bg-[#0a0c16] border border-white/5 rounded-3xl p-10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-white/10 transition-colors">
                                <Fingerprint className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">{t('micro_expression_title')}</h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                {t('micro_expression_desc')}
                            </p>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-[#0a0c16] border border-white/5 rounded-3xl p-10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] group relative overflow-hidden"
                        >
                            {/* Inner glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-white/10 transition-colors">
                                    <BrainCircuit className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">{t('neural_voice_title')}</h3>
                                <p className="text-gray-400 leading-relaxed font-light">
                                    {t('neural_voice_desc')}
                                </p>
                            </div>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="bg-[#0a0c16] border border-white/5 rounded-3xl p-10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] group"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-white/10 transition-colors">
                                <Eye className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">{t('pupillary_tracking_title')}</h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                {t('pupillary_tracking_desc')}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* === 2.6 ANIMATED PRICING PLANS === */}
            <section className="relative py-32 px-6 border-t border-white/5 bg-[#02040a] overflow-hidden">
                <div className="max-w-[1400px] mx-auto">

                    <div className="text-center mb-20 relative z-10">
                        <span className="text-gray-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block">{t('access_tiers')}</span>
                        <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter">
                            {t('select_clearance').split(' ').slice(0, 2).join(' ')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">{t('select_clearance').split(' ').slice(2).join(' ')}</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">

                        {/* Standard Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="bg-[#0a0c16] border border-white/10 rounded-3xl p-10 hover:border-white/30 transition-all group relative overflow-hidden"
                        >
                            <div className="mb-8">
                                <h3 className="text-3xl font-black text-white uppercase tracking-wider mb-2">{t('standard_plan')}</h3>
                                <div className="text-gray-400">{t('standard_desc')}</div>
                                <div className="mt-6 flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">$49</span>
                                    <span className="text-gray-500 uppercase tracking-widest text-sm font-bold">/mo</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-10 text-gray-400">
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-gray-500" /> 10 Video Analyses/mo</li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-gray-500" /> Basic Voice Stress Detection</li>
                                <li className="flex items-center gap-3 opacity-50"><Check className="w-5 h-5 text-gray-700" /> Real-time Live Interrogation</li>
                            </ul>

                            <button className="w-full py-4 rounded-xl border-2 border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                                {t('select_plan')}
                            </button>
                        </motion.div>

                        {/* Premium 'Master' Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-white text-black border border-white rounded-3xl p-10 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all group relative overflow-hidden transform md:-translate-y-4"
                        >
                            {/* Pro Badge */}
                            <div className="absolute top-6 right-6 bg-black text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-2">
                                <Star className="w-3 h-3 fill-white" /> Pro
                            </div>

                            <div className="mb-8 relative z-10">
                                <h3 className="text-3xl font-black uppercase tracking-wider mb-2">{t('jedi_master')}</h3>
                                <div className="text-gray-600">{t('master_desc')}</div>
                                <div className="mt-6 flex items-baseline gap-2">
                                    <span className="text-5xl font-black">$149</span>
                                    <span className="text-gray-500 uppercase tracking-widest text-sm font-bold">/mo</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-10 text-gray-800 font-medium relative z-10">
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-black" /> Unlimited Video Analyses</li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-black" /> Deep Neural Voice Stress</li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-black" /> Real-time Live Interrogation</li>
                                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-black" /> Polygraph-level Accuracy</li>
                            </ul>

                            <button className="relative z-10 w-full py-4 rounded-xl bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-xl">
                                {t('ascend_now')}
                            </button>

                            {/* Subtle background glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gray-200 to-transparent opacity-50 pointer-events-none"></div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* === 3. CINEMATIC AUTHENTICATION MODAL (THE GATEWAY) === */}
            <AnimatePresence>
                {authModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        {/* Modal Backdrop / Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAuthModalOpen(false)}
                            className="absolute inset-0 bg-[#02040a]/90 backdrop-blur-xl"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-[#0a0c16] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-[0_0_100px_rgba(255,255,255,0.05)] overflow-hidden group/modal"
                        >
                            {/* Scanning Laser Effect (Biometric View) */}
                            <motion.div
                                animate={{ top: ['-10%', '110%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-50 pointer-events-none"
                            />

                            {/* Monolithic UI Accent */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-white shadow-[0_0_20px_#fff]"></div>

                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                                    <Fingerprint className="w-7 h-7 text-cyan-400 animate-pulse" />
                                    {authMode === 'login' ? t('identity_verification') : t('register_biometrics')}
                                </h2>
                                <button
                                    onClick={() => setAuthModalOpen(false)}
                                    className="relative z-10 text-gray-500 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Biometric Status Notice */}
                            <div className="mb-6 flex items-center justify-between px-4 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">System Status: Awaiting Clearance</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-cyan-400"></div>
                                    <div className="w-1 h-1 rounded-full bg-cyan-400/50"></div>
                                    <div className="w-1 h-1 rounded-full bg-cyan-400/20"></div>
                                </div>
                            </div>

                            {/* Gate Tabs */}
                            <div className="flex bg-white/5 p-1 rounded-2xl mb-10">
                                <button
                                    type="button"
                                    onClick={() => { setAuthMode('login'); playSaberIgnite(); }}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${authMode === 'login' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {t('log_in')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAuthMode('signup'); playSaberIgnite(); }}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${authMode === 'signup' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {t('sign_up')}
                                </button>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-6 relative z-10">

                                {authMode === 'signup' && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block py-1">{t('alias')}</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                required
                                                dir="ltr"
                                                value={alias}
                                                onChange={(e) => setAlias(e.target.value)}
                                                onFocus={playKyberCrystalPing}
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-white focus:bg-white/5 transition-all outline-none"
                                            />
                                            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block py-1">{t('comm_link')}</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={playKyberCrystalPing}
                                            dir="ltr"
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-white focus:bg-white/5 transition-all outline-none font-mono"
                                        />
                                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block py-1">{t('vault_key')}</label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={playKyberCrystalPing}
                                            dir="ltr"
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-white focus:bg-white/5 transition-all outline-none font-mono"
                                        />
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {authMode === 'signup' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="pt-4 overflow-hidden"
                                        >
                                            <label className="flex items-start gap-4 cursor-pointer group bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                                <div className="relative flex items-center justify-center w-6 h-6 mt-0.5 rounded-md border-2 border-gray-500 group-hover:border-white transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={agreed}
                                                        onChange={(e) => { setAgreed(e.target.checked); playKyberCrystalPing(); }}
                                                        className="opacity-0 absolute inset-0 cursor-pointer"
                                                    />
                                                    {agreed && <CheckCircle2 className="w-5 h-5 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm text-gray-300 font-bold block mb-1">{t('accept_treaty')}</span>
                                                    <span className="text-xs text-gray-500 leading-tight block">
                                                        {t('treaty_desc')}
                                                    </span>
                                                </div>
                                            </label>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={isAuthenticating}
                                    onMouseEnter={playSaberIgnite}
                                    className="w-full mt-8 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    {isAuthenticating ? (
                                        <>
                                            <Activity className="w-6 h-6 animate-spin text-cyan-400" />
                                            <span>{t('verifying_protocols')}</span>
                                        </>
                                    ) : (
                                        <>
                                            {authMode === 'login' ? t('authorize_access') : t('begin_initialization')}
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>

                                {/* Forgot Password link — login mode only */}
                                {authMode === 'login' && (
                                    <div className="text-center pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setAuthModalOpen(false); navigate('/forgot-password'); }}
                                            className="text-sm text-gray-500 hover:text-gray-300 transition-colors font-mono underline underline-offset-4"
                                        >
                                            {t('forgot_vault_key')}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >


            {/* ========== VIDEO DEMO MODAL ========== */}
            <AnimatePresence>
                {
                    videoModalOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                                onClick={() => setVideoModalOpen(false)} />
                            <motion.div initial={{ opacity: 0, scale: 0.85, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.85, y: 40 }}
                                className="relative w-full max-w-4xl bg-[#0a0c16] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] z-10">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-[0.3em] font-black">Transmit Feed</p>
                                        <h3 className="text-white font-black text-lg uppercase tracking-tight">SEEMEPRO Feature Overview</h3>
                                    </div>
                                    <button onClick={() => setVideoModalOpen(false)}
                                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white">✕</button>
                                </div>
                                {/* Feature Tour inside the video slot */}
                                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: '🎙️', title: 'Voice Analysis', desc: 'AI reads stress, deception, and emotional state from vocal patterns in real time.', color: 'border-cyan-500/30 bg-cyan-500/5' },
                                        { icon: '🎥', title: 'Video Analysis', desc: 'Deep micro-expression scanning from uploaded footage. Detect every hidden signal.', color: 'border-purple-500/30 bg-purple-500/5' },
                                        { icon: '⚡', title: 'Live Interview', desc: 'Real-time polygraph-level analysis during live video sessions.', color: 'border-yellow-500/30 bg-yellow-500/5' },
                                        { icon: '💀', title: 'Toxic Detector', desc: 'Record your friend — AI scores their toxicity level from 0–100 instantly.', color: 'border-red-500/30 bg-red-500/5' },
                                        { icon: '🍗', title: 'Hunger Scanner', desc: "Detects if your friend is hungry or starving from vocal cues. Surprisingly accurate.", color: 'border-orange-500/30 bg-orange-500/5' },
                                        { icon: '👁️', title: 'AI Chat', desc: 'Chat with the SEEMEPRO deception intelligence core for real-time behavioral advice.', color: 'border-green-500/30 bg-green-500/5' },
                                    ].map(f => (
                                        <div key={f.title} className={`border ${f.color} rounded-2xl p-5 flex items-start gap-4`}>
                                            <span className="text-2xl flex-shrink-0">{f.icon}</span>
                                            <div>
                                                <p className="text-white font-black text-sm uppercase tracking-wide mb-1">{f.title}</p>
                                                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-8 pb-8">
                                    <button onClick={() => { setVideoModalOpen(false); openAuthGateway('signup'); }}
                                        className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors">
                                        ⚡ Start Now — It Is Free
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Site Footer with legal links */}
            <SiteFooter />

        </div >
    );
};

export default Home;
