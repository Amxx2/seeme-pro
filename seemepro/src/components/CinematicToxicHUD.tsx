import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Square, FileText, Skull, Flame } from 'lucide-react';

interface CinematicToxicHUDProps {
    isRecording: boolean;
    isAnalyzing: boolean;
    onStop: () => void;
    onShowReport?: () => void;
    hasData?: boolean;
    audioLevel?: number;
}

const mockLogStream = [
    { time: '00:01', text: "Initializing toxic extraction...", type: 'system', emotion: '💀', confidence: 100 },
    { time: '00:03', text: "Tracking dominant speech patterns...", type: 'system', emotion: '👁️', confidence: 98 },
    { time: '00:05', text: "You always do this to me, it's so annoying!", type: 'speech', emotion: '🙄', confidence: 95 },
    { time: '00:08', text: "[Warning: Gaslighting marker detected]", type: 'alert', emotion: '🚩', confidence: 92 },
    { time: '00:10', text: "I'm just being honest, you're too sensitive...", type: 'speech', emotion: '😒', confidence: 85 },
    { time: '00:12', text: "[Threat level escalation - Passive Aggression +30%]", type: 'alert', emotion: '☢️', confidence: 89 },
    { time: '00:18', text: "Isolation routines complete.", type: 'system', emotion: '✅', confidence: 100 },
];

export const CinematicToxicHUD: React.FC<CinematicToxicHUDProps> = ({ isRecording, isAnalyzing, onStop, onShowReport, hasData, audioLevel }) => {
    const [logs, setLogs] = useState<typeof mockLogStream>([]);
    const [toxicity, setToxicity] = useState(10);
    const [dominance, setDominance] = useState(20);
    const [empathy, setEmpathy] = useState(80);
    const [waveform, setWaveform] = useState<number[]>(Array(40).fill(10));
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
            setToxicity(prev => Math.min(100, Math.max(0, prev + (Math.random() * 25 - 5))));
            setDominance(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 2))));
            setEmpathy(prev => Math.min(100, Math.max(0, prev + (Math.random() * 20 - 15))));
        }, 700);

        return () => {
            clearInterval(logInterval);
            clearInterval(gaugeInterval);
        };
    }, [isRecording, isAnalyzing]);

    useEffect(() => {
        if (!isRecording && !isAnalyzing) { setWaveform(Array(40).fill(10)); return; }
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

    // Evil red theme
    const dangerColor = 'text-red-600 shadow-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,1)]';
    const bgGlow = 'bg-red-900/20 border-red-600/50';

    return (
        <div className="w-full flex justify-center mt-8">
            <div className="w-full relative bg-[#0a0000] border-2 border-red-900/30 rounded-3xl p-6 overflow-hidden flex flex-col md:flex-row gap-6 shadow-[0_0_50px_rgba(153,27,27,0.2)]">

                {/* Background scanning line */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"
                    animate={{ y: [0, 500, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Background hazard stripes layer */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff0000 10px, #ff0000 20px)' }}></div>

                {/* Left Panel: Waveform & Main Actions */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 border-r border-red-900/30 relative z-10">
                    <Skull className="absolute top-0 left-4 w-12 h-12 text-red-900/40" />

                    <div className="mb-6 mb-12 text-center h-24 flex items-end justify-center">
                        <AnimatePresence>
                            {(isRecording || isAnalyzing) ? (
                                <motion.div className="flex items-center gap-1">
                                    {waveform.map((h, i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-1.5 rounded-sm bg-red-600`}
                                            animate={{
                                                height: h,
                                                opacity: [0.8, 1, 0.8],
                                                backgroundColor: ['#dc2626', '#ef4444', '#dc2626']
                                            }}
                                            transition={{
                                                duration: 0.1,
                                            }}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="text-red-900/50 font-black tracking-widest uppercase">Target Unlocked</div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 h-32 flex items-center justify-center">
                        {isRecording ? (
                            <button onClick={onStop} className={`relative group w-32 h-32 rounded-lg flex items-center justify-center ${bgGlow} border-2 transition-all duration-300 hover:scale-105 active:scale-95`}>
                                <Square className={`w-10 h-10 ${dangerColor} fill-current z-10`} />
                                <div className={`absolute inset-0 rounded-lg animate-ping opacity-30 bg-red-600`}></div>
                                <div className="absolute -bottom-8 text-xs font-black text-red-500 tracking-widest uppercase"><Flame className="w-3 h-3 inline mr-1" />Terminate</div>
                            </button>
                        ) : isAnalyzing ? (
                            <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-red-900/20 border-2 border-red-600 border-dashed animate-[spin_4s_linear_infinite]">
                                <Skull className="w-12 h-12 text-red-500 fill-red-500 animate-[spin_-4s_linear_infinite]" />
                                <div className="absolute -bottom-10 text-xs font-black text-red-500 tracking-widest uppercase animate-pulse w-full text-center">Extracting<br />Toxins</div>
                            </div>
                        ) : hasData ? (
                            <button onClick={onShowReport} className="relative group w-auto px-8 py-4 rounded-xl flex items-center justify-center bg-red-700 hover:bg-red-600 text-black font-black tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                                <FileText className="w-5 h-5 mr-3 text-black" /> Generate Toxicity Report
                            </button>
                        ) : null}
                    </div>

                    {(isRecording || isAnalyzing) && (
                        <div className="w-full mt-12 grid grid-cols-3 gap-4">
                            <Gauge title="Toxicity" value={toxicity} />
                            <Gauge title="Dominance" value={dominance} />
                            <Gauge title="Empathy" value={empathy} />
                        </div>
                    )}
                </div>

                {/* Right Panel: Live Terminal */}
                <div className="w-full md:w-1/2 bg-black/80 border border-red-900/50 rounded-lg p-4 flex flex-col relative z-10 h-[400px] shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]">
                    <div className="flex items-center gap-2 mb-4 border-b border-red-900/50 pb-3">
                        <Terminal className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-black tracking-widest text-red-600 uppercase">Live Intercept</span>
                        <span className="ml-auto w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-red-900/50">
                        <AnimatePresence>
                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="font-mono text-sm leading-relaxed"
                                >
                                    <span className="text-red-900/80 mr-3">[{log.time}]</span>
                                    <span className="mr-2 text-lg">{log.emotion}</span>
                                    <span className={log.type === 'system' ? 'text-gray-400 font-bold' : log.type === 'alert' ? 'text-black font-black bg-red-600 px-2 uppercase tracking-wide' : 'text-red-400 font-medium'}>
                                        <TypewriterText text={log.text} />
                                    </span>
                                </motion.div>
                            ))}
                            <div ref={logsEndRef} />
                        </AnimatePresence>
                        {(isRecording || isAnalyzing) && (
                            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-2 h-4 bg-red-600 inline-block mt-2"></motion.div>
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
            <div className={`relative w-16 h-16 border-2 flex items-center justify-center bg-black/50 ${value > 70 ? 'border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'border-red-900/50'}`}>
                <div className="absolute bottom-0 left-0 w-full bg-red-600/20" style={{ height: `${value}%` }}></div>
                <div className={`absolute bottom-0 left-0 w-full animate-pulse transition-all duration-300 ${value > 70 ? 'bg-red-600' : 'bg-red-800'}`} style={{ height: `${value}%`, opacity: 0.5 }}></div>
                <span className={`font-black text-xs z-10 ${value > 70 ? 'text-red-400' : 'text-red-700'}`}>{Math.round(value)}%</span>
            </div>
            <span className="text-[10px] font-black tracking-widest text-red-600/70 uppercase">{title}</span>
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
        }, 15);
        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayedText}</span>;
};
