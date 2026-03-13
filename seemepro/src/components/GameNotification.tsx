import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export const GameNotification: React.FC = () => {
    const { gameToasts, removeGameToast } = useAppStore();

    useEffect(() => {
        if (gameToasts.length > 0) {
            const timer = setTimeout(() => {
                removeGameToast(gameToasts[0].id);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [gameToasts, removeGameToast]);

    const getToastStyles = (type: string) => {
        switch (type) {
            case 'coins_earned': return 'border-yellow-500 border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-500/20 to-black text-yellow-500';
            case 'rank_up': return 'border-cyan-500 border-l-4 border-l-cyan-400 bg-gradient-to-r from-cyan-500/30 to-black text-cyan-400 shadow-[0_0_30px_rgba(0,255,255,0.4)]';
            case 'streak': return 'border-orange-500 border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-500/20 to-black text-orange-400';
            case 'referral': return 'border-green-500 border-l-4 border-l-green-400 bg-gradient-to-r from-green-500/20 to-black text-green-400';
            case 'abcoin': return 'border-purple-500 border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-500/30 to-black text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]';
            case 'attempts_reset': return 'border-blue-500 border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-500/20 to-black text-blue-400';
            default: return 'border-white/20 border-l-4 border-l-gray-400 bg-black/80 text-white';
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {gameToasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`pointer-events-auto backdrop-blur-md rounded-xl p-4 shadow-xl flex items-center gap-4 min-w-[280px] font-bold ${getToastStyles(toast.type)}`}
                    >
                        <span className="text-2xl drop-shadow-md">{toast.icon}</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-wide drop-shadow-sm">{toast.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Hook for custom arbitrary toasts inside components if needed (AppStore currently handles most)
export function useGameNotify() {
    const { addGameToast } = useAppStore();
    return {
        showNotify: (type: Parameters<typeof addGameToast>[0]['type'], message: string, icon: string) => {
            addGameToast({ type, message, icon });
        }
    };
}
