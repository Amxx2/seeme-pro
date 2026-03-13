import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, Users, Activity, Globe, Bot, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { chatWithAI } from '../utils/huggingface';
import type { ChatMessage } from '../utils/huggingface';

const WELCOME: ChatMessage = {
    role: 'assistant',
    content: 'Hello! I am **SeemePro AI** — your expert in body language, voice stress analysis, and deception detection. Ask me anything about micro-expressions, speech patterns, or how to read behavioral cues.',
};

const ChatSystem = () => {
    const { user } = useAppStore();
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<ChatMessage[]>([]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        const newHistory = [...historyRef.current, userMsg];
        historyRef.current = newHistory;

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const reply = await chatWithAI(newHistory);
            const aiMsg: ChatMessage = { role: 'assistant', content: reply };
            historyRef.current = [...newHistory, aiMsg];
            setMessages(prev => [...prev, aiMsg]);
        } catch {
            const errMsg: ChatMessage = { role: 'assistant', content: 'Connection error. Please try again.' };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 max-w-[1600px] mx-auto pb-4">

            {/* Sidebar */}
            <div className="w-64 bg-card/50 border border-accent rounded-2xl p-4 flex-col hidden lg:flex">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4" /> Channels
                </h3>
                <div className="space-y-1">
                    <ChannelBtn active icon={<Globe className="w-4 h-4" />} label="AI Analyst Chat" />
                    <ChannelBtn icon={<Activity className="w-4 h-4" />} label="Analysis Tips" />
                    <ChannelBtn icon={<Users className="w-4 h-4" />} label="Community" />
                </div>
                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Agent</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Powered by Qwen-72B via HuggingFace. Expert in behavioral analysis.
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400 font-mono">Online</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-black/40 border border-accent rounded-2xl flex flex-col relative overflow-hidden backdrop-blur-md">

                {/* Header */}
                <div className="h-16 border-b border-accent/50 flex items-center px-6 bg-card/50 gap-3">
                    <Bot className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="text-sm font-bold text-white">SeemePro AI Analyst</h2>
                        <p className="text-[10px] text-gray-500 font-mono">Real AI • Body Language Expert</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                )}

                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <span className="text-[10px] text-gray-600 font-mono px-1">
                                        {msg.role === 'user' ? (user.username || 'You') : 'SeemePro AI'}
                                    </span>
                                    <p className={`text-sm p-4 rounded-2xl leading-relaxed whitespace-pre-wrap
                                        ${msg.role === 'user'
                                            ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-none'
                                            : 'bg-card border border-accent/50 text-gray-200 rounded-tl-none'}`}>
                                        {msg.content}
                                    </p>
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black text-white">
                                        {(user.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                                <div className="bg-card border border-accent/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    <span className="text-xs text-gray-500 font-mono">Analyzing...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-card/80 border-t border-accent backdrop-blur-lg">
                    <form onSubmit={handleSend} className="relative flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask about body language, voice stress, deception signs..."
                            disabled={isLoading}
                            className="flex-1 bg-black/60 border border-accent/80 rounded-full py-4 pl-6 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-gray-600 disabled:opacity-50"
                        />
                        <button type="submit" disabled={!input.trim() || isLoading}
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-primary text-white hover:bg-blue-400 disabled:bg-accent disabled:text-gray-500 disabled:cursor-not-allowed flex-shrink-0">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-700 font-mono mt-2">
                        Powered by Qwen-72B via HuggingFace AI
                    </p>
                </div>
            </div>
        </div>
    );
};

const ChannelBtn = ({ active, icon, label }: { active?: boolean; icon: React.ReactNode; label: string }) => (
    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
        ${active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:bg-accent/50 hover:text-white'}`}>
        {icon}{label}
    </button>
);

export default ChatSystem;
