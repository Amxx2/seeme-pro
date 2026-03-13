import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

const TOUR_KEY = 'seemepro_tour_v1_done';

const STEPS = [
    {
        icon: '👁️',
        title: 'Welcome to SEEMEPRO',
        desc: 'Truth Has Another Dimension. Your AI-powered behavioral intelligence suite. Let us show you around in 30 seconds.',
        color: 'from-white/10 to-white/5',
        accent: 'border-white/20',
    },
    {
        icon: '🎙️',
        title: 'Voice Analysis',
        desc: 'Upload or record any voice. AI detects stress, deception, and emotional state from vocal frequencies. Free users get 3 scans/month.',
        color: 'from-cyan-500/10 to-transparent',
        accent: 'border-cyan-500/30',
    },
    {
        icon: '🎥',
        title: 'Video Analysis',
        desc: 'Upload a video — AI reads micro-expressions, eye movement patterns, and body language signals frame by frame.',
        color: 'from-purple-500/10 to-transparent',
        accent: 'border-purple-500/30',
    },
    {
        icon: '⚡',
        title: 'Live Interview Mode',
        desc: 'Connect a live video session and receive real-time behavioral markers as the conversation happens. Polygraph-level precision.',
        color: 'from-yellow-500/10 to-transparent',
        accent: 'border-yellow-500/30',
    },
    {
        icon: '🔥',
        title: 'Viral Features',
        desc: 'Try the Toxic Friend Detector and Hunger Scanner — record anyone\'s voice and get an instant fun AI verdict. Perfect to share with friends!',
        color: 'from-red-500/10 to-transparent',
        accent: 'border-red-500/30',
    },
    {
        icon: '⭐',
        title: 'Earn Free Scans',
        desc: 'Watch 5 ads → earn 1 free video scan. Monthly resets give you +3 free voice scans. Track progress in your Profile.',
        color: 'from-green-500/10 to-transparent',
        accent: 'border-green-500/30',
    },
];

const OnboardingTour = () => {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const done = localStorage.getItem(TOUR_KEY);
        if (!done) {
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const close = () => {
        localStorage.setItem(TOUR_KEY, '1');
        setVisible(false);
    };

    const next = () => {
        if (step < STEPS.length - 1) setStep(s => s + 1);
        else close();
    };

    const prev = () => step > 0 && setStep(s => s - 1);

    const current = STEPS[step];

    return (
        <AnimatePresence>
            {visible && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={close} />

                    {/* Card */}
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                        className={`relative w-full max-w-md bg-gradient-to-br ${current.color} bg-[#0a0c16] border ${current.accent} rounded-3xl p-8 z-10 overflow-hidden`}
                    >
                        {/* Close */}
                        <button onClick={close} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400">
                            <X className="w-4 h-4" />
                        </button>

                        {/* Step indicator */}
                        <div className="flex gap-1.5 mb-6">
                            {STEPS.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'bg-white flex-1' : i < step ? 'bg-white/40 flex-1' : 'bg-white/10 flex-1'}`} />
                            ))}
                        </div>

                        {/* Icon */}
                        <div className="text-5xl mb-6">{current.icon}</div>

                        {/* Content */}
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">{current.title}</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">{current.desc}</p>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <button onClick={prev} disabled={step === 0}
                                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold disabled:opacity-0">
                                <ArrowLeft className="w-4 h-4" />Back
                            </button>

                            <span className="text-xs text-gray-600 font-mono">{step + 1} / {STEPS.length}</span>

                            <button onClick={next}
                                className="flex items-center gap-2 bg-white text-black font-black text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
                                {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Skip */}
                        {step < STEPS.length - 1 && (
                            <button onClick={close} className="w-full mt-4 text-center text-xs text-gray-600 hover:text-gray-400 transition-colors">
                                Skip tour
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default OnboardingTour;
