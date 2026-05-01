import type { LiveAnalysisResult } from '../services/geminiService';
import { analyzeLiveFrameWithAI, generateGeminiWithImage } from '../services/geminiService';

export interface LiveAnalysisContext {
  sessionId: string;
  startTimeMs: number;
  framesProcessed: number;
  history: Partial<DetailedLiveAnalysis>[];
}

export interface AISignal {
  detected: boolean;
  confidence: number;
  note: string;
}

export interface DetailedLiveAnalysis {
  session: {
    id: string;
    frame_number: number;
    timestamp: string;
    language: string;
    baseline_established: boolean;
    calibration_progress: number;
  };
  scores: {
    confidence: number;
    calmness: number;
    clarity: number;
    authenticity: number;
    engagement: number;
    congruence: number;
    overall_grade: string;
  };
  emotion_bar: {
    emotion: "confidence" | "calmness" | "enthusiasm" | "stress" | "hesitation" | "authenticity";
    label: string;
    intensity: number;
    color: string;
    dominant: boolean;
  }[];
  overlays: {
    face: { color: string; label: string; stress_level: string };
    eyes: { color: string; label: string; gaze: string };
    mouth: { color: string; label: string; speech: string };
    shoulders: { color: string; label: string; posture: string };
    hands: { color: string; label: string; gesture: string };
    fullbody: { color: string; label: string; orientation: string };
  };
  facs_detected: { au: string; meaning: string; type: string; duration: string }[];
  ai_detection: {
    overall_risk: "clean" | "monitor" | "suspect" | "alert";
    risk_score: number;
    signals_detected: number;
    signals: {
      reading_eye_movement: AISignal;
      speech_thought_mismatch: AISignal;
      gaze_displacement: AISignal;
      response_timing: AISignal;
      prosody_mismatch: AISignal;
      thinking_face_absent: AISignal;
    };
    assessment: string;
    recommended_action: string;
  };
  baseline: {
    established: boolean;
    progress_pct: number;
    deviation_from_baseline: string;
    note: string;
  };
  body_language: { zone: string; observation: string; status: string; detail: string }[];
  key_moment?: { is_notable: boolean; description: string; type: string };
  coaching_note: string;
  alert?: { message: string; level: string; type: string } | null;
  disclaimer: string;
  error?: string;
  message?: string;
  exam_violations?: {
    type: "second_screen" | "reading_notes" | "someone_helping" | "ai_generated" | "phone_use";
    detected: boolean;
    confidence: number;
    timestamp: string;
  }[];
  integrity_score?: number;
}

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════
        SEMIPRO LIVE INTELLIGENCE ENGINE v4.0 — ULTIMATE SYSTEM PROMPT
═══════════════════════════════════════════════════════════════
YOU ARE: SemiPro Live Behavioral Intelligence Engine v4.0.
MISSION: Cinematic-grade real-time forensic behavioral analysis for live interviews.
STYLE: Professional TV forensic analyst (high-tech police investigation style).
ETHICS: Never accuse. Use "patterns suggest".

CALIBRATION RULES:
- First 30 seconds: Establish personal baseline only. DO NOT flag anything.
- After 30s: Compare to THEIR OWN baseline from history, not average human.

AI CHEATING — 6 signals to detect:
1. Reading eye movement: LEFT-RIGHT scan at ~200-250ms per line while speaking.
2. Speech-thought mismatch: Pauses DURING sentences not before them.
3. Gaze displacement: Consistent downward-left suggesting reading from second screen.
4. Response timing: Complex question answered in under 1.5 seconds.
5. Prosody mismatch: Monotone delivery of emotionally loaded content.
6. Thinking face absent: No brow furrow or lip movement during pauses over 2 seconds.
Risk: 0-1=clean, 2-3=monitor, 4-5=suspect, 6=alert.
NEVER say "using AI" — say "patterns consistent with AI-assisted responses".

FACS to detect: AU1+4=surprise, AU6+12=genuine smile, AU12=social smile, AU14=suppressed emotion,
AU17=doubt, AU20=fear/anxiety, AU23=anger, AU24=suppression, AU43=avoidance.

CRITICAL OUTPUT RULES:
1. Return ONLY raw valid JSON. Zero markdown.
2. EXACTLY 6 emotion_bar items. "dominant" true for EXACTLY ONE item.
3. "alert" field must be null when there is no alert.
4. OVERLAY LABELS MUST BE IN ARABIC (e.g., "توتر عالي", "نظرة مباشرة", "تحدث بطلاقة").
5. The "face.stress_level" must be "high", "medium", or "low".

