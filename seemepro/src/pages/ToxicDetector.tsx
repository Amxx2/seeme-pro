import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, AlertTriangle, Radio, Share2, MessageCircle, Send, Download, Upload, FolderOpen } from 'lucide-react';
import { CinematicToxicHUD } from '../components/CinematicToxicHUD';
import { analyzeToxicWithOpenAI, type ToxicResult } from '../utils/toxicAnalysisService';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { supabase } from '../config/supabase';
import { RewardedAdModal } from '../components/RewardedAdModal';

const ACCEPTED_AUDIO = 'audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.flac';

const ToxicDetector = () => {
    const { i18n } = useTranslation();
    const [mode, setMode] = useState<'record' | 'upload'>('record');
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<ToxicResult | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [permError, setPermError] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user, consumeCredit, addCreditFromAd } = useAppStore();
    const isRtl = i18n.language === 'ar';
    const [showAdModal, setShowAdModal] = useState(false);

    const saveResultToSupabase = async (analysisResult: any) => {
        if (!user.isLoggedIn || !supabase.auth) return;
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            await supabase.from('ai_analyses').insert([{
                user_id: authUser.id,
                type: 'Toxic',
                truth_score: analysisResult.score ?? 0,
                summary: analysisResult.verdict ?? '',
                details: analysisResult,
                created_at: new Date().toISOString(),
            }]);
        } catch (err) {
            console.warn('Could not save to Supabase:', err);
        }
    };

    const processFile = async (file: File) => {
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|aac|flac)$/i)) {
            alert('Please upload an audio file (mp3|wav|m4a|webm|aac|flac)');
            return;
        }

        const hasCredit = consumeCredit('toxic');
        if (!hasCredit) {
            setShowAdModal(true);
            return;
        }

        setUploadedFileName(file.name);
        setAudioBlob(file);
        setResult(null);
        setProcessing(true);
        setPermError(false);

        const audioUrl = URL.createObjectURL(file);
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

        let completed = false;
        const timeoutId = setTimeout(() => {
            if (!completed) {
                setProcessing(false);
                completed = true;
                alert("انتهى وقت التحليل (30 ثانية). يرجى المحاولة مرة أخرى.");
            }
        }, 30000);

        try {
            const res = await analyzeToxicWithOpenAI(file, i18n.language);
            if (completed) return;
            completed = true;
            clearTimeout(timeoutId);
            setResult(res);
            saveResultToSupabase(res);
        } catch (error) {
            if (completed) return;
            completed = true;
            clearTimeout(timeoutId);
            console.error(error);
            alert('Analysis failed. Please try again.');
        } finally {
            if (!completed) setProcessing(false);
            audioEl.pause();
            audioEl.src = "";
            URL.revokeObjectURL(audioUrl);
            if (trackingCtx) trackingCtx.close().catch(() => { });
            if (animFrame) cancelAnimationFrame(animFrame);
            setAudioLevel(0);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const startRecording = async () => {
        try {
            setPermError(false);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const hasCredit = consumeCredit('toxic');
            if (!hasCredit) {
                stream.getTracks().forEach(t => t.stop());
                setShowAdModal(true);
                return;
            }

            const mr = new MediaRecorder(stream);
            mediaRecorderRef.current = mr;
            chunksRef.current = [];
            mr.ondataavailable = (e) => chunksRef.current.push(e.data);
            mr.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(t => t.stop());
                setProcessing(true);

                const audioUrl = URL.createObjectURL(blob);
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

                let completed = false;
                const timeoutId = setTimeout(() => {
                    if (!completed) {
                        setProcessing(false);
                        completed = true;
                        alert("انتهى وقت التحليل (30 ثانية). يرجى المحاولة مرة أخرى.");
                    }
                }, 30000);

                try {
                    const res = await analyzeToxicWithOpenAI(blob, i18n.language);
                    if (completed) return;
                    completed = true;
                    clearTimeout(timeoutId);
                    setResult(res);
                    saveResultToSupabase(res);
                } catch (error) {
                    if (completed) return;
                    completed = true;
                    clearTimeout(timeoutId);
                    console.error(error);
                    alert('Analysis failed. Please try again.');
                } finally {
                    if (!completed) setProcessing(false);
                    audioEl.pause();
                    audioEl.src = "";
                    URL.revokeObjectURL(audioUrl);
                    if (trackingCtx) trackingCtx.close().catch(() => { });
                    if (animFrame) cancelAnimationFrame(animFrame);
                    setAudioLevel(0);
                }
            };
            mr.start(); setRecording(true); setResult(null);
        } catch { setPermError(true); }
    };

    const stopRecording = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        mediaRecorderRef.current?.stop(); setRecording(false);
    };

    const shareResult = async (platform: 'whatsapp' | 'telegram' | 'native' | 'download') => {
        if (!result) return;
        const text = `🔬 SEEMEPRO Toxic Friend Scan\n\nToxicity Level: ${result.level}\nScore: ${result.score}/100\n\n${result.verdict}\n\nScan your friends at SEEMEPRO 👁️`;
        if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        else if (platform === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent('https://seemepro.app')}&text=${encodeURIComponent(text)}`, '_blank');
        else if (platform === 'native' && navigator.share) {
            try {
                const files = audioBlob ? [new File([audioBlob], uploadedFileName ?? 'toxic-scan.webm', { type: audioBlob.type })] : [];
                await navigator.share({ title: 'SEEMEPRO Toxic Scan', text, files: files.length ? files : undefined });
            } catch { /* cancelled */ }
        } else if (platform === 'download' && audioBlob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(audioBlob);
            a.download = uploadedFileName ?? 'seemepro-toxic-scan.webm'; a.click();
        }
    };

    const toxicColor = (l: string) =>
        l === 'HIGH' ? 'text-red-400' : l === 'MODERATE' ? 'text-yellow-400' : 'text-green-400';

    const reset = () => { setResult(null); setAudioBlob(null); setUploadedFileName(null); };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                        <Skull className="w-7 h-7 text-red-400" />
                    </div>
                    <div>
                        <div className="text-xs text-red-400 font-black uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                            🔥 Viral Feature
                            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px] tracking-widest border border-red-500/30">
                                ☢️ {user.credits.toxic} Credits
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Toxic Friend Detector</h1>
                    </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">Record or upload your friend's voice. AI analyzes vocal patterns, tonal dominance, and emotional markers to determine their <strong className="text-white">toxicity level</strong>.</p>
                {permError && <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm font-bold">Microphone access denied. Allow mic permissions in browser settings.</div>}
                <div className="mt-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-3 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">Entertainment tool only. Not for making serious judgements about real people.</p>
                </div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-5 bg-white/3 p-1 rounded-2xl border border-white/8">
                {(['record', 'upload'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                            ${mode === m ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                        {m === 'record' ? <><Radio className="w-4 h-4" />Record</> : <><Upload className="w-4 h-4" />Upload File</>}
                    </button>
                ))}
            </div>

            {/* Main HUD */}
            {(recording || processing || result) ? (
                <div className="w-full mb-5 relative">
                    {processing && !result && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl border border-white/10 m-4 sm:m-0">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-red-400 font-bold tracking-widest animate-pulse">جاري تحليل الصوت...</p>
                        </div>
                    )}
                    <CinematicToxicHUD
                        isRecording={recording}
                        isAnalyzing={processing}
                        onStop={stopRecording}
                        hasData={!!result}
                        audioLevel={audioLevel}
                        onShowReport={() => {
                        }}
                    />
                </div>
            ) : (
                <div className="bg-[#0a0c16] border border-white/8 rounded-3xl p-8 mb-5 text-center">
                    <p className="text-gray-400 mb-6">Press Start Recording or Upload an audio file to begin.</p>

                    {mode === 'record' ? (
                        <button onClick={startRecording} className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-red-600 active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <Radio className="w-5 h-5" />Start Recording
                        </button>
                    ) : (
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`bg-[#0a0c16] border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer
                                  ${dragOver ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 hover:border-red-500/30 hover:bg-red-500/3'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input ref={fileInputRef} type="file" accept={ACCEPTED_AUDIO} onChange={handleFileChange} className="hidden" />
                            <FolderOpen className={`w-10 h-10 mx-auto mb-4 ${dragOver ? 'text-red-400' : 'text-gray-600'}`} />
                            <p className="text-white font-black uppercase tracking-wide text-sm mb-1">
                                {uploadedFileName ?? 'Drop audio file or click to browse'}
                            </p>
                            <p className="text-gray-600 text-xs">mp3 · wav · m4a · webm · aac · flac · ogg</p>
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && !processing && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0c16] border border-white/8 rounded-3xl p-8">
                        <div className="text-center mb-8">
                            <p className="text-xs text-gray-500 uppercase tracking-[0.3em] font-black mb-3">Toxicity Score</p>
                            <div className={`text-8xl font-black ${toxicColor(result.level)}`}>{result.score}</div>
                            <div className={`text-sm font-black uppercase tracking-widest mt-2 ${toxicColor(result.level)}`}>{result.level} TOXICITY</div>
                        </div>
                        {result && !(result as any).error && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col gap-4 mt-4 mb-6"
                                dir={isRtl ? 'rtl' : 'ltr'}
                            >
                                {/* Verdict Box */}
                                <div className={`rounded-2xl border p-5 ${result.level === 'HIGH' ? 'border-red-500/30 bg-red-500/5' :
                                    result.level === 'MODERATE' ? 'border-orange-500/30 bg-orange-500/5' :
                                        'border-green-500/30 bg-green-500/5'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">
                                            {result.level === 'HIGH' ? '🚨' : result.level === 'MODERATE' ? '⚠️' : '✅'}
                                        </span>
                                        <div>
                                            <h4 className={`font-black text-lg ${result.level === 'HIGH' ? 'text-red-400' :
                                                result.level === 'MODERATE' ? 'text-orange-400' : 'text-green-400'
                                                }`}>
                                                مستوى السمية: {result.level === 'HIGH' ? 'مرتفع جداً' : result.level === 'MODERATE' ? 'متوسط' : 'منخفض'}
                                            </h4>
                                            <p className="text-gray-400 text-xs">درجة السمية: {result.score}/100</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-200 text-sm leading-relaxed">{result.verdict}</p>
                                </div>

                                {/* Traits */}
                                {result.traits?.length > 0 && (
                                    <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                                        <h4 className="text-gray-300 font-black text-sm mb-4">📊 مؤشرات السلوك التفصيلية</h4>
                                        <div className="flex flex-col gap-3">
                                            {result.traits.map((trait: any, i: number) => (
                                                <div key={i} className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-300">{trait.label}</span>
                                                        <span className={`text-sm font-bold ${trait.toxic ? 'text-red-400' : 'text-green-400'}`}>
                                                            {trait.value}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${trait.value}%` }}
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className={`h-full rounded-full ${trait.toxic ? 'bg-red-500' : 'bg-green-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {/* Share */}
                        <p className="text-xs text-gray-600 uppercase tracking-widest font-black text-center mb-3">Share & Save</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => shareResult('whatsapp')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 transition-colors text-sm font-bold"><MessageCircle className="w-4 h-4" />WhatsApp</button>
                            <button onClick={() => shareResult('telegram')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-bold"><Send className="w-4 h-4" />Telegram</button>
                            <button onClick={() => shareResult('native')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-bold"><Share2 className="w-4 h-4" />Share</button>
                            <button onClick={() => shareResult('download')} disabled={!audioBlob} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-bold disabled:opacity-40"><Download className="w-4 h-4" />Save Audio</button>
                        </div>
                        <button onClick={reset} className="w-full py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">Scan Again</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <RewardedAdModal
                isOpen={showAdModal}
                feature="toxic"
                onClose={() => setShowAdModal(false)}
                onComplete={() => {
                    addCreditFromAd('toxic');
                    setShowAdModal(false);
                }}
            />
        </div>
    );
};

export default ToxicDetector;
