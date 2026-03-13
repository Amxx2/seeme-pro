import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Square, FileText, Moon, Star, Drumstick } from 'lucide-react';

interface CinematicHungerHUDProps {
    isRecording: boolean;
    isAnalyzing: boolean;
    onStop: () => void;
    onShowReport?: () => void;
    hasData?: boolean;
    audioLevel?: number;
}

const mockLogStream = [
    { time: '00:01', text: "استشعار الموجات الصوتية...", type: 'system', emotion: '🌙', confidence: 100 },
    { time: '00:03', text: "تحليل معدلات الحيوية...", type: 'system', emotion: '✨', confidence: 98 },
    { time: '00:05', text: "أنا مش مصدق إن لسه فاضل ساعتين على المغرب!", type: 'speech', emotion: '😩', confidence: 95 },
    { time: '00:08', text: "[انخفاض في مستوى الطاقة - احتمالية الجوع 80%]", type: 'alert', emotion: '📉', confidence: 92 },
    { time: '00:10', text: "لو سمحت خلص بسرعة عشان مش قادر أركز...", type: 'speech', emotion: '😤', confidence: 85 },
    { time: '00:12', text: "[تسجيل نبرة توتر بسبب نقص السكر]", type: 'alert', emotion: '⚡', confidence: 89 },
    { time: '00:18', text: "اكتمل التحليل. جاري إعداد التقرير الرمضاني.", type: 'system', emotion: '🍽️', confidence: 100 },
];