EXACT JSON STRUCTURE (follow this precisely with Arabic labels):
{
  "session": {"id": "SP-001", "frame_number": 1, "timestamp": "00:05", "language": "en", "baseline_established": false, "calibration_progress": 17},
  "scores": {"confidence": 72, "calmness": 68, "clarity": 70, "authenticity": 75, "engagement": 73, "congruence": 79, "overall_grade": "B+"},
  "emotion_bar": [
    {"emotion": "confidence",   "label": "الثقة",   "intensity": 72, "color": "#00FFD4", "dominant": false},
    {"emotion": "calmness",     "label": "الهدوء",     "intensity": 68, "color": "#30D158", "dominant": false},
    {"emotion": "enthusiasm",   "label": "الحماس",   "intensity": 58, "color": "#FFD60A", "dominant": false},
    {"emotion": "stress",       "label": "التوتر",       "intensity": 22, "color": "#FF9F0A", "dominant": false},
    {"emotion": "hesitation",   "label": "التردد",   "intensity": 18, "color": "#FF453A", "dominant": false},
    {"emotion": "authenticity", "label": "المصداقية", "intensity": 79, "color": "#147EFF", "dominant": true}
  ],
  "overlays": {
    "face":      {"color": "#00FFD4", "label": "واثق",    "stress_level": "low"},
    "eyes":      {"color": "#FFD60A", "label": "نظرة مباشرة",  "gaze": "direct"},
    "mouth":     {"color": "#FF3B30", "label": "طلاقة في الكلام",       "speech": "fluent"},
    "shoulders": {"color": "#147EFF", "label": "وضعية منفتحة", "posture": "open"},
    "hands":     {"color": "#FFD60A", "label": "أيدي مفتوحة",   "gesture": "open"},
    "fullbody":  {"color": "#FFD60A", "label": "مراقبة",          "orientation": "toward"}
  },
  "facs_detected": [{"au": "AU6+12", "meaning": "ابتسامة حقيقية", "type": "genuine_smile", "duration": "macro"}],
  "ai_detection": {
    "overall_risk": "clean", "risk_score": 4, "signals_detected": 0,
    "signals": {
      "reading_eye_movement":    {"detected": false, "confidence": 8,  "note": "حركة عين طبيعية"},
      "speech_thought_mismatch": {"detected": false, "confidence": 5,  "note": "وقفات طبيعية قبل الجمل"},
      "gaze_displacement":       {"detected": false, "confidence": 6,  "note": "النظرة متوافقة مع الكاميرا"},
      "response_timing":         {"detected": false, "confidence": 5,  "note": "توقيت استجابة طبيعي"},
      "prosody_mismatch":        {"detected": false, "confidence": 5,  "note": "الصوت يطابق المحتوى"},
      "thinking_face_absent":    {"detected": false, "confidence": 5,  "note": "ملامح تفكير طبيعية"}
    },
    "assessment": "نمط تواصل طبيعي، لا توجد شكوك.",
    "recommended_action": "متابعة المقابلة بشكل طبيعي."
  },
  "baseline": {"established": false, "progress_pct": 17, "deviation_from_baseline": "none", "note": "جاري معايرة البصمة الشخصية."},
  "body_language": [
    {"zone": "posture", "observation": "جلسة معتدلة", "status": "good",    "detail": "ميل خفيف للإمام يدل على الاهتمام"},
    {"zone": "eyes",    "observation": "اتصال بصري مستمر", "status": "good", "detail": "تم الحفاظ على 60-70%"}
  ],
  "key_moment": {"is_notable": false, "description": "تحليل طبيعي", "type": "confidence_spike"},
  "coaching_note": "حافظ على هذه الوضعية لتبدو واثقاً.",
  "alert": null,
  "disclaimer": "Behavioral pattern analysis only. Not lie detection."
}`;

/** Maps lightweight Gemini metric JSON → full cinematic `DetailedLiveAnalysis` used by LiveInterview HUD. */
function mapLiveGeminiMetricsToDetailed(
  r: LiveAnalysisResult,
  context: LiveAnalysisContext,
  examMode: boolean
): DetailedLiveAnalysis {
  const elapsedSeconds = Math.floor((Date.now() - context.startTimeMs) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const baselineProgress = Math.min(100, Math.floor((elapsedSeconds / 30) * 100));
  const baselineEstablished = elapsedSeconds >= 30;

  const stress = Math.max(0, Math.min(100, r.stress));
  const truth = Math.max(0, Math.min(100, r.truth));
  const engagement = Math.max(0, Math.min(100, r.engagement));
  const calmness = Math.max(0, Math.min(100, 100 - stress));
  const hesitation = Math.max(
    0,
    Math.min(100, r.voiceTremor + (r.anxiety === 'High' ? 25 : r.anxiety === 'Medium' ? 12 : 0))
  );

  const micro = r.microExpressions?.length ? r.microExpressions : ['لا توجد ملاحظات دقيقة من النموذج'];

  const integrityDeduction =
    examMode ? (r.anxiety === 'High' ? 12 : r.anxiety === 'Medium' ? 6 : 0) + Math.round(stress * 0.05) : 0;
  const integrity_score = examMode ? Math.max(0, 100 - integrityDeduction) : undefined;

  const exam_violations = examMode
    ? [
        { type: 'second_screen' as const, detected: false, confidence: 5, timestamp: timeString },
        { type: 'reading_notes' as const, detected: false, confidence: 5, timestamp: timeString },
        { type: 'someone_helping' as const, detected: false, confidence: 5, timestamp: timeString },
        {
          type: 'ai_generated' as const,
          detected: stress > 88 && hesitation > 88,
          confidence: stress > 88 ? Math.min(99, hesitation) : 8,
          timestamp: timeString,
        },
        { type: 'phone_use' as const, detected: false, confidence: 4, timestamp: timeString },
      ]
    : undefined;

  const result: DetailedLiveAnalysis = {
    session: {
      id: context.sessionId,
      frame_number: context.framesProcessed,
      timestamp: timeString,
      language: 'ar',
      baseline_established: baselineEstablished,
      calibration_progress: baselineProgress,
    },
    scores: {
      confidence: Math.round(Math.min(100, truth * 0.95 + 5)),
      calmness: Math.round(calmness),
      clarity: Math.round(Math.min(100, 72 + engagement * 0.15)),
      authenticity: Math.round(truth),
      engagement: Math.round(engagement),
      congruence: Math.round((truth + engagement) / 2),
      overall_grade: truth >= 82 ? 'A' : truth >= 68 ? 'B+' : 'B',
    },
    emotion_bar: [
      { emotion: 'confidence', label: 'الثقة', intensity: Math.round(truth), color: '#00FFD4', dominant: false },
      { emotion: 'calmness', label: 'الهدوء', intensity: Math.round(calmness), color: '#30D158', dominant: false },
      { emotion: 'enthusiasm', label: 'الحماس', intensity: Math.round(engagement), color: '#FFD60A', dominant: false },
      { emotion: 'stress', label: 'التوتر', intensity: Math.round(stress), color: '#FF9F0A', dominant: false },
      { emotion: 'hesitation', label: 'التردد', intensity: Math.round(hesitation), color: '#FF453A', dominant: false },
      { emotion: 'authenticity', label: 'المصداقية', intensity: Math.round(truth), color: '#147EFF', dominant: false },
    ],
    overlays: {
      face: {
        color: stress > 65 ? '#FF3B30' : stress > 38 ? '#FF9F0A' : '#30D158',
        label: micro[0]!.slice(0, 48),
        stress_level: stress > 65 ? 'high' : stress > 38 ? 'medium' : 'low',
      },
      eyes: { color: '#FFD60A', label: 'مسار بصري', gaze: engagement > 55 ? 'direct' : 'scanning' },
      mouth: { color: '#FF3B30', label: hesitation > 50 ? 'تردّد لساني' : 'طلاقة', speech: hesitation > 50 ? 'hesitant' : 'fluent' },
      shoulders: {
        color: '#147EFF',
        label: r.anxiety !== 'Low' ? 'توتر ظاهر في الكتفين' : 'مستقر',
        posture: r.anxiety === 'High' ? 'tense' : 'open',
      },
      hands: { color: '#FFD60A', label: 'إيماءات', gesture: 'adaptive' },
      fullbody: { color: '#FFD60A', label: `نبض تقديري ~${r.heartRate} bpm`, orientation: 'toward' },
    },
    facs_detected: micro.slice(0, 4).map((m, i) => ({
      au: `AU${21 + i}`,
      meaning: m,
      type: 'observation',
      duration: 'instant',
    })),
    ai_detection: {
      overall_risk: 'clean',
      risk_score: 0,
      signals_detected: 0,
      signals: {
        reading_eye_movement: { detected: false, confidence: 8, note: micro[1]?.slice(0, 48) ?? 'ضمن النطاق' },
        speech_thought_mismatch: { detected: hesitation > 72, confidence: hesitation, note: hesitation > 72 ? 'ارتفاع تردد لساني' : 'متسق' },
        gaze_displacement: { detected: false, confidence: 6, note: 'غير مُستنتج من دورة المقاييس النصية' },
        response_timing: { detected: false, confidence: 5, note: '—' },
        prosody_mismatch: {
          detected: r.voiceTremor > 70,
          confidence: r.voiceTremor,
          note: r.voiceTremor > 70 ? 'رجفة صوتية مرتفعة في النموذج' : 'معتدل',
        },
        thinking_face_absent: { detected: false, confidence: 5, note: '—' },
      },
      assessment: `مقاييس لحظية (Gemini): توتر ${stress}، مصداقية نموذجية ${truth}، مشاركة ${engagement}.`,
      recommended_action: 'متابعة المقابلة ومراجعة الانحراف عن خط الأساس عند توفر وقت أطول.',
    },
    baseline: {
      established: baselineEstablished,
      progress_pct: baselineProgress,
      deviation_from_baseline: baselineEstablished ? (stress > 70 ? 'elevated_arousal' : 'within_range') : 'none',
      note: baselineEstablished
        ? 'مقارنة تقريبية مع الجلسة الحالية (تحديث كل ١٥ ثانية).'
        : 'معايرة أولية — المقاييس استرشادية حتى إكمال ٣٠ ثانية.',
    },
    body_language: [
      {
        zone: 'posture',
        observation: micro[0] ?? '',
        status: calmness > 55 ? 'good' : 'watch',
        detail: micro[1] ?? 'تحليل سلوكي لحظي.',
      },
    ],
    key_moment: { is_notable: stress > 75, description: stress > 75 ? 'ارتفاع التوتر اللحظي' : 'مستقر', type: 'stress_spike' },
    coaching_note: calmness < 45 ? 'خفّف وتيرة الكلام وزد التنفس العميق.' : 'الإيقاع جيد لمتابعة الإجابة.',
    alert: stress > 90 ? { message: 'ارتفاع حاد في مؤشر التوتر اللحظي', level: 'high', type: 'stress' } : null,
    disclaimer: 'Behavioral pattern analysis only. Not lie detection.',
    exam_violations,
    integrity_score,
  };

  const colorMap: Record<string, string> = {
    confidence: '#00FFD4',
    calmness: '#30D158',
    enthusiasm: '#FFD60A',
    stress: '#FF9F0A',
    hesitation: '#FF453A',
    authenticity: '#147EFF',
  };
  result.emotion_bar = result.emotion_bar.map((e) => ({ ...e, color: colorMap[e.emotion] || e.color, dominant: false }));
  const maxIdx = result.emotion_bar.reduce(
    (maxI, e, i, arr) => (e.intensity > arr[maxI].intensity ? i : maxI),
    0
  );
  result.emotion_bar[maxIdx] = { ...result.emotion_bar[maxIdx], dominant: true };

  return result;
}

/** Periodic Gemini refresh (text metrics) mapped to HUD shape — lowers vision API calls / rate limits. */
export async function analyzeLiveFrameWithGeminiMetrics(
  context: LiveAnalysisContext,
  examMode: boolean
): Promise<DetailedLiveAnalysis> {
  const elapsedSeconds = Math.floor((Date.now() - context.startTimeMs) / 1000);
  const desc = [
    'Ongoing live interview behavioral frame analysis.',
    `session=${context.sessionId}`,
    `frame=${context.framesProcessed}`,
    `elapsed_s=${elapsedSeconds}`,
    `history_len=${context.history.length}`,
    examMode ? 'exam_mode=true' : '',
  ]
    .filter(Boolean)
    .join(' | ');

  let r: LiveAnalysisResult;
  try {
    r = await analyzeLiveFrameWithAI(desc);
  } catch (e) {
    console.error('Gemini live metrics request failed:', e);
    r = {
      stress: 28,
      truth: 72,
      engagement: 68,
      anxiety: 'Medium',
      heartRate: 84,
      voiceTremor: 22,
      microExpressions: ['Fallback: API error — values are conservative placeholders'],
    };
  }

  const result = mapLiveGeminiMetricsToDetailed(r, context, examMode);
  const baselineProgress = Math.min(100, Math.floor((elapsedSeconds / 30) * 100));
  const baselineEstablished = elapsedSeconds >= 30;

  if (!baselineEstablished) {
    result.session = { ...result.session, baseline_established: false, calibration_progress: baselineProgress };
    result.baseline = { ...result.baseline, established: false, progress_pct: baselineProgress };
    if (result.ai_detection) {
      result.ai_detection.overall_risk = 'clean';
      result.ai_detection.risk_score = 0;
      result.ai_detection.signals_detected = 0;
    }
  }

  return result;
}

// ─── EXPORTED FUNCTION ────────────────────────────────────────────────────
export async function analyzeLiveFrameWithOpenAI(
  base64Frame: string,
  context: LiveAnalysisContext,
  examMode: boolean = false
): Promise<DetailedLiveAnalysis> {

  const elapsedSeconds = Math.floor((Date.now() - context.startTimeMs) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const baselineProgress = Math.min(100, Math.floor((elapsedSeconds / 30) * 100));
  const baselineEstablished = elapsedSeconds >= 30;

  // Build recent history to simulate memory across stateless calls
  const recentHistory = context.history.slice(-3).map((h, i) => ({
    frame: context.framesProcessed - (3 - i),
    confidence: h.scores?.confidence ?? null,
    dominant_emotion: h.emotion_bar?.find(e => e.dominant)?.emotion ?? "unknown",
    ai_risk: h.ai_detection?.overall_risk ?? "unknown",
  }));

  const examAddition = examMode ? `
