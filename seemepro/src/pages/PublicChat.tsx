import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Shield, MessageCircle, ArrowLeft, Hash, CheckCircle2 } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAppStore } from '../store/useAppStore';

interface Message {
    id: string;
    user_id: string;
    display_name: string;
    content: string;
    room?: string;
    dm_room?: string;
    rank_icon?: string;
    created_at: string;
}

const ROOMS = [
    { id: 'general', name: 'الاستراحة العامة', icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'vip', name: 'مجلس كبار الشخصيات', icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'help', name: 'المساعدة والدعم', icon: Users, color: 'text-green-400', bg: 'bg-green-400/10' }
];

export default function PublicChat() {
    const userData = useAppStore(state => state.user);
    const getRank = useAppStore(state => state.getRank);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeRoom, setActiveRoom] = useState('general');
    const [activeDM, setActiveDM] = useState<string | null>(null);
    const [activeDMName, setActiveDMName] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => { scrollToBottom() }, [messages]);

    useEffect(() => {
        fetchMessages();

        // Subscribe to Public Messages
        const publicSub = supabase
            .channel('public_room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_messages', filter: `room=eq.${activeRoom}` }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .subscribe();

        // Subscribe to DMs if active
        let dmSub: any;
        if (activeDM) {
            dmSub = supabase
                .channel('dm_room')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `dm_room=eq.${activeDM}` }, (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                })
                .subscribe();
        }

        // Presence
        const roomOne = supabase.channel('online_users', {
            config: { presence: { key: userData?.username || 'ضيف' } },
        });

        roomOne
            .on('presence', { event: 'sync' }, () => {
                const state = roomOne.presenceState();
                const users = Object.keys(state).map(key => state[key][0]);
                setOnlineUsers(users);
                setIsConnected(true);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await roomOne.track({
                        user_id: userData?.username || 'anonymous',
                        display_name: userData?.username || 'ضيف',
                        rank_icon: getRank().icon || '🥉',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(publicSub);
            if (dmSub) supabase.removeChannel(dmSub);
            supabase.removeChannel(roomOne);
        };
    }, [activeRoom, activeDM]);

    const fetchMessages = async () => {
        if (activeDM) {
            const { data } = await supabase
                .from('direct_messages')
                .select('*')
                .eq('dm_room', activeDM)
                .order('created_at', { ascending: true })
                .limit(50);
            if (data) setMessages(data);
        } else {
            const { data } = await supabase
                .from('public_messages')
                .select('*')
                .eq('room', activeRoom)
                .order('created_at', { ascending: true })
                .limit(50);
            if (data) setMessages(data);
        }
    };

    const generateDMRoomId = (user1: string, user2: string) => {
        return [user1, user2].sort().join('_');
    };

    const startDM = (targetUserId: string, targetName: string) => {
        if (!userData?.username || targetUserId === userData.username) return;
        const dmId = generateDMRoomId(userData.username, targetUserId);
        setActiveDM(dmId);
        setActiveDMName(targetName);
        setActiveRoom('');
    };

    const exitDM = () => {
        setActiveDM(null);
        setActiveDMName(null);
        setActiveRoom('general');
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userData) return;

        const msgContent = newMessage;
        setNewMessage('');

        if (activeDM) {
            await supabase.from('direct_messages').insert({
                user_id: userData.username,
                display_name: userData.username,
                content: msgContent,
                room: 'dm',
                dm_room: activeDM
            });
        } else {
            await supabase.from('public_messages').insert({
                user_id: userData.username,
                display_name: userData.username,
                content: msgContent,
                room: activeRoom,
                rank_icon: getRank().icon
            });
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] bg-[#030014] text-white pt-[80px] px-4 pb-4 md:pl-24" dir="rtl">
            {/* Sidebar - Rooms & Users */}
            <div className="w-1/4 hidden md:flex flex-col gap-4 border-l border-white/10 pl-4">
                {/* Connection Status */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-sm text-gray-200">حالة الاتصال</h3>
                        <p className="text-xs text-gray-500">{isConnected ? 'متصل بالشبكة الحية' : 'جاري الاتصال...'}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>

                {/* Rooms */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash className="w-4 h-4" /> الغرف العامة
                    </h3>
                    <div className="space-y-2">
                        {ROOMS.map(room => (
                            <button
                                key={room.id}
                                onClick={() => { setActiveRoom(room.id); setActiveDM(null); }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeRoom === room.id && !activeDM ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${room.bg} ${room.color}`}>
                                    <room.icon className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-sm text-gray-300">{room.name}</span>
                            </button>
                        ))}
                    </div>

                    <hr className="border-white/10 my-6" />

                    {/* Online Users */}
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> المتصلون الآن ({onlineUsers.length})
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {onlineUsers.map((u, i) => (
                            <button
                                key={i}
                                onClick={() => startDM(u.user_id, u.display_name)}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-black">
                                            {u.display_name?.substring(0, 2)}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#030014]" />
                                    </div>
                                    <div className="flex flex-col items-start px-2">
                                        <span className="text-xs font-bold text-gray-200">{u.display_name}</span>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                            {u.rank_icon} عضو
                                        </span>
                                    </div>
                                </div>
                                {u.user_id !== userData?.username && (
                                    <MessageCircle className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white/5 rounded-3xl border border-white/10 overflow-hidden ml-0 md:ml-4 relative">
                {/* Chat Header */}
                <div className="h-16 border-b border-white/10 bg-black/20 flex items-center px-6 justify-between backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        {activeDM ? (
                            <>
                                <button onClick={exitDM} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-black">
                                    {activeDMName?.substring(0, 2)}
                                </div>
                                <div>
                                    <h2 className="font-black text-white">{activeDMName}</h2>
                                    <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> رسائل خاصة مشفرة</p>
                                </div>
                            </>
                        ) : (
                            <>
                                {ROOMS.find(r => r.id === activeRoom)?.icon && React.createElement(ROOMS.find(r => r.id === activeRoom)!.icon, { className: 'w-6 h-6 text-purple-400' })}
                                <div>
                                    <h2 className="font-black text-white">{ROOMS.find(r => r.id === activeRoom)?.name}</h2>
                                    <p className="text-xs text-gray-400">تواصل مع المجتمع مباشرة</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/40">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                            <p>لا توجد رسائل بعد. كن أول من يشارك!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.user_id === userData?.username;
                            return (
                                <motion.div
                                    key={msg.id || index}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[75%] flex gap-3 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex-shrink-0 flex items-center justify-center text-xs font-black mt-auto shadow-lg">
                                            {msg.display_name?.substring(0, 2)}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                                            <span className="text-xs text-gray-500 mb-1 px-1 flex items-center gap-1">
                                                {msg.rank_icon} {msg.display_name}
                                            </span>
                                            <div className={`px-5 py-3 rounded-2xl shadow-xl backdrop-blur-sm ${isMe
                                                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-sm border border-white/10'
                                                : 'bg-[#1a1c29] text-gray-200 rounded-tl-sm border border-white/5'
                                                }`}>
                                                <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-600 mt-1 px-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={activeDM ? `رسالة إلى ${activeDMName}...` : 'اكتب رسالتك للمجتمع...'}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium pr-16"
                            dir="auto"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
                        >
                            <Send className="w-5 h-5 -ml-1" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
