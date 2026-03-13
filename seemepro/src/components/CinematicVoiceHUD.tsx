import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Terminal, Activity, Square, FileText, AlertTriangle, Share2, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import html2canvas from 'html2canvas';

interface CinematicVoiceHUDProps {
    isRecording: boolean;
    isAnalyzing: boolean;
    onStop: () => void;
    onShowReport?: () => void;
    hasData?: boolean;
    realtimeLogs?: Array<{ time: string, text: string, type: string, emotion: string, confidence: number }>;
    metrics?: { stress: number, honesty: number, speed: number };
    audioLevel?: number;
}

const mockLogStream = [
    { time: '00:01', text: "Initiating voice stream capture...", type: 'system', emotion: '🤖', confidence: 100 },
    { time: '00:03', text: "Detecting baseline vocal patterns...", type: 'system', emotion: '📊', confidence: 98 },
    { time: '00:05', text: "Yes, I was definitely at home all night...", type: 'speech', emotion: '😐', confidence: 85 },
    { time: '00:08', text: "[Micro-tremor detected in vocal chord frequency]", type: 'alert', emotion: '🚨', confidence: 92 },
    { time: '00:10', text: "I mean, I think I was alone...", type: 'speech', emotion: '😰', confidence: 45 },
    { time: '00:12', text: "[Pitch elevation +24% - Stress markers high]", type: 'alert', emotion: '📈', confidence: 89 },
    { time: '00:15', text: "Why are you asking me these questions?!", type: 'speech', emotion: '😡', confidence: 95 },
    { time: '00:18', text: "Analysis complete. Compiling behavioral report.", type: 'system', emotion: '✅', confidence: 100 },
];

const EMOTION_COLORS: Record<string, string> = {
    confidence: '#00FFD4', stress: '#FF453A', honesty: '#30D158',
    enthusiasm: '#FFD60A', calmness: '#147EFF', hesitation: '#FF9F0A',
};

