import { askGeminiWithImage } from './gemini';

export interface DetailedVideoAnalysis {
  session_id: string;
  timestamp: string;
  overall_grade: string;
  scores: {
    confidence: number;
    authenticity: number;
    engagement: number;
    calmness: number;
    congruence: number;
  };
  zones: {
    face?: { label: string; overlay_color: string; stress_level?: string; emotion?: string };
    eyes?: { label: string; overlay_color: string; gaze?: string };
    mouth?: { label: string; overlay_color: string };
    shoulders?: { label: string; overlay_color: string };
    hands?: { label: string; overlay_color: string };
    fullbody?: { label: string; overlay_color: string };
  };
  facs_detected: { au: string; meaning: string; intensity: number }[];
  emotion_bar: { label: string; intensity: number; color: string; dominant: boolean }[];
  body_language: { zone: string; observation: string; detail: string; status: string }[];
  analysis: {
    summary: string;
    detailed: string;
    strengths: string[];
    areas_of_concern: string[];
  };
  coaching_tips: { priority: string; tip: string; example: string }[];
  red_flags: string[];
  disclaimer: string;
  error?: string;
  message?: string;
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const getPrompt = (lang: string) => `You are SemiPro Video Intelligence Engine. Analyze this video frame forensically.
Return ONLY raw JSON matching this EXACT structure, no markdown, no explanation.
CRITICAL: ALL textual values (labels, meanings, summaries, tips, etc.) MUST be strictly translated and written in this language: "${lang}". Keep the JSON keys in English.

{
  "session_id": "SP-VID-1234",
  "timestamp": "00:02",
  "overall_grade": "B+",
  "scores": {
    "confidence": 78,
    "authenticity": 65,
    "engagement": 80,
    "calmness": 70,
    "congruence": 72
  },
  "zones": {
    "face": { "label": "تعبير محايد مع توتر خفي", "overlay_color": "#FF9F0A", "stress_level": "medium", "emotion": "neutral" },
    "eyes": { "label": "تواصل بصري جيد", "overlay_color": "#FFD60A", "gaze": "direct" },
    "mouth": { "label": "شفاه مضغوطة", "overlay_color": "#FF3B30" },
    "shoulders": { "label": "كتفان مرتفعان - توتر", "overlay_color": "#147EFF" },
    "hands": { "label": "يدان هادئتان", "overlay_color": "#30D158" },
    "fullbody": { "label": "وضعية دفاعية", "overlay_color": "#FFD60A" }
  },
  "facs_detected": [
    { "au": "AU4", "meaning": "انقباض الحاجب - قلق", "intensity": 0.7 },
    { "au": "AU7", "meaning": "شد الجفن - تركيز عالٍ", "intensity": 0.5 }
  ],
  "emotion_bar": [
    { "label": "ثقة", "intensity": 78, "color": "#00FFD4", "dominant": true },
    { "label": "توتر", "intensity": 45, "color": "#FF453A", "dominant": false },
    { "label": "تركيز", "intensity": 60, "color": "#147EFF", "dominant": false }
  ],
  "body_language": [
    { "zone": "الوجه", "observation": "تعبير محكوم", "detail": "عضلات الفك مشدودة", "status": "neutral" },
    { "zone": "العيون", "observation": "تواصل بصري ثابت", "detail": "معدل الرمش طبيعي", "status": "good" }
  ],
  "analysis": {
    "summary": "🎯 تحليل شامل: المرشح يُظهر ثقة معقولة...",
    "detailed": "📊 التحليل التفصيلي: ...",
    "strengths": ["✅ تواصل بصري جيد", "✅ وضعية منتصبة"],
    "areas_of_concern": ["⚠️ توتر في منطقة الكتفين", "⚠️ شفاه مضغوطة"]
  },
  "coaching_tips": [
    { "priority": "high", "tip": "استرخِ كتفيك", "example": "خذ نفساً عميقاً قبل الإجابة" }
  ],
  "red_flags": [],
  "disclaimer": "AI Analysis Disclaimer"
}`;


// ─── HELPER: EXTRACT FRAME ───────────────────────────────────────────────────
export async function extractFrameFromVideo(videoBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.onloadeddata = () => {
      video.currentTime = Math.min(2, video.duration * 0.1);
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    video.onerror = reject;
  });
}

// ─── MAIN EXPORTS ─────────────────────────────────────────────────────────────
export async function analyzeVideoFrameWithOpenAI(base64: string, language: string = 'ar'): Promise<DetailedVideoAnalysis> {
  try {
    const textContent = await askGeminiWithImage(
      getPrompt(language),
      base64
    );

    let jsonStr = textContent.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

    const result = JSON.parse(jsonStr.trim());
    return result as DetailedVideoAnalysis;
  } catch (error: any) {
    console.error("Video analysis error:", error);
    return {
      session_id: "SP-ERROR",
      timestamp: "00:00",
      overall_grade: "F",
      scores: { confidence: 0, calmness: 0, authenticity: 0, engagement: 0, congruence: 0 },
      zones: {},
      facs_detected: [],
      emotion_bar: [],
      body_language: [],
      analysis: {
        summary: "⚠️ فشل في الاتصال بمحرك الذكاء الاصطناعي.",
        detailed: "لم نتمكن من تحليل الفيديو. التفاصيل: " + error.message,
        strengths: [],
        areas_of_concern: []
      },
      coaching_tips: [],
      red_flags: [],
      disclaimer: "AI Analysis Error",
      error: "API Error",
      message: error.message
    } as DetailedVideoAnalysis;
  }
}

export async function analyzeVideoWithOpenAI(videoBlob: Blob, language: string = 'ar'): Promise<DetailedVideoAnalysis> {
  const base64Image = await extractFrameFromVideo(videoBlob);
  return analyzeVideoFrameWithOpenAI(base64Image, language);
}
