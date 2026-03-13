import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAppStore } from '../store/useAppStore';
import GiftStoreModal from '../components/GiftStoreModal';
import { Users, Search, Trophy, Compass, Plus, LogOut, ArrowLeft, Loader, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['🏆', '🔥', '⚡', '💎', '🚀', '👑', '🦁', '🐺', '🦅', '🐉', '⚔️', '🛡️', '💀', '👻', '👽', '🤖', '🌟', '💰', '🎯', '🎲'];

const getRankIcon = (coins: number) => {
    if (coins >= 1000) return '👑';
    if (coins >= 400) return '💎';
    if (coins >= 150) return '🥇';
    if (coins >= 50) return '🥈';
    return '🥉';
};

const getRankTitle = (coins: number) => {
    if (coins >= 1000) return 'إمبراطور';
    if (coins >= 400) return 'أسطورة';
    if (coins >= 150) return 'نخبة';
    if (coins >= 50) return 'مساهم';
    return 'عضو جديد';
};

export default function ClanSystem() {
    const { user, addGameToast } = useAppStore();
    const [activeTab, setActiveTab] = useState<'my_clan' | 'discover' | 'leaderboard'>('my_clan');

    // User Clan State
    const [clan, setClan] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Clan State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClanName, setNewClanName] = useState('');
    const [newClanDesc, setNewClanDesc] = useState('');
    const [newClanEmoji, setNewClanEmoji] = useState('🏆');
    const [isPrivate, setIsPrivate] = useState(true);

    // Gift Modal State
    const [giftModal, setGiftModal] = useState<{ isOpen: boolean, targetMember: any }>({ isOpen: false, targetMember: null });

    // Chat State
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        fetchMyClan();
    }, []);

    const fetchMyClan = async () => {
        setLoading(true);
        try {
            // Find if user is in any clan
            // Wait, we need user.id which is missing in simple auth if we use fake auth...
            // Let's assume we lookup by username for this demo if user.id is not bound directly yet
            // To make it robust without strict rls, let's just query member by display_name or assume user.email is unique ID
            const userId = user.email || 'guest';

            const { data: memberData } = await supabase.from('clan_members').select('clan_id').eq('user_id', userId).single();
            if (memberData && memberData.clan_id) {
                // Fetch clan details
                const { data: clanData } = await supabase.from('clans').select('*').eq('id', memberData.clan_id).single();
                setClan(clanData);

                // Fetch members
                const { data: mems } = await supabase.from('clan_members').select('*').eq('clan_id', memberData.clan_id).order('coins_contributed', { ascending: false });
                setMembers(mems || []);

                // Fetch chat history
                const { data: msgs } = await supabase.from('clan_messages').select('*').eq('clan_id', memberData.clan_id).order('created_at', { ascending: true }).limit(50);
                setMessages(msgs || []);
            } else {
                setClan(null);
            }
        } catch (e) {
            console.error("Failed to fetch clan", e);
        } finally {
            setLoading(false);
        }
    };

    // Chat Realtime Subscription
    useEffect(() => {
        if (!clan) return;
        const channel = supabase.channel(`clan-chat-${clan.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clan_messages', filter: `clan_id=eq.${clan.id}` },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as any]);
                    // Rank up check logic for current user receiving gift
                    if (payload.new.message_type === 'gift' && payload.new.gift_data) {
                        fetchMyClan(); // simplest way to update member coins & rank visually
                    }
                    setTimeout(() => {
                        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [clan]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleCreateClan = async () => {
        if (!newClanName.trim()) return;
        const userId = user.email || 'guest';

        try {
            // Create Clan
            const { data: insertedClan, error: clanErr } = await supabase.from('clans').insert({
                name: newClanName,
                description: newClanDesc,
                owner_id: null, // Bypassing strict RLS for demo without full auth ID
                avatar_emoji: newClanEmoji,
                is_private: isPrivate
            }).select().single();

            if (clanErr) throw clanErr;

            // Add self as owner/member
            await supabase.from('clan_members').insert({
                clan_id: insertedClan.id,
                user_id: userId,
                display_name: user.username || 'User',
                rank_title: 'قائد',
                coins_contributed: 0
            });

            // Ticker announcement
            await supabase.from('ticker_events').insert({
                event_type: 'clan_created',
                display_text: `${user.username || 'User'} أنشأ كلان جديد: ${newClanEmoji} ${newClanName}!`,
                emoji: '🎌',
                color: '#FFD60A',
                user_name: user.username || 'User'
            });

            addGameToast({ type: 'rank_up', message: 'تم إنشاء الكلان بنجاح!', icon: '🎌' });
            setShowCreateModal(false);
            fetchMyClan();
        } catch (e) {
            console.error(e);
            addGameToast({ type: 'abcoin', message: 'حدث خطأ في إنشاء الكلان', icon: '⚠️' });
        }
    };

    const sendMessage = async () => {
        if (!chatInput.trim() || !clan) return;
        const temp = chatInput;
        setChatInput('');
        const userId = user.email || 'guest';
        const myMemberStatus = members.find(m => m.user_id === userId);
        const myCoins = myMemberStatus?.coins_contributed || 0;

        await supabase.from('clan_messages').insert({
            clan_id: clan.id,
            user_id: userId,
            display_name: user.username || 'User',
            message: temp.trim(),
            message_type: 'text',
            rank_icon: getRankIcon(myCoins)
        });
    };

    const formatTime = (ts: string) => {
        return new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    // --- Sub-components ---
    const GiftMessage = ({ gift, senderName: _senderName }: { gift: any, senderName: string }) => (
        <div className="flex items-center gap-3 p-3 rounded-xl border mt-1 shadow-sm" style={{ borderColor: gift.color + '40', backgroundColor: gift.color + '10' }}>
            <span className={`text-4xl ${gift.animation || 'animate-bounce'}`}>{gift.giftEmoji}</span>
            <div>
                <div className="font-bold text-sm" style={{ color: gift.color }}>{gift.giftName}</div>
                <div className="text-xs text-gray-400">+{gift.coins_given} 🪙 للمستلم</div>
            </div>
            {gift.rarity === 'legendary' && (
                <div className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold ml-auto shimmer uppercase tracking-widest">✨ Legendary</div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn" dir="rtl">

            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0a0a0c] p-4 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] gap-4">
                <div className="flex items-center gap-2 text-white font-black text-xl tracking-tighter">
                    <Swords className="w-6 h-6 text-cyan-400" /> CLANS <span className="text-sm font-normal text-gray-500 tracking-widest uppercase">Social Hub</span>
                </div>
                <div className="flex bg-black p-1 rounded-xl border border-white/5">
                    {[
                        { id: 'my_clan', label: 'كلاني', icon: <Users className="w-4 h-4" /> },
                        { id: 'discover', label: 'اكتشف', icon: <Compass className="w-4 h-4" /> },
                        { id: 'leaderboard', label: 'المتصدرون', icon: <Trophy className="w-4 h-4" /> }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === tab.id ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,255,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-cyan-500"><Loader className="w-8 h-8 animate-spin" /></div>
            ) : (
                <div className="min-h-[500px]">

                    {/* MY CLAN TAB */}
                    {activeTab === 'my_clan' && (
                        !clan ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-[#0a0a0c] border border-white/10 rounded-3xl text-center px-4">
                                <Swords className="w-20 h-20 text-gray-700 mb-6" />
                                <h3 className="text-2xl font-black text-white mb-2">لست منضماً لأي كلان!</h3>
                                <p className="text-gray-400 mb-8 max-w-sm">انضم لكلان للتنافس، وتلقي الهدايا، والحصول على ترتيب عالمي.</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 transition hover:-translate-y-1">
                                        <Plus className="w-5 h-5" /> أنشئ كلان جديد
                                    </button>
                                    <button onClick={() => setActiveTab('discover')} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-white transition flex items-center gap-2">
                                        <Search className="w-5 h-5" /> ابحث عن كلان
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Side: Chat */}
                                <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                                        <span className="text-2xl">{clan.avatar_emoji}</span>
                                        <div>
                                            <h2 className="font-black text-white text-lg">{clan.name}</h2>
                                            <div className="text-xs text-green-400 flex items-center gap-1">🟢 {members.length} متصلين</div>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 stylish-scrollbar bg-black/50">
                                        {messages.map((msg: any) => (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className="flex items-start gap-3">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-inner">
                                                    {msg.rank_icon || '🥉'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-sm font-bold text-cyan-50">{msg.display_name}</span>
                                                        <span className="text-[10px] text-gray-600 font-mono">{formatTime(msg.created_at)}</span>
                                                    </div>

                                                    {msg.message_type === 'text' && (
                                                        <div className="inline-block text-sm text-gray-200 bg-white/10 border border-white/5 rounded-2xl rounded-tr-sm px-4 py-2 leading-relaxed">
                                                            {msg.message}
                                                        </div>
                                                    )}

                                                    {msg.message_type === 'gift' && msg.gift_data && (
                                                        <GiftMessage gift={msg.gift_data} senderName={msg.display_name} />
                                                    )}

                                                    {msg.message_type === 'system' && (
                                                        <div className="text-xs text-yellow-500/80 italic font-bold bg-yellow-500/10 inline-block px-3 py-1 rounded-lg">
                                                            ⚠️ {msg.message}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Input bar */}
                                    <div className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-2">
                                        <input
                                            value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                            placeholder="تحدث مع أعضاء الكلان..."
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        />
                                        <button onClick={sendMessage} disabled={!chatInput.trim()} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors shadow-[0_0_10px_rgba(0,255,212,0.2)]">
                                            إرسال
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Info & Members */}
                                <div className="space-y-6">
                                    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-lg">
                                                    {clan.avatar_emoji}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-white">{clan.name}</h2>
                                                    <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">ID: {clan.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">{clan.description}</p>

                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                                                    <div className="text-xs text-gray-500 mb-1">الأعضاء</div>
                                                    <div className="font-bold text-white text-lg">{members.length} <span className="text-sm text-gray-500">/ {clan.max_members}</span></div>
                                                </div>
                                                <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                                                    <div className="text-xs text-gray-500 mb-1">قوة الكلان</div>
                                                    <div className="font-bold text-yellow-400 text-lg flex justify-center items-center gap-1"><Trophy className="w-4 h-4" /> {members.reduce((acc, m) => acc + m.coins_contributed, 0)}</div>
                                                </div>
                                            </div>

                                            <button className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold text-gray-300 transition-colors flex items-center justify-center gap-2 mb-2">
                                                📤 دعوة صديق
                                            </button>
                                            <button onClick={() => { setClan(null); addGameToast({ type: 'abcoin', message: 'غادرت الكلان', icon: '🚪' }) }} className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                                <LogOut className="w-4 h-4" /> مغادرة الكلان
                                            </button>
                                        </div>
                                    </div>

                                    {/* Members List */}
                                    <div className="glass-card rounded-3xl p-5 max-h-[400px] overflow-y-auto stylish-scrollbar">
                                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> أعضاء الكلان</h3>
                                        <div className="space-y-2">
                                            {members.map(m => (
                                                <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border border-white/5 transition-colors ${m.user_id === (user.email || 'guest') ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-black/30 hover:bg-white/5'}`}>
                                                    <span className="text-2xl drop-shadow-md" title={m.rank_title}>{getRankIcon(m.coins_contributed)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-white truncate">{m.display_name} {m.user_id === (user.email || 'guest') && <span className="text-[10px] text-cyan-400 font-normal ml-1">(أنت)</span>}</div>
                                                        <div className="text-[10px] text-gray-500">{getRankTitle(m.coins_contributed)}</div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-xs text-yellow-400 font-bold mb-1">🪙 {m.coins_contributed}</div>
                                                        {m.user_id !== (user.email || 'guest') && (
                                                            <button onClick={() => setGiftModal({ isOpen: true, targetMember: m })} className="text-[10px] bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 rounded-lg hover:from-pink-500/40 hover:to-purple-500/40 transition-colors uppercase font-bold tracking-widest">
                                                                أهدِ 🎁
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* DISCOVER & LEADERBOARD Placeholders */}
                    {(activeTab === 'discover' || activeTab === 'leaderboard') && (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <Compass className={`w-16 h-16 mb-4 text-cyan-500 ${activeTab === 'discover' ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                            <h2 className="text-2xl font-black text-white mb-2">قريباً جداً! 🚀</h2>
                            <p className="text-gray-400">يجري تطوير قسم {activeTab === 'discover' ? 'استكشاف الكلانات العامة' : 'اللوحة العالمية للمتصدرين'}.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Clan Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0c] border border-cyan-500/30 w-full max-w-md p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-white">⚔️ أنشئ كلان جديد</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">اسم الكلان</label>
                                    <input value={newClanName} onChange={e => setNewClanName(e.target.value)} maxLength={20} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none" placeholder="الأسود الكاسرة..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">الوصف</label>
                                    <textarea value={newClanDesc} onChange={e => setNewClanDesc(e.target.value)} maxLength={100} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none resize-none h-20" placeholder="كلان مهتم بتحليل الأكاذيب..." />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">رمز الكلان (شعار)</label>
                                    <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-2 bg-black/30 rounded-xl border border-white/5">
                                        {EMOJIS.map(em => (
                                            <button key={em} onClick={() => setNewClanEmoji(em)} className={`text-2xl p-2 rounded-lg transition-transform hover:scale-125 ${newClanEmoji === em ? 'bg-cyan-500/20 border border-cyan-500 shadow-[inset_0_0_10px_rgba(0,255,212,0.3)]' : 'border border-transparent'}`}>
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10" onClick={() => setIsPrivate(!isPrivate)}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPrivate ? 'bg-cyan-500 border-cyan-400' : 'border-gray-500'}`}>
                                        {isPrivate && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">دعوة خاصة فقط</div>
                                        <div className="text-[10px] text-gray-400">الكلان لن يظهر في قائمة الاستكشاف للعامة.</div>
                                    </div>
                                </div>

                                <button onClick={handleCreateClan} disabled={!newClanName.trim()} className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-black disabled:opacity-50 font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                                    🚀 إطلاق الكلان
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Gift Store Modal */}
            {clan && giftModal.isOpen && giftModal.targetMember && (
                <GiftStoreModal
                    isOpen={giftModal.isOpen}
                    onClose={() => setGiftModal({ isOpen: false, targetMember: null })}
                    receiverId={giftModal.targetMember.user_id}
                    receiverName={giftModal.targetMember.display_name}
                    clanId={clan.id}
                    senderId={user.email || 'guest'}
                    senderName={user.username || 'User'}
                    senderRankIcon={getRankIcon(members.find(m => m.user_id === (user.email || 'guest'))?.coins_contributed || 0)}
                />
            )}
        </div>
    );
}
