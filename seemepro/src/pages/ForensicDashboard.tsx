import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Activity, Heart, Eye, Mic, ChevronDown, Check, User, Play, Pause, Volume2, Maximize, ScanSearch, Radar, BarChart3, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import clsx from 'clsx';
import { useAppStore } from '../store/useAppStore';

// === Mock Data for Simulation ===

const AGENT_PERSONAS = [
    { id: 'tech_ahmed', name: 'tech_support', role: 'Support Agent', avatar: '👨‍💻' },
    { id: 'sales_sarah', name: 'sales_rep', role: 'Sales Specialist', avatar: '👩‍💼' }
];

const MOCK_TRANSCRIPT_AHMED = [
    { time: 2, text: "Welcome to SeeMe Pro support, this is Ahmed speaking. How can I assist you today?", speaker: "agent", type: "neutral" },
    { time: 8, text: "Hi Ahmed. I am trying to access the dashboard, but my password isn't working.", speaker: "user", type: "neutral" },
    { time: 14, text: "I can help with that. Could you confirm the email address associated with your account?", speaker: "agent", type: "neutral" },
    { time: 19, text: "Uhh... yeah, it's... admin@seemepro.test, I think?", speaker: "user", type: "uncertain" },
    { time: 24, text: "Thank you. Let me check... I don't see that email in our current database.", speaker: "agent", type: "neutral" },
    { time: 30, text: "Wait, no, maybe it was under my personal email? I... I don't remember exactly when I signed up.", speaker: "user", type: "deception" },
    { time: 36, text: "No problem. We can try verifying through your linked phone number instead.", speaker: "agent", type: "neutral" }
];

const MOCK_TRANSCRIPT_SARAH = [
    { time: 2, text: "Hi there! I'm Sarah from the Enterprise Sales team. Thanks for joining the call today!", speaker: "agent", type: "neutral" },
    { time: 8, text: "Hello Sarah. We are evaluating SeeMe Pro for our HR department's interview process.", speaker: "user", type: "neutral" },
    { time: 13, text: "That's fantastic. We have several enterprise clients doing exactly that. What are your main requirements?", speaker: "agent", type: "neutral" },
    { time: 18, text: "Well, we need to ensure the accuracy of the micro-expression scanning. Is it independently verified?", speaker: "user", type: "neutral" },
    { time: 24, text: "Absolutely! Our rPPG and MediaPipe integrations are industry-leading with over 98% accuracy in clinical trials.", speaker: "agent", type: "neutral" },
    { time: 32, text: "Hmm. I read a report saying the stress detection models often misclassify cultural differences.", speaker: "user", type: "uncertain" },
    { time: 39, text: "I assure you our models are trained on diverse global datasets to mitigate any such biases.", speaker: "agent", type: "neutral" },
    { time: 45, text: "I see. Because our budget is quite strict this quarter. We might have to delay implementation until Q3.", speaker: "user", type: "deception" }
];

// Generate fake continuous data for the Seismograph timeline (100 data points for ~1 min video)
const generateSeismicData = () => {
    return Array.from({ length: 100 }).map((_, i) => {
        let baseStress = 20 + Math.random() * 20;
        let stressLevel = "low";

        // Add fake spikes at specific intervals matching the transcript "deception" moments
        if ((i > 25 && i < 35) || (i > 75 && i < 85) || (i > 45 && i < 50)) {
            baseStress += 40 + Math.random() * 20;
            stressLevel = "high";
        } else if ((i > 15 && i < 20) || (i > 55 && i < 60)) {
            baseStress += 20 + Math.random() * 15;
            stressLevel = "medium";
        }

        return {
            time: i,
            amplitude: Math.abs(Math.sin(i * 0.5) * 50) + Math.random() * 30, // Mock audio waveform
            stress: baseStress,
            level: stressLevel
        };
    });
};

const SEISMIC_DATA = generateSeismicData();