export const CinematicHungerHUD: React.FC<CinematicHungerHUDProps> = ({ isRecording, isAnalyzing, onStop, onShowReport, hasData, audioLevel }) => {
    const [logs, setLogs] = useState<typeof mockLogStream>([]);
    const [hunger, setHunger] = useState(10);
    const [energy, setEnergy] = useState(90);
    const [thirst, setThirst] = useState(20);
    const [waveform, setWaveform] = useState<number[]>(Array(30).fill(10));
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        if (!isRecording && !isAnalyzing) {
            setLogs([]);
            return;
        }

        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < mockLogStream.length) {
                setLogs((prev) => [...prev, mockLogStream[logIndex]]);
                logIndex++;
            }
        }, 2200);

        const gaugeInterval = setInterval(() => {
            setHunger(prev => Math.min(100, Math.max(0, prev + (Math.random() * 20 - 2))));
            setEnergy(prev => Math.min(100, Math.max(0, prev + (Math.random() * 15 - 10))));
            setThirst(prev => Math.min(100, Math.max(0, prev + (Math.random() * 15 - 5))));
        }, 800);

        return () => {
            clearInterval(logInterval);
            clearInterval(gaugeInterval);
        };
    }, [isRecording, isAnalyzing]);

    useEffect(() => {
        if (!isRecording && !isAnalyzing) { setWaveform(Array(30).fill(10)); return; }
        const iv = setInterval(() => {
            setWaveform(p => {
                const n = [...p.slice(1)];
                const amp = (isRecording || isAnalyzing) && audioLevel !== undefined ? Math.max(10, audioLevel) : 25;
                const randomVal = (isRecording || isAnalyzing) && audioLevel !== undefined ? Math.max(10, audioLevel * (0.6 + Math.random() * 0.4)) : Math.random() * amp + 10;
                n.push(randomVal);
                return n;
            });
        }, 80);
        return () => clearInterval(iv);
    }, [isRecording, isAnalyzing, audioLevel]);

    const themeObj = {
        glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
        border: 'border-amber-500/50',
        bg: 'bg-amber-900/20',
        text: 'text-amber-400',
    };

    return (
        <div className="w-full flex justify-center mt-8 dir-rtl">
            <div className={`w-full relative bg-[#1a0f00] border-2 ${themeObj.border} rounded-[2rem] p-6 overflow-hidden flex flex-col md:flex-row-reverse gap-6 ${themeObj.glow}`}>

                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Moon className="w-48 h-48 text-amber-500 fill-amber-500" />
                </div>
                <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none">
                    <Star className="w-24 h-24 text-amber-500 fill-amber-500" />
                </div>

                <motion.div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50"
                    animate={{ y: [0, 500, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                <div className={`w-full md:w-1/2 flex flex-col items-center justify-center p-6 border-l ${themeObj.border} relative z-10`}>

                    <div className="mb-6 mb-12 text-center h-24 flex items-end justify-center">
                        <AnimatePresence>
                            {(isRecording || isAnalyzing) ? (
                                <motion.div className="flex items-center gap-1">
                                    {waveform.map((h, i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-2 rounded-t-lg bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]`}
                                            animate={{
                                                height: h,
                                            }}
                                            transition={{
                                                duration: 0.1
                                            }}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="text-amber-700 font-bold text-lg">بانتظار الصوت...</div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 h-32 flex items-center justify-center">
                        {isRecording ? (
                            <button onClick={onStop} className={`relative group w-32 h-32 rounded-full flex items-center justify-center ${themeObj.bg} border-2 ${themeObj.border} transition-all duration-300 hover:scale-105 active:scale-95`}>
                                <Square className={`w-10 h-10 ${themeObj.text} fill-current z-10`} />
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-30 bg-amber-500`}></div>
                                <div className="absolute -bottom-8 text-sm font-bold text-amber-500 uppercase">إيقاف المسح</div>
                            </button>
                        ) : isAnalyzing ? (
                            <div className="relative w-32 h-32 flex items-center justify-center border-4 border-amber-500/30 rounded-full border-t-amber-500 animate-spin">
                                <Drumstick className="w-8 h-8 text-amber-500 animate-[bounce_2s_infinite]" style={{ animationDirection: 'reverse' }} />
                                <div className="absolute -bottom-12 text-sm font-bold text-amber-500 animate-pulse text-center w-full">جاري<br />التحليل</div>
                            </div>
                        ) : hasData ? (
                            <button onClick={onShowReport} className="relative group w-auto px-8 py-4 rounded-full flex items-center justify-center bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                                <FileText className="w-5 h-5 ml-3" /> إظهار النتيجة
                            </button>
                        ) : null}
                    </div>

                    {(isRecording || isAnalyzing) && (
                        <div className="w-full mt-12 grid grid-cols-3 gap-4">
                            <Gauge title="مستوى الجوع" value={hunger} />
                            <Gauge title="مستوى الطاقة" value={energy} />
                            <Gauge title="جفاف الحلق" value={thirst} />
                        </div>
                    )}
                </div>

                <div className={`w-full md:w-1/2 bg-black/50 border ${themeObj.border} rounded-2xl p-4 flex flex-col relative z-10 h-[400px]`}>
                    <div className={`flex items-center gap-2 mb-4 border-b ${themeObj.border} pb-3 text-right rtl`}>
                        <Terminal className={`w-4 h-4 ${themeObj.text}`} />
                        <span className={`text-sm font-bold ${themeObj.text}`}>السجل المباشر</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-right rtl">
                        <AnimatePresence>
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-sm leading-relaxed"
                                >
                                    <span className="text-amber-700/80 mx-2">[{log.time}]</span>
                                    <span className="mx-2 text-lg">{log.emotion}</span>
                                    <span className={log.type === 'system' ? 'text-amber-200 font-bold' : log.type === 'alert' ? 'text-black font-bold bg-amber-500 px-2' : 'text-amber-100'}>
                                        <TypewriterText text={log.text} />
                                    </span>
                                </motion.div>
                            ))}
                            <div ref={logsEndRef} />
                        </AnimatePresence>
                        {(isRecording || isAnalyzing) && (
                            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-amber-500 inline-block mt-2"></motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Gauge = ({ title, value }: { title: string, value: number }) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 rounded-full border border-amber-500/30 flex items-center justify-center bg-black/30">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-amber-900/30" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="175.93" strokeDashoffset={175.93 - (175.93 * (value / 100))} className="text-amber-500 transition-all duration-300 drop-shadow-[0_0_5px_currentColor]" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-sm text-amber-400">{Math.round(value)}%</span>
                </div>
            </div>
            <span className="text-[10px] font-bold text-amber-500/80">{title}</span>
        </div>
    );
};

const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let i = 0;
        setDisplayedText('');
        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 20);
        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayedText}</span>;
};
