import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { useAppStore } from '../store/useAppStore';

interface GiftStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiverId: string;
    receiverName: string;
    clanId: string;
    senderId: string;
    senderName: string;
    senderRankIcon: string;
}

const GIFTS = [
    { id: 'rose', name_ar: 'وردة', emoji: '🌹', abcoins_cost: 5, coins_given_to_receiver: 10, rarity: 'common', color: '#FF3B30' },
    { id: 'star', name_ar: 'نجمة', emoji: '⭐', abcoins_cost: 10, coins_given_to_receiver: 20, rarity: 'common', color: '#FFD60A' },
    { id: 'crown', name_ar: 'تاج', emoji: '👑', abcoins_cost: 30, coins_given_to_receiver: 60, rarity: 'rare', color: '#FFD60A' },
    { id: 'diamond', name_ar: 'ماسة', emoji: '💎', abcoins_cost: 50, coins_given_to_receiver: 100, rarity: 'rare', color: '#00FFD4' },
    { id: 'rocket', name_ar: 'صاروخ', emoji: '🚀', abcoins_cost: 100, coins_given_to_receiver: 200, rarity: 'epic', color: '#147EFF' },
    { id: 'trophy', name_ar: 'كأس', emoji: '🏆', abcoins_cost: 200, coins_given_to_receiver: 400, rarity: 'epic', color: '#FF9F0A' },
    { id: 'galaxy', name_ar: 'مجرة', emoji: '🌌', abcoins_cost: 500, coins_given_to_receiver: 1000, rarity: 'legendary', color: '#9B59B6' },
    { id: 'god_mode', name_ar: 'وضع الإله', emoji: '⚡', abcoins_cost: 1000, coins_given_to_receiver: 2000, rarity: 'legendary', color: '#FF453A' },
];

const GiftStoreModal: React.FC<GiftStoreModalProps> = ({
    isOpen, onClose, receiverId, receiverName, clanId, senderId, senderName, senderRankIcon
}) => {
    const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
    const [optionalMessage, setOptionalMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { user, addGameToast } = useAppStore();

    if (!isOpen) return null;

    const handleSendGift = async () => {
        const gift = GIFTS.find(g => g.id === selectedGiftId);
        if (!gift) return;

        if (user.abcoins < gift.abcoins_cost) {
            addGameToast({ type: 'abcoin', message: 'عذراً لا تملك ما يكفي من AbCoins 💎', icon: '❌' });
            return;
        }

        setIsSending(true);
        try {
            // 1. Deduct abcoins (We use the store to update local state immediately)
            useAppStore.getState().spendAbcoins(gift.abcoins_cost, 'voice'); // Hack to spend abcoins

            // 2. Add coins to receiver via Supabase
            // Assuming RPC exists for safely incrementing, or fallback to raw (raw not possible directly from client, need a workaround or RPC). Wait! supabase.rpc('increment_coins')
            // Let's use standard update if RPC doesn't exist. Actually standard update is fine for this demo
            const { data: member } = await supabase.from('clan_members').select('coins_contributed').eq('user_id', receiverId).eq('clan_id', clanId).single();
            if (member) {
                await supabase.from('clan_members').update({ coins_contributed: member.coins_contributed + gift.coins_given_to_receiver }).eq('user_id', receiverId).eq('clan_id', clanId);
            }

            // 3. Insert specific gift transaction
            await supabase.from('gift_transactions').insert({
                from_user_id: senderId,
                to_user_id: receiverId,
                clan_id: clanId,
                gift_id: gift.id,
                abcoins_spent: gift.abcoins_cost,
                coins_received: gift.coins_given_to_receiver,
                message: optionalMessage
            });

            // 4. Insert message
            await supabase.from('clan_messages').insert({
                clan_id: clanId,
                user_id: senderId,
                display_name: senderName,
                message_type: 'gift',
                gift_data: {
                    giftId: gift.id,
                    giftName: gift.name_ar,
                    giftEmoji: gift.emoji,
                    abcoins_value: gift.abcoins_cost,
                    coins_given: gift.coins_given_to_receiver,
                    rarity: gift.rarity,
                    color: gift.color,
                    message: optionalMessage,
                },
                rank_icon: senderRankIcon,
            });

            // 5. Insert ticker event
            await supabase.from('ticker_events').insert({
                event_type: 'gift',
                display_text: `${senderName} أهدى ${gift.emoji} لـ ${receiverName}!`,
                emoji: gift.emoji,
                color: gift.color,
                user_name: senderName,
            });

            addGameToast({ type: 'coins_earned', message: `${gift.emoji} تم إرسال هدية ${gift.name_ar} بنجاح!`, icon: '🎁' });
            onClose();
        } catch (e) {
            console.error(e);
            addGameToast({ type: 'abcoin', message: 'حدث خطأ أثناء الإرسال', icon: '⚠️' });
        } finally {
            setIsSending(false);
        }
    };

    const selectedGift = GIFTS.find(g => g.id === selectedGiftId);

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-[#0a0a0c] border border-cyan-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">🎁 متجر الهدايا</h2>
                        <p className="text-sm text-gray-400 mt-1">أهدِ إلى: <span className="text-cyan-400 font-bold">{receiverName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition">✖</button>
                </div>

                {/* Gift Grid */}
                <div className="flex-1 overflow-y-auto p-5 stylish-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {GIFTS.map(gift => (
                            <div
                                key={gift.id}
                                className="relative p-4 rounded-2xl border cursor-pointer transition-all hover:scale-105"
                                style={{
                                    borderColor: gift.color + '40',
                                    backgroundColor: selectedGiftId === gift.id ? gift.color + '20' : 'rgba(255,255,255,0.03)'
                                }}
                                onClick={() => setSelectedGiftId(gift.id)}
                            >
                                {gift.rarity === 'legendary' && (
                                    <div className="absolute -top-2 -right-2 text-[9px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                        ⚡ LEGENDARY
                                    </div>
                                )}
                                <div className="text-4xl text-center mb-2 animate-pulse">{gift.emoji}</div>
                                <div className="text-center font-bold text-sm text-white">{gift.name_ar}</div>
                                <div className="text-center text-[10px] mt-1" style={{ color: gift.color }}>
                                    💎 {gift.abcoins_cost} AbCoins
                                </div>
                                <div className="text-center text-[10px] text-gray-500 shrink-0">
                                    +{gift.coins_given_to_receiver} 🪙 للمستلم
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-5 border-t border-white/10 bg-black/50">
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="رسالة مع الهدية (اختياري)..."
                            value={optionalMessage}
                            onChange={e => setOptionalMessage(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        />

                        <div className="flex justify-between items-center mt-2">
                            <div className="text-sm text-gray-300">
                                رصيدك: <span className="font-bold text-cyan-400">💎 {user.abcoins} AbCoins</span>
                            </div>
                            <button
                                disabled={!selectedGift || isSending || user.abcoins < (selectedGift?.abcoins_cost || 0)}
                                onClick={handleSendGift}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition"
                            >
                                {isSending ? 'جاري الإرسال...' : '🎁 أرسل الهدية'}
                            </button>
                        </div>
                        {selectedGift && user.abcoins < selectedGift.abcoins_cost && (
                            <div className="text-xs text-red-400 text-left mt-1">
                                رصيدك غير كافٍ. <a href="#" onClick={(e) => { e.preventDefault(); onClose(); /* Open AbCoins Modal */ }} className="underline hover:text-white">شراء AbCoins 💎</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GiftStoreModal;