export default function ForensicDashboard() {
    const { t } = useTranslation();
    const { language } = useAppStore();
    const isRtl = language === 'ar';

    const [activePersona, setActivePersona] = useState(AGENT_PERSONAS[0]);
    const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showForensicLayer, setShowForensicLayer] = useState(true);

    // const videoRef = useRef<HTMLVideoElement>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Timeline control loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + 1;
                    if (next > 60) {
                        setIsPlaying(false);
                        return 0; // Reset at end
                    }
                    return next;
                });
            }, 1000); // 1 second intervals for demo purposes
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            const activeElements = transcriptRef.current.getElementsByClassName('active-transcript');
            if (activeElements.length > 0) {
                activeElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentTime]);

    const activeTranscript = activePersona.id === 'tech_ahmed' ? MOCK_TRANSCRIPT_AHMED : MOCK_TRANSCRIPT_SARAH;

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
        // In a real app, videoRef.current?.play() / pause() would be called here.
    };

    const handleSeek = (time: number) => {
        setCurrentTime(time);
        // In a real app, videoRef.current.currentTime = time
    };

    // Derived Real-Time Biometrics
    const currentDataIndex = Math.min(Math.max(0, Math.floor((currentTime / 60) * 100)), SEISMIC_DATA.length - 1);
    const currentBiometrics = SEISMIC_DATA[currentDataIndex];

    // Smooth the display values slightly to avoid jarring UI jumps
    const displayHeartRate = 60 + (currentBiometrics?.stress || 0) * 0.5 + Math.random() * 5;
    const gazeStability = Math.max(0, 100 - (currentBiometrics?.stress || 0) * 0.8 + Math.random() * 10);
    const voiceJitter = (currentBiometrics?.stress || 0) * 0.4 + Math.random() * 10;

    const isHighStress = currentBiometrics?.stress > 60;

    return (
        <div className="flex flex-col h-full gap-5 animate-in fade-in duration-500 max-w-7xl mx-auto">

            {/* Header: Title & Persona Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                <div className="flex items-center gap-4 z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(0,255,255,0.15)] group relative">
                        <ScanSearch className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 border border-cyan-400/50 rounded-xl animate-[ping_3s_ease-in-out_infinite] opacity-20" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                            {t('forensic_analysis')}
                            <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 animate-pulse">
                                <Activity className="w-3 h-3" /> LIVE
                            </span>
                        </h1>
                        <p className="text-xs text-gray-400 tracking-wider">ENTERPRISE INTERROGATION & LINGUISTIC ROUTING</p>
                    </div>
                </div>

                {/* Agent Persona Dropdown */}
                <div className="relative z-20">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 px-1">{t('agent_persona')}</div>
                    <button
                        onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                        className="flex items-center gap-3 px-4 py-2 bg-[#0a0f1d] border border-white/10 rounded-xl hover:bg-white/5 transition-colors shadow-inner min-w-[220px]"
                    >
                        <span className="text-xl">{activePersona.avatar}</span>
                        <div className="flex-1 text-start">
                            <div className="text-sm font-bold text-gray-200">{t(activePersona.name)}</div>
                            <div className="text-[10px] text-cyan-500/70 uppercase tracking-wider">{activePersona.role}</div>
                        </div>
                        <ChevronDown className={clsx("w-4 h-4 text-gray-500 transition-transform", personaDropdownOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                        {personaDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full lg:right-0 mt-2 w-full min-w-[220px] bg-[#0d1223] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 backdrop-blur-xl"
                            >
                                {AGENT_PERSONAS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setActivePersona(p); setPersonaDropdownOpen(false); setCurrentTime(0); }}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-white/5 transition-colors",
                                            activePersona.id === p.id ? "bg-cyan-500/10 relative" : ""
                                        )}
                                    >
                                        {activePersona.id === p.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-e" />}
                                        <span className="text-xl">{p.avatar}</span>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{t(p.name)}</div>
                                            <div className="text-[10px] text-gray-500 uppercase">{p.role}</div>
                                        </div>
                                        {activePersona.id === p.id && <Check className="w-4 h-4 text-cyan-400" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[600px]">

                {/* Left Column: Video & Timeline */}
                <div className="lg:col-span-8 flex flex-col gap-5">

                    {/* Video Player Container */}
                    <div className="relative bg-black rounded-2xl border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-1 min-h-[400px] group">

                        {/* Mock Video Feed Background (Empty room placeholder) */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0 flex items-center justify-center">
                            {/* In production, replace with <video ref={videoRef} src={...} /> */}
                            <div className="text-center opacity-30 text-white">
                                <User className="w-24 h-24 mx-auto mb-4 stroke-[1]" />
                                <p className="text-sm font-mono tracking-widest uppercase">Target Feed Offline / Simulated</p>
                            </div>
                        </div>

                        {/* ================= FORENSIC LAYER OVERLAY ================= */}
                        {showForensicLayer && (
                            <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500">
                                {/* Grid Pattern */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

                                {/* Target Reticle */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-cyan-500/30 rounded-full opacity-50 flex items-center justify-center">
                                    <div className="w-40 h-40 border border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute text-[8px] text-cyan-400 font-mono tracking-widest top-0 -translate-y-4">FACE_TRACK // ACTIVE</div>
                                </div>

                                {/* Mock MediaPipe Nodes (Simulated moving points) */}
                                <div className="absolute inset-x-[20%] inset-y-[10%] border-x border-cyan-500/10 flex justify-between px-10 items-center">
                                    <div className={clsx("w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-200", isHighStress ? "bg-red-500 text-red-500" : "bg-cyan-400 text-cyan-400")} />
                                    <div className={clsx("w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-200", isHighStress ? "bg-red-500 text-red-500" : "bg-cyan-400 text-cyan-400")} />
                                </div>
                                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 flex gap-4">
                                    <div className={clsx("h-px w-8 transition-colors duration-200", isHighStress ? "bg-red-500" : "bg-cyan-400/50")} />
                                </div>

                                {/* Live Diagnostic Overlay */}
                                <div className="absolute top-4 left-4 font-mono text-[10px] space-y-1">
                                    <div className="text-cyan-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                                        <span>R-PPG: {displayHeartRate.toFixed(1)} BPM</span>
                                    </div>
                                    <div className="text-gray-400">FRAME: {(currentTime * 24).toString().padStart(5, '0')}</div>
                                    <div className="text-gray-400">PUPIL_DILATION: {(isHighStress ? 6.2 : 4.1).toFixed(1)}MM</div>
                                </div>
                            </div>
                        )}
                        {/* ========================================================= */}

                        {/* Top controls */}
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <button
                                onClick={() => setShowForensicLayer(!showForensicLayer)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-1.5",
                                    showForensicLayer
                                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                                        : "bg-black/50 text-gray-400 border-white/10 hover:bg-white/10"
                                )}
                            >
                                <Radar className="w-3 h-3" />
                                {t('forensic_layer')}
                            </button>
                        </div>

                        {/* Bottom Video Controls */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center gap-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handlePlayPause} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors">
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                            </button>
                            <div className="text-xs font-mono text-white/80">
                                00:{(Math.floor(currentTime)).toString().padStart(2, '0')} / 01:00
                            </div>
                            <div className="flex-1" />
                            <Volume2 className="w-5 h-5 text-white/80 hover:text-white cursor-pointer" />
                            <Maximize className="w-5 h-5 text-white/80 hover:text-white cursor-pointer" />
                        </div>
                    </div>

                    {/* Synchronized Timeline (The Seismograph) */}
                    <div className="glass-panel p-4 rounded-2xl border border-white/5 h-48 flex flex-col">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">{t('stress_spike')} Seismograph</h3>
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded-full bg-cyan-500/50" /> Audio Wave</span>
                                <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Stress Heatmap</span>
                            </div>
                        </div>
                        <div className="flex-1 relative cursor-crosshair">
                            {/* Playhead Marker */}
                            <div
                                className="absolute top-0 bottom-0 w-px bg-yellow-400 z-10 pointer-events-none shadow-[0_0_10px_#facc15]"
                                style={{ left: `${(currentTime / 60) * 100}%` }}
                            >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-400" />
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <AreaChart data={SEISMIC_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} onClick={(e: any) => {
                                    if (e?.activePayload?.[0]?.payload?.time !== undefined) {
                                        handleSeek((e.activePayload[0].payload.time / 100) * 60);
                                    }
                                }}>
                                    <defs>
                                        <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                                        labelFormatter={(val) => `Time: ${Math.floor((val as number / 100) * 60)}s`}
                                    />
                                    {/* Stress/Deception Area */}
                                    <Area type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorStress)" isAnimationActive={false} />
                                    {/* Audio Waveform Area */}
                                    <Area type="step" dataKey="amplitude" stroke="#06b6d4" strokeWidth={1} fillOpacity={1} fill="url(#colorWave)" isAnimationActive={false} />
                                    {/* Add red zones for visual clarity */}
                                    <ReferenceLine x={30} stroke="rgba(239,68,68,0.2)" strokeWidth={20} />
                                    <ReferenceLine x={80} stroke="rgba(239,68,68,0.2)" strokeWidth={20} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar (Logs & Biometrics) */}
                <div className="lg:col-span-4 flex flex-col gap-5">

                    {/* The Verdict Panel */}
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-black/60 to-gray-900/60">
                        {/* Status glow */}
                        <div className={clsx(
                            "absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 transition-colors duration-1000",
                            isHighStress ? "bg-red-500/30" : "bg-emerald-500/20"
                        )} />

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <h4 className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">{t('trust_score')}</h4>
                                <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                    {isHighStress ? '42' : '87'}<span className="text-sm text-gray-400">%</span>
                                </div>
                                <div className={clsx(
                                    "text-[10px] uppercase font-bold mt-1 flex items-center gap-1",
                                    isHighStress ? "text-red-400" : "text-emerald-400"
                                )}>
                                    {isHighStress ? <AlertTriangle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                    {isHighStress ? t('deception_detected') : t('no_deception')}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">{t('toxic_meter')}</h4>
                                <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                    {isHighStress ? 'High' : 'Low'}
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className={clsx("h-full rounded-full transition-all duration-500", isHighStress ? "w-3/4 bg-red-500 shadow-[0_0_10px_#ef4444]" : "w-1/4 bg-cyan-400")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Biometric Widgets */}
                    <div className="grid grid-cols-3 gap-3">
                        <Widget title={t('heart_rate')} value={`${displayHeartRate.toFixed(0)} BPM`} icon={<Heart className="w-4 h-4 text-red-400" />} highlight={isHighStress} />
                        <Widget title={t('gaze_stability')} value={`${gazeStability.toFixed(1)}%`} icon={<Eye className="w-4 h-4 text-cyan-400" />} highlight={false} />
                        <Widget title={t('voice_jitter')} value={`${voiceJitter.toFixed(1)}ms`} icon={<Mic className="w-4 h-4 text-purple-400" />} highlight={isHighStress} />
                    </div>

                    {/* Live Transcript Log */}
                    <div className="glass-panel rounded-2xl border border-white/5 flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-cyan-500" /> Live Transcript Log
                            </h3>
                        </div>
                        <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {activeTranscript.map((log, idx) => {
                                const isActive = currentTime >= log.time && (idx === activeTranscript.length - 1 || currentTime < activeTranscript[idx + 1].time);
                                let typeColor = "text-gray-400 border-white/5 hover:bg-white/5";
                                let badgeColor = "";
                                let badgeText = "";

                                if (log.type === 'uncertain') {
                                    typeColor = "text-yellow-100/90 border-yellow-500/20 bg-yellow-500/5";
                                    badgeColor = "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
                                    badgeText = t('uncertainty');
                                } else if (log.type === 'deception') {
                                    typeColor = "text-red-100/90 border-red-500/20 bg-red-500/5";
                                    badgeColor = "bg-red-500/20 text-red-500 border-red-500/30";
                                    badgeText = t('high_deception_probability');
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={clsx(
                                            "p-3 rounded-xl border transition-all text-sm cursor-pointer relative",
                                            isActive ? "opacity-100 active-transcript shadow-[0_0_20px_rgba(255,255,255,0.05)] translate-x-1" : "opacity-60 hover:opacity-100",
                                            isActive && log.type === 'neutral' ? "text-white border-white/10 bg-white/5" : typeColor,
                                            log.speaker === "agent" ? "ml-4" : "mr-4"
                                        )}
                                        onClick={() => handleSeek(log.time)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
                                                {log.speaker === "agent" ? activePersona.name : "Target"}
                                            </span>
                                            <span className="text-[10px] font-mono text-cyan-500/70">00:{log.time.toString().padStart(2, '0')}</span>
                                        </div>
                                        <p className={isRtl ? "font-arabic" : ""}>{log.text}</p>

                                        {/* Status Badge */}
                                        {badgeText && (
                                            <div className="mt-2 text-start">
                                                <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border", badgeColor)}>
                                                    <AlertTriangle className="w-2.5 h-2.5" />
                                                    {badgeText}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Helper Widget Component
function Widget({ title, value, icon, highlight }: { title: string, value: string, icon: React.ReactNode, highlight: boolean }) {
    return (
        <div className={clsx(
            "glass-panel p-3 rounded-xl border flex flex-col justify-center gap-1 transition-colors duration-500",
            highlight ? "border-red-500/30 bg-red-500/5" : "border-white/5"
        )}>
            <div className="flex items-center gap-1.5 text-[9px] text-gray-500 uppercase font-black tracking-widest line-clamp-1">
                {icon} <span className="truncate">{title}</span>
            </div>
            <div className={clsx("text-lg font-black tracking-tight", highlight ? "text-red-400" : "text-white")}>
                {value}
            </div>
        </div>
    );
}
