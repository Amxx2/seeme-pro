import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Zap, Star, Share } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Detects iOS (iPhone/iPad)
const isIos = () => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
// Detects if running in standalone mode (already installed)
const isInStandaloneMode = () =>
    ('standalone' in window.navigator && (window.navigator as any).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches;

let deferredPrompt: any = null;

const PwaInstallBanner = () => {
    const { t } = useTranslation();
    const [show, setShow] = useState(false);
    const [ios, setIos] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Don't show if already installed or user dismissed before
        if (isInStandaloneMode()) return;
        if (sessionStorage.getItem('pwa-banner-dismissed')) return;

        const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
        if (!isMobile) return;

        const iosDevice = isIos();
        setIos(iosDevice);

        if (iosDevice) {
            // iOS: always show banner (no install prompt API)
            setTimeout(() => setShow(true), 2500);
        } else {
            // Android/Chrome: listen for the browser's install prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                setTimeout(() => setShow(true), 2500);
            });
        }
    }, []);

    const handleInstall = async () => {
        if (ios) {
            setShowIosGuide(true);
            return;
        }
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShow(false);
        }
        deferredPrompt = null;
    };

    const handleDismiss = () => {
        setShow(false);
        setDismissed(true);
        sessionStorage.setItem('pwa-banner-dismissed', '1');
    };

    if (dismissed) return null;

    return (
        <>
            {/* ===== INSTALL BANNER ===== */}
            <AnimatePresence>
                {show && !showIosGuide && (
                    <motion.div
                        initial={{ y: 120, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 120, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        className="fixed bottom-0 left-0 right-0 z-[200] px-4 pb-4 sm:px-6"
                    >
                        <div className="relative bg-[#0a0c16] border border-white/15 rounded-3xl p-5 shadow-[0_-4px_60px_rgba(0,255,255,0.08)] overflow-hidden">

                            {/* Cyan top accent line */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_8px_#00ffff]" />

                            {/* Dismiss button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-start gap-4">
                                {/* App Icon */}
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
                                    <Smartphone className="w-7 h-7 text-cyan-400" />
                                </div>

                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-[0.2em] mb-0.5">{t('install_free', { defaultValue: 'Install Free' })}</p>
                                    <h3 className="text-white font-black text-lg leading-tight">{t('app_name')}</h3>
                                    <p className="text-gray-400 text-sm mt-1 leading-snug">
                                        {t('pwa_desc', { defaultValue: 'Faster access. Offline mode. +10 bonus analyses when you install.' })}
                                    </p>

                                    {/* Benefit chips */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {[
                                            { icon: Zap, label: t('instant_launch', { defaultValue: 'Instant Launch' }) },
                                            { icon: Star, label: t('bonus_analyses', { defaultValue: '+10 Analyses' }) },
                                        ].map(({ icon: Icon, label }) => (
                                            <span key={label} className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-gray-300">
                                                <Icon className="w-3 h-3 text-cyan-400" />
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Install CTA */}
                            <button
                                onClick={handleInstall}
                                className="mt-4 w-full py-3.5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {ios ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                {ios ? t('add_home_screen', { defaultValue: 'Add to Home Screen' }) : t('install_app_free', { defaultValue: 'Install App — Free' })}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== iOS MANUAL GUIDE (bottom sheet) ===== */}
            <AnimatePresence>
                {showIosGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-end"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => { setShowIosGuide(false); setShow(false); }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full bg-[#0a0c16] border-t border-white/10 rounded-t-3xl p-8 z-10"
                        >
                            {/* Handle bar */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20" />

                            <h3 className="text-white font-black text-xl uppercase tracking-wide text-center mb-2 mt-2">
                                {t('add_home_screen', { defaultValue: 'Add to Home Screen' })}
                            </h3>
                            <p className="text-gray-400 text-center text-sm mb-8">{t('ios_guide_desc', { defaultValue: 'Follow these 3 steps to install SEEMEPRO on your iPhone:' })}</p>

                            <div className="space-y-5">
                                {[
                                    { step: '1', text: t('ios_step_1', { defaultValue: 'Tap the Share button' }), sub: t('ios_step_1_sub', { defaultValue: 'The box with an arrow pointing up at the bottom of Safari' }) },
                                    { step: '2', text: t('ios_step_2', { defaultValue: 'Scroll down and tap "Add to Home Screen"' }), sub: t('ios_step_2_sub', { defaultValue: 'Look for the icon with a plus (+) sign' }) },
                                    { step: '3', text: t('ios_step_3', { defaultValue: 'Tap "Add" in the top right' }), sub: t('ios_step_3_sub', { defaultValue: 'The app will appear on your home screen instantly' }) },
                                ].map(({ step, text, sub }) => (
                                    <div key={step} className="flex items-start gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center flex-shrink-0">
                                            {step}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{text}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => { setShowIosGuide(false); setShow(false); }}
                                className="mt-8 w-full py-4 rounded-2xl border-2 border-white/20 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/5 transition-colors"
                            >
                                {t('got_it', { defaultValue: 'Got It' })}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PwaInstallBanner;
