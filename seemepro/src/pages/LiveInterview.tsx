import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, VideoOff, Crosshair, CheckCircle, Clock, Save, FileText, Camera, Download, Award, ArrowLeft, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useNavigate } from 'react-router-dom';

import { analyzeLiveFrameWithGeminiMetrics } from '../utils/liveAnalysisService';
import type { DetailedLiveAnalysis, LiveAnalysisContext } from '../utils/liveAnalysisService';
import { useAppStore } from '../store/useAppStore';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { useFaceMeshOverlay } from '../hooks/useFaceMeshOverlay';

const ANALYSIS_INTERVAL_MS = 15000;

interface DataPoint { time: number; stress: number; authenticity: number; engagement: number; integrity?: number; }

interface SessionConfig {
    candidateName: string;
    role: string;
    company: string;
    sessionType: 'مقابلة توظيف' | 'امتحان أونلاين' | 'تقييم أداء' | 'اختبار نزاهة';
    language: 'ar' | 'en';
    examMode: boolean;
    autoPDF: boolean;
    duration: 15 | 30 | 45 | 60;
}

// ── TV-style canvas overlay painter ────────────────────────────────────────
function paintOverlays(canvas: HTMLCanvasElement, analysis: DetailedLiveAnalysis) {
    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return;
    const ctx = ctxOrNull;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const ov = analysis.overlays;
    if (!ov) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
    ctx.restore();



    function drawLabel(x: number, y: number, text: string, color: string, side: 'left' | 'right' | 'top') {
        ctx.font = `bold ${Math.max(11, W * 0.012)}px 'Readex Pro', 'DIN Next LT Arabic', sans-serif`;
        const tw = ctx.measureText(text).width;
        const padX = 12;
        const bw = tw + padX * 2, bh = 24;

        let bx, by, px, py;
        if (side === 'left') { bx = x - bw - 50; by = y - bh / 2; px = bx + bw; py = by + bh / 2; }
        else if (side === 'right') { bx = x + 50; by = y - bh / 2; px = bx; py = by + bh / 2; }
        else { bx = x - bw / 2; by = y - bh - 50; px = bx + bw / 2; py = by + bh; }

        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px, py);
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(bx, by, 6, bh, [4, 0, 0, 4]); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(text, bx + bw / 2 + 3, by + 16);
    }

    const faceColor = ov.face?.stress_level === 'high' ? '#FF3B30' : (ov.face?.stress_level === 'medium' ? '#FF9F0A' : '#30D158');
    ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.28, W * 0.14, H * 0.22, 0, 0, Math.PI * 2);
    ctx.strokeStyle = faceColor; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.5 - 10, H * 0.28); ctx.lineTo(W * 0.5 + 10, H * 0.28);
    ctx.moveTo(W * 0.5, H * 0.28 - 10); ctx.lineTo(W * 0.5, H * 0.28 + 10);
    ctx.strokeStyle = `${faceColor}aa`; ctx.stroke();
    drawLabel(W * 0.64, H * 0.28, ov.face?.label || 'الوجه', faceColor, 'right');

    const eyeColor = ov.eyes?.color || '#FFD60A';
    [W * 0.43, W * 0.57].forEach(ex => {
        ctx.beginPath(); ctx.ellipse(ex, H * 0.24, W * 0.035, H * 0.025, 0, 0, Math.PI * 2);
        ctx.strokeStyle = eyeColor; ctx.lineWidth = 1.5; ctx.stroke();
    });
    drawLabel(W * 0.43, H * 0.22, ov.eyes?.label || 'العينان', eyeColor, 'top');
}

