export interface DetailedVoiceAnalysis {
  session_id: string;
  timestamp: string;
  duration_seconds: number;
  language_detected: string;
  scores: {
    confidence: number;
    calm: number;
    clarity: number;
    authenticity: number;
    overall_grade: string;
  };
  acoustic_data: {
    avg_pitch_hz: number;
    speech_rate_wpm: number;
    filler_word_count: number;
    pause_count: number;
    voice_energy_level: string;
  };
  emotions: {
    label: string;
    type: string;
    intensity: number;
    timestamp_detected: string;
  }[];
  answer_segments: {
    segment: string;
    confidence_level: string;
    notable_pattern: string;
  }[];
  analysis: {
    summary: string;
    detailed: string;
    strengths: string[];
    areas_of_concern: string[];
  };
  coaching_tips: {
    priority: string;
    tip: string;
    example: string;
  }[];
  red_flags: {
    flag: string;
    severity: string;
    timestamp: string;
    recommendation: string;
  }[];
  disclaimer: string;
  recommended_followup_questions: string[];
  error?: string;
  message?: string;
}

const HF_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || "";
const HF_BASE = 'https://router.huggingface.co/hf-inference/models';
import { askGroq } from './gemini';

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function transcribe(blob: Blob): Promise<string> {
  const res = await fetch(`${HF_BASE}/openai/whisper-large-v3-turbo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_KEY}` },
    body: blob
  });
  if (!res.ok && res.status !== 503) {
    throw new Error("Transcribe failed: " + res.statusText);
  }
  const data = await res.json();
  if (data.error && data.estimated_time) {
    await delay(Math.min(data.estimated_time * 1000, 10000));
    return transcribe(blob);
  }
  return data.text || "";
}

export async function analyzeVoiceWithOpenAI(audioBlob: Blob, transcript: string = "", language: string = 'ar'): Promise<any> {
  let finalText = transcript;
  if (!finalText || finalText.trim().length === 0) {
    try {
      finalText = await transcribe(audioBlob);
    } catch (err: any) {
      console.warn("Whisper failed, using fallback empty text.", err);
      finalText = "[No transcript available - Audio only analysis. Assume hesitant speech patterns.]";
    }
  }

  const getPrompt = (lang: string) => `You are SemiPro Voice Intelligence Engine — an expert behavioral analyst.
Analyze the following interview transcript/audio proxy and provide a forensic vocal behavioral assessment in JSON format.
Return ONLY raw JSON matching this EXACT structure, no markdown, no explanation.
CRITICAL: ALL textual values (labels, summaries, strengths, tips, read_flags, etc.) MUST be strictly translated and written in this language: "${lang}". Keep the JSON keys in English.
Add rich emojis inside the text for "summary", "detailed", "strengths", "areas_of_concern", "tips", and "red_flags" (e.g. 🚨, 💡, 🛡️, 🟢, 🔴).

{
  "session_id": "SP-V-1234",
  "timestamp": "Time",
  "duration_seconds": 60,
  "language_detected": "ar",
  "scores": { "confidence": 85, "calm": 70, "clarity": 80, "authenticity": 90, "overall_grade": "A" },
  "acoustic_data": { "avg_pitch_hz": 120, "speech_rate_wpm": 130, "filler_word_count": 2, "pause_count": 3, "voice_energy_level": "moderate" },
  "emotions": [ { "label": "Confidence", "type": "positive", "intensity": 80, "timestamp_detected": "0:05" } ],
  "answer_segments": [ { "segment": "...", "confidence_level": "low", "notable_pattern": "filler word usage" } ],
  "analysis": { "summary": "...", "detailed": "...", "strengths": [".."], "areas_of_concern": [".."] },
  "coaching_tips": [ { "priority": "high", "tip": "...", "example": "..." } ],
  "red_flags": [],
  "disclaimer": "AI Analysis Disclaimer",
  "recommended_followup_questions": ["..."]
}

Transcript:
${finalText}`;

  try {
    const responseText = await askGroq(getPrompt(language));
    const textContent = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(textContent);

    result.emotions = result.emotions || [];
    result.answer_segments = result.answer_segments || [];
    result.coaching_tips = result.coaching_tips || [];
    result.red_flags = result.red_flags || [];
    result.recommended_followup_questions = result.recommended_followup_questions || [];

    return result;
  } catch (error: any) {
    console.error("Voice analysis error:", error);
    // Fallback JSON so UI doesn't crash/hang
    return {
      session_id: "SP-V-ERROR",
      timestamp: new Date().toISOString(),
      duration_seconds: 0,
      language_detected: "unknown",
      scores: { confidence: 50, calm: 50, clarity: 50, authenticity: 50, overall_grade: "N/A" },
      acoustic_data: { avg_pitch_hz: 0, speech_rate_wpm: 0, filler_word_count: 0, pause_count: 0, voice_energy_level: "low" },
      emotions: [],
      answer_segments: [],
      analysis: {
        summary: "⚠️ فشل في الاتصال بمحرك الذكاء الاصطناعي.",
        detailed: "لم نتمكن من تحليل الصوت بسبب مشاكل في الاتصال (Error: " + error.message + ").",
        strengths: [],
        areas_of_concern: []
      },
      coaching_tips: [],
      red_flags: [],
      disclaimer: "AI Analysis Disclaimer",
      recommended_followup_questions: [],
      error: "API Error",
      message: error.message
    };
  }
}