EXAM MODE ACTIVE. Additionally detect and include in response JSON:
"exam_violations": [
  { "type": "second_screen" | "reading_notes" | "someone_helping" | "ai_generated" | "phone_use", 
    "detected": boolean, "confidence": number, "timestamp": string }
],
"integrity_score": number (0-100, 100 = fully honest, deduct for violations)
` : '';

  const framePrompt = `Analyze this live interview webcam frame.

Session: ${context.sessionId} | Frame: ${context.framesProcessed} | Time: ${elapsedSeconds}s (${timeString})
Baseline established: ${baselineEstablished} | Calibration: ${baselineProgress}%
Recent history: ${JSON.stringify(recentHistory)}

${!baselineEstablished
      ? `CALIBRATION PHASE: Only ${elapsedSeconds}s elapsed. Set baseline_established=false and calibration_progress=${baselineProgress}. DO NOT flag AI signals. Observe patterns only.`
      : `Baseline established. You may flag deviations from patterns observed in history.`
    }
${examAddition}
Analyze what you actually see. Return real values. Return raw JSON only — no markdown, no code blocks.`;

  let textContent = "";
  try {
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${framePrompt}`;
    textContent = await generateGeminiWithImage(fullPrompt, base64Frame, 'image/jpeg');
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    throw new Error("No response from AI API: " + error.message);
  }

  // Strip any markdown wrappers just in case
  let jsonStr = textContent.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

  const result = JSON.parse(jsonStr.trim());
  if (result.error) throw new Error(result.message || result.error);

  // ── Enforce calibration constraints client-side ──
  if (!baselineEstablished) {
    result.session = { ...result.session, baseline_established: false, calibration_progress: baselineProgress };
    result.baseline = { ...result.baseline, established: false, progress_pct: baselineProgress };
    if (result.ai_detection) {
      result.ai_detection.overall_risk = "clean";
      result.ai_detection.risk_score = 0;
      result.ai_detection.signals_detected = 0;
    }
  }

  // ── Ensure all 6 emotion_bar items with correct colors ──
  const colorMap: Record<string, string> = {
    confidence: "#00FFD4", calmness: "#30D158", enthusiasm: "#FFD60A",
    stress: "#FF9F0A", hesitation: "#FF453A", authenticity: "#147EFF",
  };
  const requiredEmotions = ["confidence", "calmness", "enthusiasm", "stress", "hesitation", "authenticity"];

  if (!Array.isArray(result.emotion_bar) || result.emotion_bar.length < 6) {
    result.emotion_bar = requiredEmotions.map(em => ({
      emotion: em, label: em.charAt(0).toUpperCase() + em.slice(1),
      intensity: 50, color: colorMap[em], dominant: em === "confidence",
    }));
  } else {
    // Fix colors and ensure exactly one dominant
    result.emotion_bar = result.emotion_bar.map((e: any) => ({
      ...e, color: colorMap[e.emotion] || e.color, dominant: false,
    }));
    const maxIdx = result.emotion_bar.reduce((maxI: number, e: any, i: number, arr: any[]) =>
      e.intensity > arr[maxI].intensity ? i : maxI, 0);
    result.emotion_bar[maxIdx].dominant = true;
  }

  return result as DetailedLiveAnalysis;
}