export const CinematicVoiceHUD: React.FC<CinematicVoiceHUDProps> = ({
    isRecording, isAnalyzing, onStop, onShowReport, hasData, realtimeLogs, metrics, audioLevel
}) => {
    const [mockLogs, setMockLogs] = useState<typeof mockLogStream>([]);
    const [mockStress, setMockStress] = useState(20);
    const [mockHonesty, setMockHonesty] = useState(90);
    const [mockSpeed, setMockSpeed] = useState(120);
    const [waveform, setWaveform] = useState<number[]>(Array(60).fill(3));
    const [emotionHistory, setEmotionHistory] = useState<{ t: number, stress: number, honesty: number, confidence: number }[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const tickRef = useRef(0);

    const logs = realtimeLogs?.length ? realtimeLogs : mockLogs;
    const stress = metrics?.stress ?? mockStress;
    const honesty = metrics?.honesty ?? mockHonesty;
    const speed = metrics?.speed ?? mockSpeed;

    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

    // Waveform
    useEffect(() => {
        if (!isRecording && !isAnalyzing) { setWaveform(Array(60).fill(3)); return; }
        const iv = setInterval(() => {
            setWaveform(p => {
                const n = [...p.slice(1)];
                const amp = (isRecording || isAnalyzing) && audioLevel !== undefined ? Math.max(10, audioLevel) : (stress > 70 ? 75 : stress > 40 ? 45 : 25);
                const randomVal = (isRecording || isAnalyzing) && audioLevel !== undefined ? Math.max(3, audioLevel * (0.8 + Math.random() * 0.4)) : Math.random() * amp + 4;
                n.push((isRecording || isAnalyzing) ? randomVal : Math.random() * amp + 4);
                return n;
            });
        }, 60);
        return () => clearInterval(iv);
    }, [isRecording, isAnalyzing, stress, audioLevel]);

    // Emotion timeline
    useEffect(() => {
        if (!isRecording && !isAnalyzing) return;
        const iv = setInterval(() => {
            tickRef.current += 1;
            setEmotionHistory(p => {
                const n = [...p, {
                    t: tickRef.current,
                    stress: metrics?.stress ?? mockStress,
                    honesty: metrics?.honesty ?? mockHonesty,
                    confidence: Math.min(100, Math.max(0, 95 - (metrics?.stress ?? mockStress) * 0.4 + (Math.random() * 8 - 4))),
                }];
                return n.length > 40 ? n.slice(-40) : n;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [isRecording, isAnalyzing, metrics, mockStress, mockHonesty]);

    useEffect(() => {
        if (!isRecording && !isAnalyzing) { setMockLogs([]); return; }
        let idx = 0;
        const lv = setInterval(() => {
            if (!realtimeLogs && idx < mockLogStream.length) { setMockLogs(p => [...p, mockLogStream[idx]]); idx++; }
        }, 2000);
        const gv = setInterval(() => {
            if (!metrics) {
                setMockStress(p => Math.min(100, Math.max(0, p + Math.random() * 20 - 5)));
                setMockHonesty(p => Math.min(100, Math.max(0, p + Math.random() * 10 - 8)));
                setMockSpeed(p => Math.min(200, Math.max(80, p + Math.random() * 30 - 15)));
            }
        }, 800);
        return () => { clearInterval(lv); clearInterval(gv); };
    }, [isRecording, isAnalyzing, realtimeLogs, metrics]);

    const themeColor = stress > 75 ? 'text-red-500' : stress > 50 ? 'text-orange-500' : 'text-emerald-400';
    const themeBg = stress > 75 ? 'bg-red-500/20 border-red-500/50' : stress > 50 ? 'bg-orange-500/20 border-orange-500/50' : 'bg-emerald-500/20 border-emerald-500/50';

    return (
        <div className="w-full mt-4">
            <div className="w-full bg-[#050505] border border-white/10 rounded-3xl p-5 flex flex-col gap-5 shadow-2xl overflow-hidden relative">
                <motion.div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40"
                    animate={{ y: [0, 600, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />

                {/* Waveform + Controls + Transcript */}
                <div className="flex flex-col md:flex-row gap-5">
                    {/* Left */}
                    <div className="w-full md:w-1/2 flex flex-col items-center gap-4">
                        {/* Waveform */}
                        <div className="w-full h-20 flex items-center justify-center gap-px px-2 relative bg-black/20 rounded-xl overflow-hidden">
                            {waveform.map((h, i) => (
                                <motion.div key={i} className={`w-1 rounded-full ${themeColor} bg-current`}
                                    animate={{ height: h }} transition={{ duration: 0.06 }} style={{ minHeight: 2 }} />
                            ))}
                        </div>

                        {/* Button */}
                        {isRecording ? (
                            <button onClick={onStop} className={`relative w-20 h-20 rounded-full flex items-center justify-center ${themeBg} border transition-all hover:scale-105`}>
                                <Square className={`w-6 h-6 ${themeColor} fill-current z-10`} />
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${themeColor} bg-current`} />
                            </button>
                        ) : isAnalyzing ? (
                            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-blue-500/10 border-2 border-blue-500/30">
                                <Activity className="w-7 h-7 text-blue-400 animate-spin" />
                            </div>
                        ) : hasData ? (
                            <button onClick={onShowReport} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-widest uppercase transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                                <FileText className="w-4 h-4" /> Official Report
                            </button>
                        ) : null}

                        {/* Gauges */}
                        {(isRecording || isAnalyzing) && (
                            <div className="w-full grid grid-cols-3 gap-3">
                                <Gauge title="Stress" value={stress} color="red" />
                                <Gauge title="Honesty" value={honesty} color="emerald" />
                                <Gauge title="WPM" value={speed} color="blue" max={250} />
                            </div>
                        )}
                    </div>

                    {/* Right: Transcript */}
                    <div className="w-full md:w-1/2 bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col" style={{ height: 280 }}>
                        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                            <Terminal className="w-3 h-3 text-gray-500" />
                            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Live Transcription</span>
                            <span className="ml-auto flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            <AnimatePresence>
                                {logs.map((log, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="font-mono text-[11px] leading-relaxed">
                                        <span className="text-gray-600 mr-1.5">[{log.time}]</span>
                                        <span className="mr-1 text-sm">{log.emotion}</span>
                                        <span className={log.type === 'system' ? 'text-blue-400 font-bold' : log.type === 'alert' ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                            <TypewriterText text={log.text} />
                                        </span>
                                        {log.type === 'speech' && (
                                            <span className={`ml-2 text-[9px] ${log.confidence > 80 ? 'text-green-400' : 'text-red-400'}`}>{log.confidence}%</span>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={logsEndRef} />
                            {(isRecording || isAnalyzing) && (
                                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-4 bg-white/50 inline-block" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Emotion Timeline */}
                {(isRecording || isAnalyzing || emotionHistory.length > 2) && (
                    <div className="w-full bg-black/30 border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-3 h-3 text-gray-500" />
                            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Emotion Timeline</span>
                            <div className="ml-auto flex items-center gap-3">
                                {[['stress', '#FF453A'], ['honesty', '#30D158'], ['confidence', '#00FFD4']].map(([k, c]) => (
                                    <span key={k} className="flex items-center gap-1 text-[9px] font-mono text-gray-500">
                                        <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: c }} />{k}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{ height: 100 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={emotionHistory} margin={{ top: 2, right: 4, bottom: 2, left: -22 }}>
                                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="t" hide />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#374151', fontSize: 9 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#050505', border: '1px solid #1f2937', fontFamily: 'monospace', fontSize: 10 }} />
                                    <Line type="monotone" dataKey="stress" stroke="#FF453A" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="honesty" stroke="#30D158" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="confidence" stroke="#00FFD4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Gauge = ({ title, value, color, max = 100 }: { title: string, value: number, color: string, max?: number }) => {
    const cl = color === 'red' ? (value > 60 ? 'text-red-500' : 'text-emerald-400') : color === 'emerald' ? (value > 70 ? 'text-emerald-400' : value > 40 ? 'text-yellow-400' : 'text-red-500') : 'text-blue-400';
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-black/50">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
                        strokeDasharray="125.7" strokeDashoffset={125.7 - (125.7 * Math.min(value, max) / max)}
                        className={`${cl} transition-all duration-300`} />
                </svg>
                <span className={`font-mono text-[9px] font-bold ${cl}`}>{Math.round(value)}</span>
            </div>
            <span className="text-[9px] font-mono text-gray-500 uppercase">{title}</span>
        </div>
    );
};

const TypewriterText = ({ text }: { text: string }) => {
    const [d, setD] = useState('');
    useEffect(() => {
        let i = 0; setD('');
        const iv = setInterval(() => { if (i < text.length) { setD(p => p + text[i]); i++; } else clearInterval(iv); }, 12);
        return () => clearInterval(iv);
    }, [text]);
    return <span>{d}</span>;
};

export const OfficialReportModal = ({ data, onClose }: { data: any, onClose: () => void }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const exportImage = async (share: boolean = false) => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            // Hide action buttons during screenshot if we want, but they are outside the ref anyway.
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);

            if (share && navigator.share) {
                const blob = await (await fetch(imgData)).blob();
                const file = new File([blob], `seeme_pro_report_${data?.session_id || 'AX'}.jpg`, { type: 'image/jpeg' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'SeeMePro Analysis Report',
                        text: 'Check out my SeeMePro Voice Behavioral Analysis Report! 🎙️✨',
                        files: [file]
                    });
                    return; // exit early if shared
                }
            }
            // Fallback to download
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `seeme_pro_report_${data?.session_id || 'AX'}.jpg`;
            link.click();
        } catch (err) {
            console.error('Export failed', err);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm shadow-2xl" onClick={onClose}>
                <motion.div initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40 }}
                    className="bg-white text-black w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] font-mono flex flex-col relative"
                    onClick={e => e.stopPropagation()}>

                    {/* Report Content that gets captured */}
                    <div ref={reportRef} className="p-8 pb-4 bg-white">
                        {/* Header */}
                        <div className="border-b-4 border-black pb-5 mb-6 flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">SeeMePro <span className="text-red-600">CONFIDENTIAL</span></h2>
                                <p className="text-[10px] font-bold tracking-widest text-gray-500">ADVANCED VOICE BEHAVIORAL ANALYSIS REPORT</p>
                                <p className="text-[10px] text-gray-400 mt-1">SESSION: {data?.session_id || 'AX-4992'} | {new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="w-14 h-14 border-4 border-red-600 rounded-full flex items-center justify-center -rotate-12">
                                <span className="text-red-600 font-bold text-[8px] uppercase text-center leading-tight">VERIFIED<br />SYSTEM</span>
                            </div>
                        </div>

                        {/* Grade + Summary + Scores */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">Overall Grade</p>
                                <div className="text-6xl font-black mb-3">{data?.scores?.overall_grade || 'B+'}</div>
                                <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase">Executive Summary</p>
                                <p className="text-xs font-medium leading-relaxed border-l-2 border-black pl-3 text-gray-700">{data?.analysis?.summary || 'Analysis complete.'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 border border-black/10 rounded">
                                <p className="text-[10px] font-bold uppercase mb-3 text-gray-500">Behavioral Scores</p>
                                <table className="w-full text-xs">
                                    <tbody>
                                        {[['Confidence', data?.scores?.confidence], ['Authenticity', data?.scores?.authenticity], ['Calmness', data?.scores?.calm], ['Clarity', data?.scores?.clarity]].map(([l, v]) => (
                                            <tr key={l as string} className="border-b border-black/10">
                                                <td className="py-1.5 font-bold">{l}</td>
                                                <td className="py-1.5 text-right font-bold" style={{ color: Number(v) > 70 ? '#16a34a' : Number(v) > 40 ? '#d97706' : '#dc2626' }}>{v ?? '--'}%</td>
                                                <td className="py-1.5 pl-2 w-16"><div className="h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-black rounded-full" style={{ width: `${v ?? 0}%` }} /></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Emotions */}
                        {data?.emotions?.length > 0 && (
                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase mb-3 text-gray-500">Detected Emotions</p>
                                <div className="flex flex-col gap-2">
                                    {data.emotions.map((e: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold w-20 truncate text-gray-600">{e.label}</span>
                                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${e.intensity}%` }} transition={{ duration: 0.8, delay: i * 0.08 }}
                                                    className="h-full rounded-full" style={{ backgroundColor: EMOTION_COLORS[e.label?.toLowerCase()] || '#555' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 w-7 text-right">{e.intensity}%</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${e.type === 'positive' ? 'bg-green-100 text-green-700' : e.type === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{e.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strengths + Concerns */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase mb-2 text-green-700">✅ Strengths</p>
                                <ul className="space-y-1">{(data?.analysis?.strengths || []).map((s: string, i: number) => <li key={i} className="text-xs border-l-2 border-green-500 pl-2 text-gray-700">{s}</li>)}</ul>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase mb-2 text-orange-700">⚠️ Concerns</p>
                                <ul className="space-y-1">{(data?.analysis?.areas_of_concern || []).map((s: string, i: number) => <li key={i} className="text-xs border-l-2 border-orange-500 pl-2 text-gray-700">{s}</li>)}</ul>
                            </div>
                        </div>

                        {/* Coaching */}
                        {data?.coaching_tips?.length > 0 && (
                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase mb-3 text-blue-700">💡 Coaching Tips</p>
                                <div className="space-y-2">
                                    {data.coaching_tips.map((t: any, i: number) => (
                                        <div key={i} className={`p-3 rounded border-l-4 ${t.priority === 'high' ? 'border-red-500 bg-red-50' : t.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'}`}>
                                            <p className="text-xs font-bold mb-0.5">{t.tip}</p>
                                            <p className="text-[10px] text-gray-500 italic">{t.example}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Red Flags */}
                        {data?.red_flags?.length > 0 && (
                            <div className="mb-6 p-4 border-2 border-red-600 bg-red-50 rounded">
                                <h3 className="font-bold text-red-600 text-xs uppercase flex items-center mb-3"><AlertTriangle className="w-3 h-3 mr-2" />Critical Flags</h3>
                                {data.red_flags.map((rf: any, i: number) => (
                                    <div key={i} className="mb-2 text-xs border-l-4 border-red-600 pl-3">
                                        <span className="font-bold">{rf.flag}</span> <span className="text-gray-400">[{rf.timestamp}]</span>
                                        <br /><span className="italic text-gray-500">{rf.recommendation}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Detailed */}
                        {data?.analysis?.detailed && (
                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase mb-2 text-gray-500">Detailed Analysis</p>
                                <p className="text-xs text-gray-700 leading-relaxed border border-black/10 p-3 rounded bg-gray-50">{data.analysis.detailed}</p>
                            </div>
                        )}

                        {/* Footer Disclaimer within capture */}
                        <div className="mt-6 pt-4 border-t-2 border-dashed border-black/20 text-center">
                            <ShieldAlert className="w-5 h-5 mb-1 opacity-30 mx-auto text-black" />
                            <p className="text-[8px] text-gray-400 max-w-[90%] mx-auto leading-relaxed">{data?.disclaimer || "⚠️ Indicative analysis only. Not legal evidence. Powered by SeeMePro AI."}</p>
                        </div>
                    </div>

                    {/* Action Buttons (outside capture area) */}
                    <div className="p-4 bg-gray-100 border-t border-black/10 flex flex-col sm:flex-row gap-3 mt-auto rounded-b-lg">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg uppercase font-bold tracking-widest transition-colors text-xs disabled:opacity-50"
                            onClick={() => exportImage(true)}
                            disabled={isExporting}
                        >
                            {isExporting ? <Activity className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                            Share to Instagram / Social
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-3 rounded-lg uppercase font-bold tracking-widest transition-colors text-xs disabled:opacity-50"
                            onClick={() => exportImage(false)}
                            disabled={isExporting}
                        >
                            {isExporting ? <Activity className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Save Image
                        </button>
                        <button
                            className="w-full sm:w-auto px-6 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-lg uppercase font-bold tracking-widest transition-colors text-xs"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
