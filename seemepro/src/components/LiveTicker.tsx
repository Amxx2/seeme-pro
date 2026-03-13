import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface TickerItem {
    id: string;
    event_type: string;
    display_text: string;
    emoji: string;
    color: string;
    user_name: string;
    created_at: string;
}

const defaultItems: TickerItem[] = [
    { id: '1', event_type: 'system', display_text: 'مرحباً بكم في نظام SeeMePro Social الجديد! 🎉', emoji: '✨', color: '#00FFD4', user_name: 'النظام', created_at: new Date().toISOString() },
];

const LiveTicker: React.FC = () => {
    const [items, setItems] = useState<TickerItem[]>(defaultItems);
    const [onlineCount, setOnlineCount] = useState(37);

    // Subscribe to realtime
    useEffect(() => {
        const channel = supabase
            .channel('ticker')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticker_events' },
                (payload) => {
                    setItems(prev => [payload.new as TickerItem, ...prev].slice(0, 20));
                })
            .subscribe();

        // Fake online count update
        const iv = setInterval(() => {
            setOnlineCount(Math.floor(Math.random() * 30) + 25);
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(iv);
        };
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[200] h-9 bg-gradient-to-r from-black via-[#0a0a12] to-black border-b border-cyan-500/20 flex items-center overflow-hidden" dir="rtl">
            {/* RIGHT (Brand logic, but we mirror on RTL, so this is on the visual right side) */}
            <div className="shrink-0 flex items-center gap-2 px-3 border-l border-white/10 h-full bg-black/50 z-10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-white tracking-widest hidden sm:inline">SEEMEPRO</span>
                <span className="text-[10px] font-bold text-red-500 ml-2">LIVE</span>
            </div>

            {/* CENTER: Scrolling text */}
            <div className="flex-1 overflow-hidden h-full relative">
                <div className="ticker-scroll absolute h-full flex items-center whitespace-nowrap whitespace-nowrap gap-6 pl-10">
                    {items.map((item, i) => (
                        <span key={item.id + '-' + i} className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: item.color || '#fff' }}>
                            <span className="text-sm">{item.emoji}</span> {item.display_text}
                            <span className="text-gray-600 mx-3 text-[8px]">◆</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* LEFT (Online count on the visual left due to RTL) */}
            <div className="shrink-0 px-3 border-r border-white/10 h-full flex items-center bg-black/50 z-10">
                <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">👥 {onlineCount} متصل</span>
            </div>
        </div>
    );
};

export default LiveTicker;
