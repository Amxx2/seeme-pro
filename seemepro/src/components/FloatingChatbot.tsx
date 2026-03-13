import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage } from '../utils/aiChatService';

type Message = { role: 'bot' | 'user'; text: string };

const FloatingChatbot = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: t('bot_greeting', { defaultValue: 'Hello! I am SEEMEPRO Support. How can I help you today? 👁️' }) }
    ]);

    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const send = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { role: 'user', text: text.trim() };

        // Add user message to UI immediately
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setTyping(true);

        try {
            // Convert messages to format expected by OpenAI
            const apiMessages = updatedMessages.map(m => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.text
            } as const));

            const responseText = await sendChatMessage(apiMessages);

            setMessages(prev => [...prev, { role: 'bot', text: responseText }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I'm experiencing technical difficulties. Please try again later." }]);
        } finally {
            setTyping(false);
        }
    };

    return (
        <>
            {/* Floating button */}
            <motion.button
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-2xl bg-[#0a0c16] border border-white/15 flex items-center justify-center shadow-[0_0_25px_rgba(0,255,255,0.15)] hover:border-cyan-500/40 transition-colors"
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X className="w-5 h-5 text-white" />
                        </motion.span>
                    ) : (
                        <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <MessageCircle className="w-5 h-5 text-cyan-400" />
                        </motion.span>
                    )}
                </AnimatePresence>
                {!open && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full shadow-[0_0_6px_#00ffff] animate-pulse" />
                )}
            </motion.button>

            {/* Chat window */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-6 z-[149] w-80 sm:w-96 bg-[#0a0c16] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,255,255,0.05)]"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-white/2">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-white font-black text-sm uppercase tracking-wide">{t('bot_name', { defaultValue: 'SEEMEPRO Support' })}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    <span className="text-xs text-gray-500">{t('bot_status', { defaultValue: 'Online · AI Assistant' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="h-72 overflow-y-auto p-4 space-y-3 flex flex-col">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black
                                        ${m.role === 'bot' ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-white/8 border border-white/10 text-white'}`}>
                                        {m.role === 'bot' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed
                                        ${m.role === 'bot'
                                            ? 'bg-white/5 border border-white/8 text-gray-300 rounded-tl-sm'
                                            : 'bg-white text-black font-medium rounded-tr-sm'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {typing && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                                    </div>
                                    <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                                        {[0, 1, 2].map(i => (
                                            <motion.span key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full"
                                                animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick actions */}
                        <div className="px-4 pb-2 flex gap-2 flex-wrap">
                            {['subscription', 'ads', 'refund', 'bug', 'pwa'].map(a => (
                                <button key={a} onClick={() => send(a)}
                                    className="text-xs bg-white/5 border border-white/8 text-gray-400 px-2.5 py-1 rounded-full hover:bg-white/10 hover:text-white transition-colors capitalize">
                                    {t(a, { defaultValue: a })}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="flex gap-2 p-4 pt-2 border-t border-white/8">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && send(input)}
                                placeholder={t('bot_placeholder', { defaultValue: 'Ask a question...' })}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                            />
                            <button onClick={() => send(input)}
                                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all flex-shrink-0">
                                <Send className="w-4 h-4 text-black" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingChatbot;
