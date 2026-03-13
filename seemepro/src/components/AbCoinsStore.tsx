import React from 'react';
import { useAppStore } from '../store/useAppStore';

interface AbCoinsStoreProps {
    isOpen: boolean;
    onClose: () => void;
}

const PACKAGES = [
    { id: 'starter', abcoins: 10, price: '9.99 ر.س', bonus: 0, popular: false, color: '#00FFD4' },
    { id: 'basic', abcoins: 30, price: '24.99 ر.س', bonus: 5, popular: false, color: '#147EFF' },
    { id: 'popular', abcoins: 75, price: '49.99 ر.س', bonus: 15, popular: true, color: '#FFD60A' },
    { id: 'pro', abcoins: 200, price: '99.99 ر.س', bonus: 50, popular: false, color: '#FF9F0A' },
    { id: 'elite', abcoins: 500, price: '199.99 ر.س', bonus: 150, popular: false, color: '#9B59B6' },
    { id: 'legend', abcoins: 1500, price: '499.99 ر.س', bonus: 500, popular: false, color: '#FF453A' },
];

const AbCoinsStore: React.FC<AbCoinsStoreProps> = ({ isOpen, onClose }) => {
    const { addGameToast } = useAppStore();

    if (!isOpen) return null;

    const handlePurchase = (_pkg: any) => {
        // Placeholder for actual payment gateway
        addGameToast({
            type: 'abcoin',
            message: 'قريباً! الدفع الإلكتروني سيتوفر قريباً 🚀',
            icon: '💳'
        });
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-[#0a0a0c] border border-cyan-500/30 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 text-center relative overflow-hidden bg-gradient-to-r from-black via-cyan-900/20 to-black">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,212,0.1)_0%,transparent_70%)]"></div>
                    <button onClick={onClose} className="absolute left-6 top-6 text-gray-500 hover:text-white transition">✖</button>
                    <h2 className="text-3xl font-black text-white flex items-center justify-center gap-2 relative z-10">
                        💎 شراء AbCoins
                    </h2>
                    <p className="text-gray-400 mt-2 relative z-10">العملة المميزة لـ SeeMePro - استخدمها لإرسال الهدايا وفتح المميزات!</p>
                </div>

                {/* Packages Grid */}
                <div className="flex-1 overflow-y-auto p-6 stylish-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {PACKAGES.map(pkg => (
                            <div
                                key={pkg.id}
                                className="relative p-6 rounded-2xl border cursor-pointer transition-all hover:-translate-y-2"
                                style={{ borderColor: pkg.color + '40', backgroundColor: 'rgba(255,255,255,0.03)' }}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,214,10,0.5)]">
                                        ⭐ الأكثر شعبية
                                    </div>
                                )}
                                <div className="text-center">
                                    <div className="text-4xl font-black mb-1 drop-shadow-lg" style={{ color: pkg.color }}>💎 {pkg.abcoins}</div>
                                    {pkg.bonus > 0 && <div className="text-xs font-bold bg-green-500/20 text-green-400 inline-block px-2 py-0.5 rounded-full mt-1 mb-2">+{pkg.bonus} إضافية مجاناً!</div>}
                                    <div className="text-sm text-gray-500 mt-1 uppercase tracking-widest">AbCoins</div>

                                    <div className="my-4 h-px w-full bg-white/10"></div>

                                    <div className="text-2xl font-bold text-white mb-4">{pkg.price}</div>

                                    <button
                                        className="w-full py-3 rounded-xl font-black text-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                                        style={{ backgroundColor: pkg.color, color: '#000', boxShadow: `0 0 15px ${pkg.color}60` }}
                                        onClick={() => handlePurchase(pkg)}
                                    >
                                        اشترِ الآن
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <p className="text-gray-400 text-sm mb-3">تواجه مشكلة في الشراء؟</p>
                        <a href="mailto:support@seemepro.com" className="inline-flex py-2 px-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm transition transition-all font-bold">
                            تواصل مع الدعم الفني للدفع المباشر
                        </a>
                    </div>
                </div>

            </div>
        </div >
    );
};

export default AbCoinsStore;
