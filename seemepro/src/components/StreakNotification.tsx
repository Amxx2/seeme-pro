import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const StreakNotification: React.FC = () => {
    const { user } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show if streak is > 1 on mount or when streak changes
        if (user.streak > 1) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [user.streak]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
                    dir="rtl"
                >
                    <div className="bg-gradient-to-br from-orange-600/90 to-red-600/90 backdrop-blur-md px-6 py-3 rounded-full border-2 border-orange-400/50 shadow-[0_0_40px_rgba(249,115,22,0.6)] flex items-center gap-4">
                        <div className="relative">
                            <Flame className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)] animate-pulse" />
                            <motion.div
                                className="absolute inset-0 bg-yellow-400 blur-xl opacity-40 rounded-full"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-lg drop-shadow-md leading-tight">
                                🔥 إنت مولع! سلسلة {user.streak} يوم
                            </span>
                            <span className="text-yellow-200 text-xs font-bold w-full text-right tracking-wide">
                                كسبت +{user.streak * 5} 🪙 اليوم!
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