const LiveInterview = () => {
    const navigate = useNavigate();
    const { consumeCredit, watchAdForLive, user } = useAppStore();

    // Setup Wizard State
    const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 'live' | 'report'>(1);
    const [config, setConfig] = useState<SessionConfig>({
        candidateName: '', role: '', company: '', sessionType: 'مقابلة توظيف',
        language: 'ar', examMode: false, autoPDF: false, duration: 30
    });

    const [data, setData] = useState<DataPoint[]>([{ time: 0, stress: 0, authenticity: 100, engagement: 0, integrity: 100 }]);

    const [sessionId] = useState(() => `liv_${Date.now()}`);
    const [showAdModal, setShowAdModal] = useState(false);

    // AI Analysis State
    const [recentAnalysis, setRecentAnalysis] = useState<DetailedLiveAnalysis | null>(null);
    const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
    const [antiCheatAlerts, setAntiCheatAlerts] = useState<{ id: string, msg: string, time: string }[]>([]);
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // Aggregated Results for Report
    const [avgScores, setAvgScores] = useState({ confidence: 0, authenticity: 0, engagement: 0, calmness: 0, integrity: 100 });
    const [totalViolations, setTotalViolations] = useState(0);

    const videoStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const faceMeshCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<LiveAnalysisContext | null>(null);
    const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Derived stress from recentAnalysis for FaceMesh color coding
    const liveStress = recentAnalysis?.emotion_bar?.find(e => e.emotion === 'stress')?.intensity
        ?? recentAnalysis?.scores ? Math.max(0, 100 - (recentAnalysis?.scores?.calmness ?? 100)) : 0;
    const liveLabel = recentAnalysis?.emotion_bar?.[0]?.label ?? '';
    const liveConf = recentAnalysis?.scores?.confidence ?? 0;
    const liveAuth = recentAnalysis?.scores?.authenticity ?? 0;

    // Elapsed session timer
    useEffect(() => {
        if (setupStep !== 'live') return;
        const t = setInterval(() => setElapsedSecs(s => s + 1), 1000);
        return () => clearInterval(t);
    }, [setupStep]);

    // Real-time MediaPipe FaceMesh overlay on live camera
    useFaceMeshOverlay({
        videoRef,
        canvasRef: faceMeshCanvasRef,
        isActive: setupStep === 'live',
        candidateName: config.candidateName,
        role: config.role,
        elapsedSecs,
        analysisLabel: liveLabel,
        stressLevel: liveStress,
        confidence: liveConf,
        authenticity: liveAuth,
        mode: 'live',
        sessionId,
    });

    // Prevent scrolling when in wizard/report modal
    useEffect(() => {
        if (setupStep !== 'live') {
            document.body.style.overflow = 'auto'; // allow scroll for report
        } else {
            document.body.style.overflow = 'hidden'; // prevent scroll during live
        }
    }, [setupStep]);

    const processLiveSummary = useCallback(() => {
        const history = contextRef.current?.history || [];
        if (history.length === 0) return;

        const count = history.length;
        const confidence = history.reduce((acc, h) => acc + (h.scores?.confidence || 0), 0) / count;
        const authenticity = history.reduce((acc, h) => acc + (h.scores?.authenticity || 0), 0) / count;
        const engagement = history.reduce((acc, h) => acc + (h.scores?.engagement || 0), 0) / count;
        const calmness = history.reduce((acc, h) => acc + (h.scores?.calmness || 0), 0) / count;

        let integrity = 100;
        if (config.examMode) {
            integrity = Math.max(0, 100 - (totalViolations * 15));
        }

        setAvgScores({
            confidence: Math.round(confidence),
            authenticity: Math.round(authenticity),
            engagement: Math.round(engagement),
            calmness: Math.round(calmness),
            integrity: Math.round(integrity)
        });
    }, [config.examMode, totalViolations]);

    const stopCamera = useCallback(() => {
        if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
        videoStreamRef.current?.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsAnalyzingFrame(false);
        processLiveSummary();
        setSetupStep('report');
    }, [processLiveSummary]);

    const processAnalysisResult = useCallback(async (result: DetailedLiveAnalysis) => {
        setRecentAnalysis(result);

        const oc = overlayCanvasRef.current;
        const vid = videoRef.current;
        if (oc && vid) {
            oc.width = vid.offsetWidth || 1280;
            oc.height = vid.offsetHeight || 720;
            paintOverlays(oc, result);
        }

        let currentIntegrity = 100;
        const newAlerts: { id: string, msg: string, time: string }[] = [];

        if (config.examMode) {
            const cheatSignals = result.ai_detection?.signals;
            const violations = result.exam_violations || [];

            if (cheatSignals) {
                if (cheatSignals.reading_eye_movement?.detected) newAlerts.push({ id: Math.random().toString(), msg: "EYE_TRACK_ANOMALY", time: result.session.timestamp });
                if (cheatSignals.gaze_displacement?.detected) newAlerts.push({ id: Math.random().toString(), msg: "GAZE_DISPLACEMENT", time: result.session.timestamp });
                if (cheatSignals.thinking_face_absent?.detected) newAlerts.push({ id: Math.random().toString(), msg: "ABSENT_THINKING_CUES", time: result.session.timestamp });
            }

            violations.forEach(v => {
                if (v.detected) {
                    newAlerts.push({ id: Math.random().toString(), msg: v.type.toUpperCase(), time: result.session.timestamp });
                }
            });

            if (newAlerts.length > 0) {
                setTotalViolations(prev => prev + newAlerts.length);
                setAntiCheatAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10
            }

            currentIntegrity = result.integrity_score ?? Math.max(0, 100 - (totalViolations * 15));
        }

        setData(prev => {
            const point: DataPoint = {
                time: result.session.frame_number,
                stress: result.emotion_bar?.find(e => e.emotion === 'stress')?.intensity || 0,
                authenticity: result.scores?.authenticity || 0,
                engagement: result.scores?.engagement || 0,
                integrity: config.examMode ? currentIntegrity : undefined
            };
            const updated = [...prev, point];
            return updated.length > 30 ? updated.slice(1) : updated;
        });

    }, [config.examMode, totalViolations]);

    const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, frameRate: 30, facingMode: facing },
                audio: true,
            });
            videoStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try { await videoRef.current.play(); } catch (_) { }
            }

            contextRef.current = { sessionId, startTimeMs: Date.now(), framesProcessed: 0, history: [] };

            frameIntervalRef.current = setInterval(async () => {
                if (!videoRef.current || !contextRef.current || isAnalyzingFrame) return;
                try {
                    setIsAnalyzingFrame(true);
                    contextRef.current.framesProcessed += 1;
                    const res = await analyzeLiveFrameWithGeminiMetrics(contextRef.current, config.examMode);
                    contextRef.current.history.push({ scores: res.scores, baseline: res.baseline, emotion_bar: res.emotion_bar });
                    if (contextRef.current.history.length > 30) contextRef.current.history.shift();
                    processAnalysisResult(res);
                } catch (e) {
                    console.error('Frame failed', e);
                } finally {
                    setIsAnalyzingFrame(false);
                }
            }, ANALYSIS_INTERVAL_MS);

        } catch (err) {
            console.warn('Camera access denied:', err);
        }
    }, [sessionId, isAnalyzingFrame, processAnalysisResult, config.examMode, facingMode]);

    const handleStartLive = async () => {
        const hasCredit = consumeCredit('live');
        if (!hasCredit) { setShowAdModal(true); return; }
        setSetupStep('live');
        setElapsedSecs(0);
        await startCamera(facingMode);
    };

    const handleCameraToggle = async () => {
        const newFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);
        if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
        videoStreamRef.current?.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
        await startCamera(newFacing);
    };

    const handleSaveToHR = () => {
        const existing = JSON.parse(localStorage.getItem('seemepro_sessions') || '[]');
        const report = {
            id: sessionId,
            candidateName: config.candidateName,
            role: config.role,
            company: config.company,
            sessionType: config.sessionType,
            date: new Date().toISOString(),
            duration: config.duration,
            grade: (avgScores.authenticity + avgScores.integrity) / 2 > 80 ? 'A' : (avgScores.authenticity + avgScores.integrity) / 2 > 60 ? 'B' : 'C',
            scores: avgScores,
            examMode: config.examMode,
            violations: totalViolations,
            status: totalViolations > 3 ? 'failed' : totalViolations > 0 ? 'flagged' : 'passed'
        };
        localStorage.setItem('seemepro_sessions', JSON.stringify([report, ...existing]));
        navigate('/hr');
    };

    // ─── SETUP WIZARD ───────────────────────────────────────────────────────
    if (setupStep === 1 || setupStep === 2 || setupStep === 3) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] w-full" dir="rtl">
                <div className="glass-card max-w-2xl w-full p-8 rounded-3xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl relative overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            ⚙️ إعداد الجلسة <span className="text-cyan-400 font-light hidden sm:inline">- الخطوة {setupStep} من 3</span>
                        </h2>
                        <div className="font-mono text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">V4.0_READY</div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/10 rounded-full mb-8">
                        <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${(setupStep / 3) * 100}%` }}></div>
                    </div>

                    {/* Step 1: Info */}
                    {setupStep === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">اسم المرشح</label>
                                <input type="text" value={config.candidateName} onChange={e => setConfig({ ...config, candidateName: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white transition-all outline-none"
                                    placeholder="أحمد يوسف..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">المسمى الوظيفي</label>
                                    <input type="text" value={config.role} onChange={e => setConfig({ ...config, role: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none" placeholder="مهندس برمجيات..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">الشركة</label>
                                    <input type="text" value={config.company} onChange={e => setConfig({ ...config, company: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none" placeholder="TechVision..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">نوع الجلسة</label>
                                <select value={config.sessionType} onChange={e => setConfig({ ...config, sessionType: e.target.value as any })}
                                    className="w-full bg-black/30 border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none">
                                    <option>مقابلة توظيف</option>
                                    <option>امتحان أونلاين</option>
                                    <option>تقييم أداء</option>
                                    <option>اختبار نزاهة</option>
                                </select>
                            </div>
                            <button onClick={() => setSetupStep(2)} disabled={!config.candidateName} className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all uppercase tracking-wider">
                                التالي
                            </button>
                        </div>
                    )}

                    {/* Step 2: Options */}
                    {setupStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setConfig({ ...config, examMode: !config.examMode })}>
                                <div className={`w-6 h-6 rounded flex items-center justify-center border ${config.examMode ? 'bg-cyan-500 border-cyan-400' : 'border-gray-500'}`}>
                                    {config.examMode && <CheckCircle className="w-4 h-4 text-black" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-orange-400 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Exam Anti-Cheat Mode</h4>
                                    <p className="text-xs text-gray-400">تفعيل كشف الشاشة الثانية، حركة العين غير الطبيعية، والتبديل بين النوافذ.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setConfig({ ...config, autoPDF: !config.autoPDF })}>
                                <div className={`w-6 h-6 rounded flex items-center justify-center border ${config.autoPDF ? 'bg-cyan-500 border-cyan-400' : 'border-gray-500'}`}>
                                    {config.autoPDF && <CheckCircle className="w-4 h-4 text-black" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> توليد تقرير PDF تلقائياً</h4>
                                    <p className="text-xs text-gray-400">تجهيز التقرير المعمق فور انتهاء الجلسة للطباعة أو الإرسال للموارد البشرية.</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">مدة الجلسة (دقائق)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[15, 30, 45, 60].map(d => (
                                        <button key={d} onClick={() => setConfig({ ...config, duration: d as any })}
                                            className={`py-2 rounded-lg border ${config.duration === d ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-white/10 text-gray-500 hover:text-white'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setSetupStep(1)} className="w-1/3 border border-white/10 hover:bg-white/5 text-gray-300 font-bold py-3 rounded-xl transition-all">عودة</button>
                                <button onClick={() => setSetupStep(3)} className="w-2/3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all uppercase tracking-wider">التالي</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Pre-flight */}
                    {setupStep === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-black/40 p-5 rounded-xl border border-cyan-500/30">
                                <h3 className="text-lg font-black text-white mb-4 border-b border-white/10 pb-2">تفاصيل الإطلاق</h3>
                                <ul className="space-y-2 text-sm text-gray-300 font-mono">
                                    <li className="flex justify-between"><span>المرشح:</span> <span className="text-cyan-400">{config.candidateName}</span></li>
                                    <li className="flex justify-between"><span>الدور:</span> <span>{config.role} @ {config.company}</span></li>
                                    <li className="flex justify-between"><span>نوع التحليل:</span> <span>{config.sessionType}</span></li>
                                    <li className="flex justify-between"><span>المدة المقدرة:</span> <span>{config.duration} دقيقة</span></li>
                                    <li className="flex justify-between"><span>وضع مكافحة الغش:</span> <span className={config.examMode ? 'text-red-400' : 'text-green-400'}>{config.examMode ? 'مُفَعَّل' : 'مُعَطَّل'}</span></li>
                                </ul>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setSetupStep(2)} className="w-1/3 border border-white/10 hover:bg-white/5 text-gray-300 font-bold py-3 rounded-xl transition-all">عودة</button>
                                <button onClick={handleStartLive} className="w-2/3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-3 rounded-xl transition-all uppercase shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 flex justify-center items-center gap-2">
                                    <Camera className="w-5 h-5" /> بدء البث المباشر
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <RewardedAdModal
                    isOpen={showAdModal}
                    feature="live"
                    adsWatched={user.liveAdsWatched}
                    adsNeeded={5}
                    onClose={() => setShowAdModal(false)}
                    onComplete={async () => {
                        const unlocked = watchAdForLive();
                        setShowAdModal(false);
                        if (unlocked) {
                            setSetupStep('live');
                            await startCamera();
                        }
                    }}
                />
            </div>
        );
    }

    // ─── LIVE HUD ───────────────────────────────────────────────────────────
    if (setupStep === 'live') {
        const riskLevel = recentAnalysis?.ai_detection?.overall_risk || 'clean';

        return (
            <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col font-mono" dir="rtl">

                {/* Top Bar HUD */}
                <div className="h-14 bg-black/80 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-widest text-lg">
                            <Activity className="w-5 h-5 animate-pulse" /> LIVE_SYNC
                        </div>
                        <div className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 flex items-center gap-1 rounded border border-white/5">
                            ID: <span className="text-gray-300">{sessionId}</span>
                        </div>
                        {config.examMode && (
                            <div className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                                <ShieldAlert className="w-3 h-3" /> EXAM MODE ACTIVE
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-cyan-500" />
                            {recentAnalysis?.session?.timestamp || '00:00'}
                        </div>
                        <button onClick={stopCamera} className="bg-red-600/20 hover:bg-red-600 border border-red-500/50 text-red-500 hover:text-white px-6 py-1.5 rounded font-bold text-xs tracking-widest transition-all uppercase flex items-center gap-2">
                            <VideoOff className="w-4 h-4" /> إنهاء الجلسة
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left/Center: Video Feed */}
                    <div className="flex-1 relative bg-black flex flex-col items-center justify-center p-4">
                        <div className={`relative w-full max-h-full aspect-video bg-[#0a0a0c] border rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-700 ${riskLevel === 'alert' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'border-white/10'}`}>
                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
                            {/* AI analysis overlay (painted per AI result) */}
                            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />
                            {/* Real-time MediaPipe FaceMesh cinematic overlay */}
                            <canvas ref={faceMeshCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-25" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mix-blend-screen z-10" />

                            {/* Alert Flash */}
                            {riskLevel === 'alert' && (
                                <div className="absolute inset-0 border-[4px] border-red-500/50 bg-red-500/10 pointer-events-none z-30 animate-pulse flex flex-col items-center justify-end pb-20">
                                    <div className="bg-red-600 text-white font-black uppercase tracking-widest px-6 py-2 rounded-sm text-2xl border border-white">
                                        VIOLATION DETECTED
                                    </div>
                                </div>
                            )}

                            {/* Calibration Indicator */}
                            {recentAnalysis && !recentAnalysis.baseline?.established && (
                                <div className="absolute top-4 inset-x-0 flex justify-center z-40 pointer-events-none">
                                    <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/50 px-4 py-1.5 rounded-full text-[10px] text-cyan-400 flex items-center gap-2">
                                        <Activity className="w-3 h-3 animate-spin" /> CALIBRATING BASELINE ({recentAnalysis.baseline?.progress_pct || 0}%)
                                    </div>
                                </div>
                            )}

                            {/* Emotion Bar Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/85 flex flex-row-reverse overflow-hidden z-40 border-t border-white/10">
                                {recentAnalysis?.emotion_bar?.map((em, i) => {
                                    const flexBasis = Math.max(em.intensity, 5);
                                    return (
                                        <div key={i} className={`h-full relative transition-all duration-1000 border-l border-black flex items-center justify-center shrink-0 ${em.dominant ? 'bg-white/10' : ''}`} style={{ width: `${flexBasis}%`, backgroundColor: `${em.color}20` }}>
                                            <div className="absolute top-0 right-0 w-full h-0.5" style={{ backgroundColor: em.color }} />
                                            <span className="font-bold text-[8px] uppercase tracking-widest px-1 truncate mix-blend-plus-lighter" style={{ color: em.color }}>{em.label} {em.intensity}%</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Loading reticle */}
                            {isAnalyzingFrame && <div className="absolute top-4 right-4 z-40"><Crosshair className="w-5 h-5 text-cyan-400 animate-[spin_2s_linear_infinite] opacity-60" /></div>}
                            {/* Camera flip button (mobile) */}
                            <button
                                onClick={handleCameraToggle}
                                className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-black/50 border border-white/20 text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-white/20 transition flex items-center gap-1"
                                title="تبديل الكاميرا"
                            >
                                <Camera className="w-3 h-3" /> {facingMode === 'user' ? '🤳 أمامية' : '📷 خلفية'}
                            </button>
                        </div>

                        {/* Chart below video */}
                        <div className="w-full h-24 mt-4 bg-black/40 border border-white/10 rounded-lg p-2 overflow-hidden shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={{ fill: '#6b7280', fontSize: 9 }} width={20} />
                                    <Area type="monotone" dataKey="authenticity" stroke="#147EFF" fill="#147EFF" fillOpacity={0.2} strokeWidth={1.5} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="stress" stroke="#FF9F0A" fill="#FF9F0A" fillOpacity={0.2} strokeWidth={1.5} isAnimationActive={false} />
                                    {config.examMode && <Area type="step" dataKey="integrity" stroke="#30D158" fill="none" strokeWidth={1.5} isAnimationActive={false} />}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Mini Panel */}
                    <div className="hidden lg:flex w-80 bg-black/60 border-l border-white/10 flex-col divide-y divide-white/5 shrink-0 overflow-y-auto stylish-scrollbar">
                        {/* Session Metadata */}
                        <div className="p-4 bg-white/5">
                            <div className="text-xs text-gray-400 mb-1 leading-tight"><span className="text-cyan-400">CANDIDATE:</span> {config.candidateName}</div>
                            <div className="text-[10px] text-gray-500">{config.role} @ {config.company}</div>
                        </div>

                        {/* Scores */}
                        <div className="p-4 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-[8px] text-gray-500 tracking-widest uppercase">Confidence</div>
                                <div className="text-xl font-bold text-cyan-400">{recentAnalysis?.scores?.confidence || '--'}%</div>
                            </div>
                            <div>
                                <div className="text-[8px] text-gray-500 tracking-widest uppercase">Authenticity</div>
                                <div className="text-xl font-bold text-blue-400">{recentAnalysis?.scores?.authenticity || '--'}%</div>
                            </div>
                        </div>

                        {/* Exam Mode Alerts */}
                        {config.examMode && (
                            <div className="flex-1 p-4 bg-red-900/10 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-red-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> EXAM ALERTS</div>
                                    <div className="text-[10px] bg-red-500/20 text-red-500 px-1.5 rounded">{totalViolations} FLAGS</div>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                    <AnimatePresence>
                                        {antiCheatAlerts.map(a => (
                                            <motion.div key={a.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                                className="bg-red-500/10 border border-red-500/30 p-2 rounded flex flex-col gap-1">
                                                <div className="text-[10px] font-bold text-red-400 break-words leading-tight">{a.msg.replace(/_/g, ' ')}</div>
                                                <div className="text-[8px] text-red-500/50">{a.time}</div>
                                            </motion.div>
                                        ))}
                                        {antiCheatAlerts.length === 0 && (
                                            <div className="text-[10px] text-green-500/50 italic text-center mt-4">No violations detected</div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* AI Detection Signals */}
                        {!config.examMode && (
                            <div className="p-4">
                                <div className="text-[10px] font-bold text-gray-500 mb-3">AI PROBABILITY METRICS</div>
                                <div className="space-y-3">
                                    {[
                                        { l: 'Gaze Dispersion', v: recentAnalysis?.ai_detection?.signals?.gaze_displacement?.confidence || 0 },
                                        { l: 'Prosody Sync', v: recentAnalysis?.ai_detection?.signals?.prosody_mismatch?.confidence || 0 },
                                        { l: 'Response Timing', v: recentAnalysis?.ai_detection?.signals?.response_timing?.confidence || 0 }
                                    ].map((s, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-[9px] mb-1">
                                                <span className="text-gray-400">{s.l}</span>
                                                <span className={s.v > 50 ? 'text-red-400' : 'text-green-400'}>{s.v}%</span>
                                            </div>
                                            <div className="h-0.5 bg-white/5 w-full rounded"><div className={`h-full ${s.v > 50 ? 'bg-red-500' : 'bg-green-500'} transition-all`} style={{ width: `${s.v}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FACS Log */}
                        <div className="p-4 pb-8 border-t border-white/5 flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-gray-500">FACIAL MICRO-EXPRESSIONS</div>
                            {recentAnalysis?.facs_detected?.map((f: any, i: number) => (
                                <div key={i} className="text-[10px] bg-white/5 p-1.5 rounded flex justify-between text-gray-400">
                                    <span className="text-purple-400 font-bold">{f.au}</span> <span>{f.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-3 flex justify-around z-[110]">
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Confidence</div>
                        <div className="text-sm font-bold text-cyan-400">{recentAnalysis?.scores?.confidence || '--'}%</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Authenticity</div>
                        <div className="text-sm font-bold text-blue-400">{recentAnalysis?.scores?.authenticity || '--'}%</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500">AI Risk</div>
                        <div className={`text-sm font-bold ${recentAnalysis?.ai_detection?.overall_risk === 'clean' ? 'text-green-400' : 'text-red-400'}`}>
                            {recentAnalysis?.ai_detection?.overall_risk?.toUpperCase() || 'CLEAN'}
                        </div>
                    </div>
                    <button onClick={stopCamera} className="bg-red-600/30 border border-red-500/50 text-red-400 px-4 py-1.5 rounded-lg text-xs font-bold">
                        ⏹ إنهاء
                    </button>
                </div>
            </div>
        );
    }

    // ─── POST-SESSION REPORT ────────────────────────────────────────────────
    if (setupStep === 'report') {
        const grade = (avgScores.authenticity + avgScores.integrity) / 2 > 80 ? 'A' : (avgScores.authenticity + avgScores.integrity) / 2 > 60 ? 'B' : 'C';
        const isExamPassed = totalViolations <= 3 && avgScores.integrity >= 60;

        const radarData = [
            { subject: 'Confidence', A: avgScores.confidence, fullMark: 100 },
            { subject: 'Authenticity', A: avgScores.authenticity, fullMark: 100 },
            { subject: 'Engagement', A: avgScores.engagement, fullMark: 100 },
            { subject: 'Calmness', A: avgScores.calmness, fullMark: 100 },
            { subject: 'Integrity', A: avgScores.integrity, fullMark: 100 },
        ];

        return (
            <div className="min-h-screen bg-black w-full p-4 sm:p-8 font-sans" dir="rtl">
                <div className="max-w-[1000px] mx-auto bg-white rounded-xl overflow-hidden shadow-2xl printable-report">

                    {/* Header */}
                    <div className="bg-[#0f1115] p-8 text-white flex justify-between items-center border-b-4 border-cyan-500">
                        <div>
                            <h1 className="text-3xl font-black mb-1">التقرير التحليلي الشامل</h1>
                            <p className="text-gray-400 font-mono text-sm tracking-widest">{sessionId}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-cyan-400">{config.candidateName}</h2>
                            <p className="text-sm text-gray-400">{config.role} @ {config.company}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}</p>
                        </div>
                    </div>

                    <div className="p-8 text-black grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Column 1: Grades & Radar */}
                        <div className="md:col-span-1 flex flex-col gap-6">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Overall Grade</p>
                                <div className={`text-6xl font-black ${grade === 'A' ? 'text-green-500' : grade === 'B' ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {grade}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">{config.sessionType}</span>
                                    {config.examMode && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-bold">EXAM MODE</span>}
                                </div>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Candidate" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Column 2: Detailed Scores & Integrity */}
                        <div className="md:col-span-2 flex flex-col gap-6">

                            {/* Score Bars */}
                            <div>
                                <h3 className="text-lg font-black border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-cyan-500" /> مؤشرات الأداء الحيوية
                                </h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <ScoreBar label="الثقة والتأثير" val={avgScores.confidence} color="bg-cyan-500" />
                                    <ScoreBar label="المصداقية والأصالة" val={avgScores.authenticity} color="bg-blue-500" />
                                    <ScoreBar label="الهدوء تحت الضغط" val={avgScores.calmness} color="bg-green-500" />
                                    <ScoreBar label="التفاعل والتركيز" val={avgScores.engagement} color="bg-purple-500" />
                                </div>
                            </div>

                            {/* Exam Integrity Section */}
                            {config.examMode && (
                                <div className={`border-2 rounded-xl p-5 ${isExamPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                    <h3 className={`text-lg font-black flex items-center gap-2 mb-3 ${isExamPassed ? 'text-green-700' : 'text-red-700'}`}>
                                        <ShieldCheckIcon passed={isExamPassed} /> فحص النزاهة (Exam Integrity)
                                    </h3>

                                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-100">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 font-bold">مؤشر النزاهة</p>
                                            <p className={`text-2xl font-black ${avgScores.integrity > 80 ? 'text-green-600' : 'text-red-600'}`}>{avgScores.integrity}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 font-bold">المخالفات المرصودة</p>
                                            <p className={`text-2xl font-black ${totalViolations === 0 ? 'text-green-600' : 'text-red-600'}`}>{totalViolations}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 font-bold">القرار</p>
                                            <p className={`text-xl font-black ${isExamPassed ? 'text-green-600' : 'text-red-600'}`}>{isExamPassed ? 'سليم ✅' : 'مرفوض ❌'}</p>
                                        </div>
                                    </div>

                                    {totalViolations > 0 && (
                                        <div className="bg-white border text-sm border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                                            {antiCheatAlerts.slice(0, 5).map((a, i) => (
                                                <div key={i} className="flex justify-between border-b border-gray-100 last:border-0 py-1 text-red-600">
                                                    <span className="font-bold">{a.msg.replace(/_/g, ' ')}</span>
                                                    <span className="text-gray-400 font-mono text-xs">{a.time}</span>
                                                </div>
                                            ))}
                                            {totalViolations > 5 && <div className="text-center mt-2 text-gray-500 text-xs">+ {totalViolations - 5} مخالفات أخرى مسجلة</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Behavioral Summary */}
                            <div>
                                <h3 className="text-lg font-black border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-500" /> التحليل السلوكي
                                </h3>
                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-700 leading-relaxed shadow-sm">
                                    {recentAnalysis?.ai_detection?.assessment || "لم يتم تسجيل بيانات سلوكية كافية لتكوين تقرير سردي عن المرشح."}
                                    <br /><br />
                                    <span className="font-bold">التوصية:</span> {recentAnalysis?.ai_detection?.recommended_action || "اتخاذ القرار بناءً على الدرجات الموضحة أعلاه."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer Footer inside print */}
                    <div className="bg-gray-100 p-4 text-center text-[10px] text-gray-400 border-t border-gray-200">
                        This document is auto-generated by SeeMePro Live Engine v4.0. The analysis provides behavioral insights and structural alerts but should supplement, not replace, human judgment.
                    </div>
                </div>

                {/* Floating Actions Strip */}
                <div className="max-w-[1000px] mx-auto mt-6 flex justify-between gap-4 do-not-print">
                    <button onClick={() => navigate('/live')} className="px-6 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> جلسة جديدة
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => window.print()} className="px-6 py-3 rounded-xl bg-white text-black font-black hover:bg-gray-200 transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <Download className="w-5 h-5" /> تصدير PDF
                        </button>
                        <button onClick={handleSaveToHR} className="px-6 py-3 rounded-xl bg-cyan-600 text-white font-black hover:bg-cyan-500 transition flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                            <Save className="w-5 h-5" /> حفظ في لوحة الموارد البشرية
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

// Helper Components
const ScoreBar = ({ label, val, color }: { label: string, val: number, color: string }) => (
    <div>
        <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-gray-700">{label}</span>
            <span className="text-gray-900">{val}%</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${val}%` }} />
        </div>
    </div>
);

const ShieldCheckIcon = ({ passed }: { passed: boolean }) => (
    passed ? <Award className="w-5 h-5 text-green-600" /> : <ShieldAlert className="w-5 h-5 text-red-600" />
);

export default LiveInterview;
