import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Upload } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { analyzeVoiceWithOpenAI } from '../utils/voiceAnalysisService';
import type { DetailedVoiceAnalysis } from '../utils/voiceAnalysisService';
import { supabase } from '../config/supabase';
import { useTranslation } from 'react-i18next';
import { CinematicVoiceHUD, OfficialReportModal } from '../components/CinematicVoiceHUD';
import { RewardedAdModal } from '../components/RewardedAdModal';
const VoiceAnalysis = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [time, setTime] = useState(0);
    const [result, setResult] = useState<DetailedVoiceAnalysis | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const fullTranscriptRef = useRef<string>("");
    const [realtimeLogs, setRealtimeLogs] = useState<{ time: string, text: string, type: string, emotion: string, confidence: number }[]>([]);
    const [metrics, setMetrics] = useState({ stress: 20, honesty: 90, speed: 120 });

    const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const { user, consumeCredit, addCreditFromAd } = useAppStore();
    const [showAdModal, setShowAdModal] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => setTime((t) => t + 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const saveResultToSupabase = async (analysisResult: DetailedVoiceAnalysis) => {
        if (!user.isLoggedIn || !supabase.auth) return;
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            await supabase.from('ai_analyses').insert([{
                user_id: authUser.id,
                type: 'Voice',
                truth_score: analysisResult.scores.authenticity,
                summary: analysisResult.analysis.summary,
                details: analysisResult,
                created_at: new Date().toISOString(),
            }]);
        } catch (err) {
            console.warn('Could not save to Supabase:', err);
        }
    };

    const runAnalysis = async (audioBlob: Blob) => {
        setIsAnalyzing(true);
        setShowReport(false);
        setUploadError(null);

        const audioUrl = URL.createObjectURL(audioBlob);
        const audioEl = new Audio(audioUrl);
        let trackingCtx: AudioContext | null = null;
        let animFrame: number | null = null;

        try {
            trackingCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = trackingCtx.createAnalyser();
            analyser.fftSize = 256;
            const source = trackingCtx.createMediaElementSource(audioEl);
            source.connect(analyser);
            analyser.connect(trackingCtx.destination);

            audioEl.play().catch(e => console.warn("Auto-play blocked", e));

            const updateLevel = () => {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                setAudioLevel(Math.min(100, Math.round((avg / 255) * 150)));
                animFrame = requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } catch (err) {
            console.warn("Could not attach audio visualization", err);
        }

        try {
            const analysisResult = await analyzeVoiceWithOpenAI(audioBlob, fullTranscriptRef.current, i18n.language);

            if ((analysisResult as any).error) {
                setUploadError((analysisResult as any).message || (analysisResult as any).error);
                return;
            }

            setResult(analysisResult);
            await saveResultToSupabase(analysisResult);
            setShowReport(true);
        } catch (err: any) {
            console.error('Analysis failed:', err);
            setUploadError(i18n.language === 'ar' ? "فشل التحليل. تحقق من اتصالك." : "Analysis failed. Error: " + err.message);
        } finally {
            setIsAnalyzing(false);
            audioEl.pause();
            audioEl.src = "";
            URL.revokeObjectURL(audioUrl);
            if (trackingCtx) trackingCtx.close().catch(() => { });
            if (animFrame) cancelAnimationFrame(animFrame);
            setAudioLevel(0);
        }
    };

    const handleRecord = async () => {
        if (!isRecording) {
            const hasCredit = consumeCredit('voice');
            if (!hasCredit) {
                setShowAdModal(true);
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioChunksRef.current = [];
                fullTranscriptRef.current = "";
                setRealtimeLogs([]);
                setMetrics({ stress: 20, honesty: 90, speed: 120 });
                setAudioLevel(0);

                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = audioCtx;
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                const updateLevel = () => {
                    if (!analyserRef.current) return;
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                    setAudioLevel(Math.min(100, Math.round((avg / 255) * 150)));
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                };
                updateLevel();

                let startedFallback = false;
                const startFallback = () => {
                    if (startedFallback) return;
                    startedFallback = true;
                    fallbackIntervalRef.current = setInterval(() => {
                        setRealtimeLogs(prev => [...prev.slice(-7), {
                            time: new Date().toISOString().substring(11, 19),
                            text: "[Recording... speak naturally]",
                            type: 'system',
                            emotion: '🎤',
                            confidence: 100
                        }]);
                    }, 2000);
                };

                const HUME_API_KEY = import.meta.env.VITE_HUME_API_KEY;
                if (HUME_API_KEY) {
                    const ws = new WebSocket(`wss://api.hume.ai/v0/stream/models?apikey=${HUME_API_KEY}`);
                    ws.onopen = () => console.log('Hume WS Connected');
                    ws.onerror = () => startFallback();
                    ws.onclose = () => startFallback();
                    ws.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            const preds = data?.models?.language?.grouped_predictions?.[0]?.predictions;
                            if (preds && preds.length > 0) {
                                if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
                                const text = preds[0].text;
                                const emotions = preds[0].emotions;
                                if (text) {
                                    fullTranscriptRef.current += text + " ";
                                    emotions.sort((a: any, b: any) => b.score - a.score);
                                    const topEmotion = emotions[0];
                                    setRealtimeLogs(prev => [...prev.slice(-7), {
                                        time: new Date().toISOString().substring(11, 19),
                                        text: text,
                                        type: 'speech',
                                        emotion: '🎤',
                                        confidence: Math.round(topEmotion.score * 100)
                                    }]);

                                    const isStressed = topEmotion.name.toLowerCase().includes('anxi') || topEmotion.name.toLowerCase().includes('fear');
                                    setMetrics(m => ({
                                        stress: isStressed ? Math.min(100, m.stress + 10) : Math.max(0, m.stress - 5),
                                        honesty: Math.min(100, Math.max(0, m.honesty + (Math.random() * 10 - 5))),
                                        speed: Math.min(200, Math.max(80, m.speed + (Math.random() * 20 - 10)))
                                    }));
                                }
                            }
                        } catch (e) { }
                    };
                    wsRef.current = ws;
                } else {
                    startFallback();
                }

                const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                recorder.ondataavailable = async (e) => {
                    if (e.data.size > 0) {
                        audioChunksRef.current.push(e.data);
                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64data = (reader.result as string).split(',')[1];
                                wsRef.current?.send(JSON.stringify({
                                    data: base64data,
                                    models: { language: {}, prosody: {} }
                                }));
                            };
                            reader.readAsDataURL(e.data);
                        }
                    }
                };
                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    stream.getTracks().forEach(t => t.stop());
                    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
                    if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
                    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
                    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }



                    await runAnalysis(audioBlob);
                };
                recorder.start(1000); // 1-second chunks
                mediaRecorderRef.current = recorder;
                setIsRecording(true);
                setTime(0);
                setShowReport(false);
                setUploadError(null);
            } catch {
                alert(i18n.language === 'ar' ? 'تم رفض الوصول للميكروفون. يرجى السماح بالوصول.' : 'Microphone access denied. Please allow microphone access.');
            }
        } else {
            mediaRecorderRef.current?.stop();
            if (wsRef.current) wsRef.current.close();
            if (fallbackIntervalRef.current) { clearInterval(fallbackIntervalRef.current); fallbackIntervalRef.current = null; }
            if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
            if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
            setIsRecording(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const hasCredit = consumeCredit('voice');
        if (!hasCredit) {
            setShowAdModal(true);
            return;
        }

        if (!file.type.includes('audio') && !file.type.includes('video')) {
            setUploadError(i18n.language === 'ar' ? 'يرجى تحميل ملف صوتي صالح (.wav, .mp3, .ogg, .webm)' : 'Please upload a valid audio/video file (.wav, .mp3, .ogg, .webm)');
            return;
        }
        setUploadError(null);
        await runAnalysis(file);
    };



    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto gap-8 relative pb-20">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-3">
                        {t('voice_analysis')} <span className="text-primary font-normal">{t('engine', { defaultValue: 'Engine' })}</span>
                        <div className="ml-4 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            🎙️ {user.credits.voice} Credits
                        </div>
                    </h2>
                    <p className="text-gray-400 mt-2">{t('voice_analysis_desc', { defaultValue: 'Upload or record audio for deep prosodic & semantic behavioral analysis.' })}</p>
                </div>
            </div>

            {/* Main Scanner Area */}
            {(!isRecording && !isAnalyzing && !result) ? (
                <motion.div
                    layout
                    className={`relative flex-1 rounded-[2rem] overflow-hidden border transition-colors duration-1000 flex flex-col items-center justify-center p-8 glass-panel border-white/5`}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center z-10 w-full"
                    >
                        {/* Main Record Button */}
                        <button
                            onClick={handleRecord}
                            className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-primary-light/10 text-primary-light border-2 border-primary-light/50 hover:bg-primary-light/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]`}
                        >
                            <Mic className="w-16 h-16" />
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse-slow" />
                        </button>
                        <p className="mt-8 text-gray-500 font-medium select-none">
                            {t('tap_to_record', { defaultValue: 'Tap to Record or Speak Naturaly for >10s' })}
                        </p>
                        {uploadError && (
                            <p className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center max-w-md">{uploadError}</p>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        >
                            <Upload className="w-4 h-4" /> {t('upload_file')} (.wav, .mp3, .webm)
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*,video/webm"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </motion.div>
                </motion.div>
            ) : (
                <div className="w-full flex flex-col gap-6">
                    {isRecording && (
                        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <span className="relative flex h-5 w-5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500"></span>
                                </span>
                                <span className="text-red-500 font-bold font-mono text-xl tracking-widest shrink-0">
                                    {Math.floor(time / 60).toString().padStart(2, '0')}:{(time % 60).toString().padStart(2, '0')}
                                </span>
                                <span className="text-red-400 font-bold animate-pulse text-sm sm:text-base whitespace-nowrap">🎙️ جاري التسجيل...</span>
                            </div>
                            <div className="hidden sm:flex flex-1 max-w-sm mx-6 h-2 bg-black/50 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-red-500"
                                    animate={{ width: `${audioLevel}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                        </div>
                    )}
                    <CinematicVoiceHUD
                        isRecording={isRecording}
                        isAnalyzing={isAnalyzing}
                        onStop={handleRecord}
                        hasData={!!result}
                        onShowReport={() => setShowReport(true)}
                        realtimeLogs={realtimeLogs}
                        metrics={metrics}
                        audioLevel={audioLevel}
                    />

                    {/* ── Voice Full Arabic Report ── */}
                    {result && !(result as any).error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4 mt-4 pb-10"
                            dir={isRtl ? 'rtl' : 'ltr'}
                        >
                            {/* Summary */}
                            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                                <h4 className="text-cyan-400 font-black text-sm mb-3">🎯 ملخص التحليل الصوتي</h4>
                                <p className="text-gray-200 text-sm leading-relaxed">{result.analysis?.summary}</p>
                            </div>

                            {/* Detailed Analysis */}
                            {result.analysis?.detailed && (
                                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                                    <h4 className="text-blue-400 font-black text-sm mb-3">📊 التحليل المفصّل</h4>
                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{result.analysis.detailed}</p>
                                </div>
                            )}

                            {/* Acoustic Data */}
                            {result.acoustic_data && (
                                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                                    <h4 className="text-green-400 font-black text-sm mb-3">🎙️ البيانات الصوتية</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { label: 'طبقة الصوت', value: `${result.acoustic_data.avg_pitch_hz} Hz` },
                                            { label: 'سرعة الكلام', value: `${result.acoustic_data.speech_rate_wpm} كلمة/دقيقة` },
                                            { label: 'كلمات الحشو', value: result.acoustic_data.filler_word_count },
                                            { label: 'عدد التوقفات', value: result.acoustic_data.pause_count },
                                            { label: 'طاقة الصوت', value: result.acoustic_data.voice_energy_level },
                                        ].map((item, i) => (
                                            <div key={i} className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                                                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                                                <div className="text-white font-bold text-sm">{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strengths */}
                            {result.analysis?.strengths?.length > 0 && (
                                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                                    <h4 className="text-green-400 font-black text-sm mb-3">✅ نقاط القوة</h4>
                                    <ul className="flex flex-col gap-2">
                                        {result.analysis.strengths.map((s: string, i: number) => (
                                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                                <span className="text-green-400">•</span>{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Areas of Concern */}
                            {result.analysis?.areas_of_concern?.length > 0 && (
                                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                                    <h4 className="text-orange-400 font-black text-sm mb-3">⚠️ جوانب تحتاج تحسين</h4>
                                    <ul className="flex flex-col gap-2">
                                        {result.analysis.areas_of_concern.map((c: string, i: number) => (
                                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                                <span className="text-orange-400">•</span>{c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Coaching Tips */}
                            {result.coaching_tips?.length > 0 && (
                                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                                    <h4 className="text-cyan-400 font-black text-sm mb-3">💡 نصائح التحسين</h4>
                                    <div className="flex flex-col gap-3">
                                        {result.coaching_tips.map((tip: any, i: number) => (
                                            <div key={i} className="bg-black/20 rounded-xl p-3 border border-white/5">
                                                <p className="text-white text-sm font-bold">{tip.tip}</p>
                                                {tip.example && <p className="text-gray-400 text-xs mt-1">مثال: {tip.example}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Red Flags */}
                            {result.red_flags?.length > 0 && (
                                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
                                    <h4 className="text-red-400 font-black text-sm mb-3">🚨 الإشارات التحذيرية</h4>
                                    <div className="flex flex-col gap-2">
                                        {result.red_flags.map((flag: any, i: number) => (
                                            <div key={i} className="bg-black/20 rounded-xl p-3 border border-red-500/10">
                                                <p className="text-red-300 text-sm">{typeof flag === 'string' ? flag : flag.flag}</p>
                                                {flag.recommendation && <p className="text-gray-500 text-xs mt-1">{flag.recommendation}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Follow-up Questions */}
                            {result.recommended_followup_questions?.length > 0 && (
                                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                                    <h4 className="text-purple-400 font-black text-sm mb-3">❓ أسئلة متابعة مقترحة</h4>
                                    <ul className="flex flex-col gap-2">
                                        {result.recommended_followup_questions.map((q: string, i: number) => (
                                            <li key={i} className="text-gray-300 text-sm bg-black/20 rounded-lg p-3">
                                                {i + 1}. {q}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            )}

            {showReport && result && (
                <OfficialReportModal
                    data={result}
                    onClose={() => {
                        setShowReport(false);
                        setResult(null);
                    }}
                />
            )}

            <RewardedAdModal
                isOpen={showAdModal}
                feature="voice"
                onClose={() => setShowAdModal(false)}
                onComplete={() => {
                    addCreditFromAd('voice');
                    setShowAdModal(false);
                }}
            />
        </div>
    );
};

export default VoiceAnalysis;
