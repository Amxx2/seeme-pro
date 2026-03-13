import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ScanFace, Upload, Activity, Award, AlertCircle, CheckCircle, Briefcase, Zap, Camera, X, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { analyzeVideoFrameWithOpenAI, analyzeVideoWithOpenAI } from '../utils/videoAnalysisService';
import type { DetailedVideoAnalysis } from '../utils/videoAnalysisService';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { supabase } from '../config/supabase';

// ── TV-Style Cinematic Forensic Canvas Overlay Painter ──────────────────────────
function paintVideoOverlays(canvas: HTMLCanvasElement, result: DetailedVideoAnalysis) {
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    if (W === 0 || H === 0) return;

    ctx.clearRect(0, 0, W, H);

    if (!result?.zones) return;
    const z = result.zones;

    // Scanline effect
    const scanY = (Date.now() / 8) % H;
    ctx.fillStyle = 'rgba(0,255,212,0.035)';
    ctx.fillRect(0, scanY, W, 3);

    // Helper: draw filled glowing ellipse
    function drawZone(cx: number, cy: number, rx: number, ry: number, color: string) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = color + '33'; // 20% opacity fill
        ctx.fill();
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Helper: TV forensic label with pointer line
    function drawLabel(fromX: number, fromY: number, toX: number, toY: number, lines: string[], color: string) {
        // Pointer line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color + 'aa';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dot at zone
        ctx.beginPath();
        ctx.arc(fromX, fromY, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label box
        ctx.font = `bold ${Math.max(10, W * 0.013)}px monospace`;
        const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
        const bw = maxW + 20, bh = lines.length * 16 + 12;
        const bx = toX - bw / 2, by = toY - bh / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 4);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(bx, by, 5, bh, [4, 0, 0, 4]);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 4);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        lines.forEach((line, i) => {
            ctx.fillText(line, bx + bw / 2 + 3, by + 14 + i * 16);
        });
        ctx.textAlign = 'left';
    }

    // Corner brackets helper
    function drawCorners(x: number, y: number, w: number, h: number, color: string) {
        const len = 14;
        ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]].forEach(([px, py, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(px as number, (py as number) + (dy as number) * len);
            ctx.lineTo(px as number, py as number);
            ctx.lineTo((px as number) + (dx as number) * len, py as number);
            ctx.stroke();
        });
    }

    // DRAW ALL ZONES
    const faceColor = z.face?.overlay_color || '#FF9F0A';
    drawZone(W * 0.5, H * 0.27, W * 0.13, H * 0.21, faceColor);
    drawCorners(W * 0.5 - W * 0.13, H * 0.27 - H * 0.21, W * 0.26, H * 0.42, faceColor);
    drawLabel(W * 0.63, H * 0.27, W * 0.82, H * 0.2, ['الوجه', z.face?.label || ''], faceColor);

    const eyeColor = z.eyes?.overlay_color || '#FFD60A';
    drawZone(W * 0.43, H * 0.225, W * 0.032, H * 0.022, eyeColor);
    drawZone(W * 0.57, H * 0.225, W * 0.032, H * 0.022, eyeColor);
    drawLabel(W * 0.5, H * 0.18, W * 0.5, H * 0.07, ['العيون', z.eyes?.label || ''], eyeColor);

    const mouthColor = z.mouth?.overlay_color || '#FF3B30';
    drawZone(W * 0.5, H * 0.375, W * 0.048, H * 0.022, mouthColor);
    drawLabel(W * 0.55, H * 0.375, W * 0.78, H * 0.375, ['الفم', z.mouth?.label || ''], mouthColor);

    const shoulderColor = z.shoulders?.overlay_color || '#147EFF';
    ctx.save(); ctx.strokeStyle = shoulderColor; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(W * 0.22, H * 0.44, W * 0.56, H * 0.22);
    ctx.restore();
    drawLabel(W * 0.22, H * 0.55, W * 0.08, H * 0.55, ['الكتفان', z.shoulders?.label || ''], shoulderColor);

    const handColor = z.hands?.overlay_color || '#30D158';
    drawZone(W * 0.28, H * 0.74, W * 0.07, H * 0.09, handColor);
    drawZone(W * 0.72, H * 0.74, W * 0.07, H * 0.09, handColor);
    drawLabel(W * 0.28, H * 0.74, W * 0.1, H * 0.78, ['اليدان', z.hands?.label || ''], handColor);

    const bodyColor = z.fullbody?.overlay_color || '#FFD60A';
    ctx.save(); ctx.strokeStyle = bodyColor; ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]); ctx.globalAlpha = 0.5;
    ctx.strokeRect(W * 0.1, H * 0.02, W * 0.8, H * 0.95);
    ctx.restore();
    drawCorners(W * 0.1, H * 0.02, W * 0.8, H * 0.95, bodyColor);

    // SCORE BARS bottom-left
    const scores = result.scores;
    if (scores) {
        [
            { label: 'CONF', val: scores.confidence, color: '#00FFD4' },
            { label: 'AUTH', val: scores.authenticity, color: '#30D158' },
            { label: 'CALM', val: scores.calmness, color: '#147EFF' },
        ].forEach(({ label, val, color }, i) => {
            const bx = 12, by = H - 85 + i * 26;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.beginPath(); ctx.roundRect(bx, by, 150, 22, 4); ctx.fill();
            ctx.strokeStyle = color; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(bx, by, 150, 22, 4); ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = `bold 10px monospace`;
            ctx.textAlign = 'left';
            ctx.fillText(`${label} ${val || 0}%`, bx + 8, by + 15);
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.beginPath(); ctx.roundRect(bx + 85, by + 7, 55, 8, 3); ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(bx + 85, by + 7, 55 * ((val || 0) / 100), 8, 3); ctx.fill();
        });
    }

    // EMOTION BAR bottom
    if (result.emotion_bar?.length) {
        const barH = 32, barY = H - barH;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, barY, W, barH);
        let xOff = 0;
        result.emotion_bar.forEach(em => {
            const segW = (em.intensity / 100) * W * 0.6;
            ctx.fillStyle = em.color + '40';
            ctx.fillRect(xOff, barY, segW, barH);
            ctx.fillStyle = em.color;
            ctx.fillRect(xOff, barY, segW, 2);
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = em.color;
            ctx.fillText(`${em.label} ${em.intensity}%`, xOff + 6, barY + 20);
            xOff += segW + 4;
        });
    }

    // TOP-RIGHT timestamp
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W - 180, 8, 172, 36);
    ctx.fillStyle = '#00FFD4';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`FORENSIC FEED`, W - 14, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(result.timestamp || '00:02', W - 14, 38);

    // REC dot
    ctx.beginPath();
    ctx.arc(W - 170, 20, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FF3B30';
    ctx.shadowBlur = 8; ctx.shadowColor = '#FF3B30';
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ── Video Report Modal ────────────────────────────────────────────────────────
const VideoReportModal = ({ result, onClose }: { result: DetailedVideoAnalysis | null, onClose: () => void }) => {
    if (!result) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto stylish-scrollbar bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl z-10"
                >
                    <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white z-20">
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="p-8 border-b border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-teal-400 to-blue-500"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full"></div>

                        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                            <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-2xl border border-white/10 min-w-[140px]">
                                <Award className="w-10 h-10 text-purple-400 mb-2 opacity-80" />
                                <span className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">التقييم العام</span>
                                <span className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">{result.overall_grade}</span>
                            </div>

                            <div className="flex flex-col gap-3 flex-1">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                        تقرير التحليل السلوكي
                                        <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-mono text-purple-300">ID: {result.session_id}</span>
                                    </h2>
                                    <p className="text-sm text-gray-400 font-mono tracking-widest">{result.timestamp} • FORENSIC AI SCAN</p>
                                </div>
                                <p className="text-gray-300 leading-relaxed text-sm md:text-base border-r-4 border-purple-500 pr-4 mt-2">
                                    {result.analysis.summary}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col gap-8">
                        {/* Summary Scores */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: 'الثقة', score: result.scores.confidence, color: '#00FFD4' },
                                { label: 'المصداقية', score: result.scores.authenticity, color: '#30D158' },
                                { label: 'التفاعل', score: result.scores.engagement, color: '#147EFF' },
                                { label: 'الهدوء', score: result.scores.calmness, color: '#FFD60A' },
                                { label: 'التطابق', score: result.scores.congruence, color: '#FF9F0A' },
                            ].map((s, i) => (
                                <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</div>
                                    <div className="text-3xl font-bold text-white mb-2">{s.score}<span className="text-sm text-gray-500">/100</span></div>
                                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* FACS & Body Language */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2"><ScanFace className="text-blue-400" /> الإشارات الحيوية المرصودة</h3>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">وحدات حركة الوجه (FACS)</h4>
                                    {result.facs_detected?.map((facs, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded">{facs.au}</span>
                                                <span className="text-sm text-gray-200">{facs.meaning}</span>
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono">INT: {facs.intensity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 mt-6">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">لغة الجسد</h4>
                                    {result.body_language?.map((bl, i) => (
                                        <div key={i} className="flex flex-col bg-white/5 p-3 rounded-lg border border-white/5 gap-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-gray-400 uppercase tracking-wider">{bl.zone}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded ${bl.status === 'good' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                    {bl.status}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-100 font-bold">{bl.observation}</span>
                                            <span className="text-xs text-gray-400">{bl.detail}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Strengths & Concerns & Tips */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2"><Briefcase className="text-green-400" /> التقييم والنصائح</h3>

                                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                                    <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> نقاط القوة</h4>
                                    <ul className="space-y-2">
                                        {result.analysis.strengths?.map((s, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span>{s}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
                                    <h4 className="font-bold text-orange-400 mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> مجالات التحسين</h4>
                                    <ul className="space-y-2">
                                        {result.analysis.areas_of_concern?.map((c, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-orange-400 mt-0.5">→</span>{c}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-black/20 border border-white/10 rounded-xl p-5">
                                    <h4 className="font-bold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> نصائح توجيهية (Coaching)</h4>
                                    <div className="space-y-3">
                                        {result.coaching_tips?.map((tip, i) => (
                                            <div key={i} className="flex flex-col gap-1 border-r-2 pl-3 pb-2 border-white/10" style={{ borderRightColor: tip.priority === 'high' ? '#EF4444' : tip.priority === 'medium' ? '#F59E0B' : '#10B981' }}>
                                                <span className="text-sm font-bold text-white">{tip.tip}</span>
                                                <span className="text-xs text-gray-400">{tip.example}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <h4 className="font-bold text-white mb-2">التحليل المفصل</h4>
                            <p className="text-sm text-gray-300 leading-relaxed md:leading-loose">
                                {result.analysis.detailed}
                            </p>
                        </div>

                        <div className="text-center mt-4">
                            <p className="inline-flex flex-col items-center justify-center text-xs text-gray-500 border border-white/5 rounded-xl px-6 py-3 bg-black/30">
                                <span className="font-bold uppercase tracking-widest text-[#00FFD4] mb-1">SeeMePro Forensic Engine</span>
                                {result.disclaimer || "نتيجة استرشادية مبنية على قراءات الذكاء الاصطناعي المجردة للغة الجسد الدقيقة."}
                            </p>
                        </div>

                    </div>
                </motion.div>
            </div >
        </AnimatePresence >
    );
};

const VideoAnalysis = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [result, setResult] = useState<DetailedVideoAnalysis | null>(null);

    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [showVideoAdModal, setShowVideoAdModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const animFrameRef = useRef<number | null>(null);

    const { user, consumeCredit, addCreditFromAd } = useAppStore();

    // Scanline Animation Loop effect when result exists!
    useEffect(() => {
        if (!result) return;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        const getVideoEl = (): HTMLVideoElement | null =>
            videoRef.current || liveVideoRef.current || document.querySelector('video');

        const syncAndPaint = () => {
            const canvas = overlayRef.current;
            const video = getVideoEl();
            if (canvas && video) {
                const rect = video.getBoundingClientRect();
                if (rect.width > 10 && rect.height > 10) {
                    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
                        canvas.width = Math.floor(rect.width);
                        canvas.height = Math.floor(rect.height);
                    }
                    if (canvas.width > 0 && canvas.height > 0) {
                        paintVideoOverlays(canvas, result);
                    }
                }
            }
            animFrameRef.current = requestAnimationFrame(syncAndPaint);
        };

        // delay 500ms to let video render
        const startTimer = setTimeout(() => {
            animFrameRef.current = requestAnimationFrame(syncAndPaint);
        }, 500);

        return () => {
            clearTimeout(startTimer);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [result]);

    // Also add ResizeObserver for mobile rotation
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const ro = new ResizeObserver(() => {
            const canvas = overlayRef.current;
            if (canvas && videoEl) {
                canvas.width = videoEl.offsetWidth;
                canvas.height = videoEl.offsetHeight;
            }
        });
        ro.observe(videoEl);
        return () => ro.disconnect();
    }, []);

    const handleUploadClick = () => {
        const hasCredit = consumeCredit('video');
        if (!hasCredit) {
            setShowVideoAdModal(true);
            return;
        }
        fileInputRef.current?.click();
    };

    const saveResultToSupabase = async (analysisResult: any) => {
        if (!user.isLoggedIn || !supabase.auth) return;
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            await supabase.from('ai_analyses').insert([{
                user_id: authUser.id,
                type: 'Video',
                truth_score: analysisResult.globalScores?.truthScore ?? 0,
                summary: analysisResult.forensicSummary?.executiveSummary ?? '',
                details: analysisResult,
                created_at: new Date().toISOString(),
            }]);
        } catch (err) {
            console.warn('Could not save to Supabase:', err);
        }
    };

    const handleCameraClick = async () => {
        const hasCredit = consumeCredit('video');
        if (!hasCredit) {
            setShowVideoAdModal(true);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setIsCameraActive(true);
            setIsVideoLoaded(true);
            setResult(null);
            setVideoSrc(null);
            setTimeout(() => {
                if (liveVideoRef.current) {
                    liveVideoRef.current.srcObject = stream;
                    liveVideoRef.current.play();
                }
            }, 100);
        } catch (err) {
            setUploadError("Could not access camera.");
        }
    };

    const stopCamera = () => {
        if (liveVideoRef.current && liveVideoRef.current.srcObject) {
            const stream = liveVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            liveVideoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) {
            setUploadError("Video size too large. Please select a file under 20MB.");
            return;
        }

        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        setIsVideoLoaded(true);
        setIsCameraActive(false);
        setUploadError(null);
        setResult(null);
        if (overlayRef.current) overlayRef.current.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

        // Analysis trigger
        setIsAnalyzing(true);
        try {
            const res = await analyzeVideoWithOpenAI(file, i18n.language);
            setResult(res);
            saveResultToSupabase(res);

            // Force canvas sync after result
            setTimeout(() => {
                const canvas = overlayRef.current;
                const video = videoRef.current;
                if (canvas && video) {
                    canvas.width = video.offsetWidth || video.getBoundingClientRect().width || 640;
                    canvas.height = video.offsetHeight || video.getBoundingClientRect().height || 360;
                }
            }, 800);
        } catch (err) {
            setUploadError("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const captureAndAnalyze = async () => {
        if (!liveVideoRef.current) return;
        setIsAnalyzing(true);
        const canvas = document.createElement('canvas');
        canvas.width = liveVideoRef.current.videoWidth;
        canvas.height = liveVideoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(liveVideoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];

        stopCamera();

        try {
            const res = await analyzeVideoFrameWithOpenAI(base64, i18n.language);
            setResult(res);
            saveResultToSupabase(res);
            setVideoSrc(canvas.toDataURL('image/jpeg')); // Display the shot frozen

            setTimeout(() => {
                const canvas = overlayRef.current;
                const video = videoRef.current;
                if (canvas && video) {
                    canvas.width = video.offsetWidth || video.getBoundingClientRect().width || 640;
                    canvas.height = video.offsetHeight || video.getBoundingClientRect().height || 360;
                }
            }, 800);
        } catch (e) {
            setUploadError("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetAnalysis = () => {
        stopCamera();
        setIsVideoLoaded(false);
        setVideoSrc(null);
        setResult(null);
        setUploadError(null);
        if (overlayRef.current) overlayRef.current.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    };

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto gap-8 pb-20 overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between z-10 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-3">
                        {t('video_analysis')} <span className="text-purple-500 font-normal">{t('kinematics', { defaultValue: 'Intelligence' })}</span>
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">{t('video_analysis_desc', { defaultValue: 'Cinematic behavioral analysis and forensic micro-expression mapping.' })}</p>
                    <div className="mt-3 px-3 py-1 w-fit bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-bold text-purple-400 flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        🎬 {user.credits.video} Credits Remaining
                    </div>
                </div>
                {!isVideoLoaded && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleCameraClick} className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-teal-900/50">
                            <Camera className="w-5 h-5" /> Live Capture
                        </button>
                        <button onClick={handleUploadClick} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-900/50">
                            <Upload className="w-5 h-5" /> Upload File
                        </button>
                    </div>
                )}
                {isVideoLoaded && !isAnalyzing && (
                    <div className="flex items-center gap-3">
                        {result && (
                            <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-purple-900/50">
                                <FileText className="w-4 h-4" /> عرض التقرير الكامل
                            </button>
                        )}
                        <button onClick={resetAnalysis} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-colors">
                            <X className="w-4 h-4" /> إغلاق
                        </button>
                    </div>
                )}
            </div>

            {uploadError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center z-10">{uploadError}</div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 items-start relative z-10">
                {/* Left: Video Region */}
                <div className={`flex flex-col gap-4 transition-all duration-700 ${result ? 'lg:w-[45%]' : 'w-full max-w-3xl mx-auto'}`}>
                    <div className={`relative w-full aspect-video bg-black rounded-xl border ${isAnalyzing ? 'border-purple-500/50 shadow-[0_0_30px_rgba(139,92,246,0.2)]' : 'border-white/10'} overflow-hidden flex items-center justify-center transition-colors duration-500`}>

                        {!isVideoLoaded ? (
                            <div className="flex flex-col items-center text-gray-600 gap-4 p-6">
                                <Video className="w-20 h-20 opacity-20" />
                                <p className="uppercase tracking-widest font-mono text-xs text-center px-4">Upload a clip or capture a live frame for forensic AI profiling</p>
                            </div>
                        ) : (
                            <div className="absolute inset-0 w-full h-full bg-gray-950">
                                {isCameraActive ? (
                                    <>
                                        <video ref={liveVideoRef} className="w-full h-full object-cover transform -scale-x-100" playsInline muted autoPlay />
                                        <button onClick={captureAndAnalyze} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black font-bold px-6 py-2 rounded-full shadow-2xl hover:bg-gray-200 flex items-center gap-2">
                                            <Camera className="w-4 h-4 text-red-500" /> تحليل اللقطة
                                        </button>
                                    </>
                                ) : (
                                    <video
                                        ref={videoRef}
                                        src={videoSrc ?? undefined}
                                        className="w-full h-full object-cover"
                                        playsInline loop autoPlay={false}
                                        onLoadedData={() => {
                                            const canvas = overlayRef.current;
                                            const video = videoRef.current;
                                            if (canvas && video) {
                                                canvas.width = video.offsetWidth || 640;
                                                canvas.height = video.offsetHeight || 360;
                                            }
                                        }}
                                    />
                                )}

                                {/* Cinematic Canvas overlay */}
                                <canvas
                                    ref={overlayRef}
                                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                                />

                                {/* Processing overlay */}
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-30 gap-6">
                                        <div className="relative flex items-center justify-center">
                                            <Activity className="w-16 h-16 text-purple-400 animate-pulse absolute" />
                                            <div className="w-24 h-24 border-t-2 border-r-2 border-purple-500 rounded-full animate-spin"></div>
                                        </div>
                                        <p className="font-mono text-sm font-bold text-white tracking-widest animate-pulse">🔍 جاري التحليل الجنائي...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Results Dashboard Area */}
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col gap-6 w-full">

                            <div className="glass-card border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
                                <div className="flex flex-col items-center justify-center p-4 bg-black/30 rounded-2xl border border-white/5 w-32 shrink-0">
                                    <span className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">التقييم</span>
                                    <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">{result?.overall_grade || "N/A"}</span>
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        الملخص التنفيذي
                                    </h3>
                                    <p className="text-gray-300 text-sm leading-relaxed border-r-2 border-purple-500 pr-3">{result?.analysis?.summary}</p>
                                </div>
                            </div>

                            {/* Scores Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <ScoreBox label="الثقة" score={result?.scores?.confidence || 0} color="primary" />
                                <ScoreBox label="المصداقية" score={result?.scores?.authenticity || 0} color="truth" />
                                <ScoreBox label="التواصل" score={result?.scores?.engagement || 0} color="purple-500" />
                            </div>

                            <p className="text-gray-400 text-xs flex items-center gap-2 mt-4"><ScanFace className="w-4 h-4" /> اضغط على (عرض التقرير الكامل) لمشاهدة تحليل تفصيلي شامل للإشارات الدقيقة لجميع مناطق الجسد والوجه.</p>

                            {/* ── Arabic Full Report Section ── */}
                            {result?.analysis && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-col gap-4 mt-2"
                                >
                                    {/* Summary */}
                                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                        <h4 className="text-purple-400 font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                            🎯 الملخص التنفيذي
                                        </h4>
                                        <p className="text-gray-200 text-sm leading-relaxed">{result.analysis.summary}</p>
                                    </div>

                                    {/* Detailed */}
                                    {result.analysis.detailed && (
                                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                            <h4 className="text-blue-400 font-black text-sm uppercase tracking-widest mb-3">
                                                📊 التحليل التفصيلي
                                            </h4>
                                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{result.analysis.detailed}</p>
                                        </div>
                                    )}

                                    {/* Strengths */}
                                    {result.analysis.strengths?.length > 0 && (
                                        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                            <h4 className="text-green-400 font-black text-sm uppercase tracking-widest mb-3">✅ نقاط القوة</h4>
                                            <ul className="flex flex-col gap-2">
                                                {result.analysis.strengths.map((s, i) => (
                                                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                                        <span className="text-green-400 mt-0.5">•</span>{s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Areas of Concern */}
                                    {result.analysis.areas_of_concern?.length > 0 && (
                                        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                            <h4 className="text-orange-400 font-black text-sm uppercase tracking-widest mb-3">⚠️ مناطق تحتاج تطوير</h4>
                                            <ul className="flex flex-col gap-2">
                                                {result.analysis.areas_of_concern.map((c, i) => (
                                                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                                        <span className="text-orange-400 mt-0.5">•</span>{c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Coaching Tips */}
                                    {result.coaching_tips?.length > 0 && (
                                        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                            <h4 className="text-cyan-400 font-black text-sm uppercase tracking-widest mb-3">💡 نصائح التطوير</h4>
                                            <div className="flex flex-col gap-3">
                                                {result.coaching_tips.map((tip, i) => (
                                                    <div key={i} className="bg-black/20 rounded-xl p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tip.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                                tip.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-green-500/20 text-green-400'
                                                                }`}>{tip.priority === 'high' ? 'عاجل' : tip.priority === 'medium' ? 'مهم' : 'عادي'}</span>
                                                        </div>
                                                        <p className="text-white text-sm font-bold">{tip.tip}</p>
                                                        {tip.example && <p className="text-gray-400 text-xs mt-1">مثال: {tip.example}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Body Language */}
                                    {result.body_language?.length > 0 && (
                                        <div className="rounded-2xl border border-white/10 bg-white/3 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                            <h4 className="text-gray-300 font-black text-sm uppercase tracking-widest mb-3">🧍 تحليل لغة الجسد</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {result.body_language.map((b, i) => (
                                                    <div key={i} className="bg-black/20 rounded-xl p-3 border border-white/5">
                                                        <div className="text-xs text-gray-500 mb-1">{b.zone}</div>
                                                        <div className="text-white text-sm font-bold">{b.observation}</div>
                                                        <div className="text-gray-400 text-xs mt-1">{b.detail}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Red Flags */}
                                    {result.red_flags?.length > 0 && (
                                        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                            <h4 className="text-red-400 font-black text-sm uppercase tracking-widest mb-3">🚨 إشارات تحذيرية</h4>
                                            <ul className="flex flex-col gap-2">
                                                {result.red_flags.map((f, i) => (
                                                    <li key={i} className="text-red-300 text-sm flex items-start gap-2">
                                                        <span className="text-red-400 mt-0.5">⚠</span>{f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* FACS */}
                                    {result.facs_detected?.length > 0 && (
                                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                                            <h4 className="text-yellow-400 font-black text-sm uppercase tracking-widest mb-3">🔬 وحدات التعبير (FACS)</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {result.facs_detected.map((au, i) => (
                                                    <div key={i} className="bg-black/30 rounded-lg px-3 py-2 border border-yellow-500/10">
                                                        <div className="text-yellow-400 text-xs font-bold">{au.au}</div>
                                                        <div className="text-white text-xs">{au.meaning}</div>
                                                        <div className="text-gray-500 text-xs">شدة: {Math.round(au.intensity * 100)}%</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-gray-600 text-xs text-center" dir={isRtl ? 'rtl' : 'ltr'}>{result.disclaimer}</p>
                                </motion.div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            <RewardedAdModal
                isOpen={showVideoAdModal}
                feature="video"
                onClose={() => setShowVideoAdModal(false)}
                onComplete={() => {
                    addCreditFromAd('video');
                    setShowVideoAdModal(false);
                }}
            />

            {
                showReportModal && (
                    <VideoReportModal result={result} onClose={() => setShowReportModal(false)} />
                )
            }
        </div >
    );
};

// ── Reusable Component ─────────────────────────────────────────────────
const ScoreBox = ({ label, score, color }: any) => {
    const colorStyles: Record<string, { text: string; fill: string }> = {
        primary: { text: 'text-primary', fill: 'bg-primary' },
        truth: { text: 'text-[#30D158]', fill: 'bg-[#30D158]' },
        'purple-500': { text: 'text-purple-500', fill: 'bg-purple-500' }
    };
    const style = colorStyles[color] || colorStyles.primary;
    return (
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{label}</div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-white">{score}</span>
                <span className="text-[10px] text-gray-500 mb-1">/100</span>
            </div>
            <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1 }} className={`h-full ${style.fill}`} />
            </div>
        </div>
    );
};

export default VideoAnalysis;
