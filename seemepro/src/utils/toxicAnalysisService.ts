const HF_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || "";
const HF_BASE = 'https://router.huggingface.co/hf-inference/models';
import { askGroq } from './gemini';

export interface ToxicResult {
    score: number;
    level: string;
    traits: { label: string; value: number; toxic: boolean }[];
    verdict: string;
}

async function transcribe(blob: Blob): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(`${HF_BASE}/openai/whisper-large-v3-turbo`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${HF_KEY}` },
            body: blob,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
            throw new Error("Transcribe failed: " + res.statusText);
        }
        const data = await res.json();
        if (data.error) {
            console.warn("Whisper model error or loading:", data.error);
            return "";
        }
        return data.text || "";
    } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
    }
}

export async function analyzeToxicWithOpenAI(audioBlob: Blob, language: string = 'ar'): Promise<ToxicResult> {
    try {
        let transcript = "";
        try {
            transcript = await transcribe(audioBlob);
            if (!transcript.trim()) throw new Error("Empty transcript");
        } catch (err: any) {
            console.warn("Whisper failed, using fallback empty text.", err);
            transcript = "[No transcript available - Assume highly passive aggressive silence]";
        }

        const getPrompt = (lang: string) => `Analyze the following transcript for toxic behavioral patterns. Return a JSON object ONLY.
Format MUST strictly be this JSON with text and emojis (e.g., 🚨, 🛑, ⚠️) in the labels and verdict translated strictly to this language: "${lang}". Keep the JSON keys in English.
{
  "score": 0-100 (higher means more toxic),
  "level": "HIGH" (if > 70), "MODERATE" (if > 40), "LOW" (if <= 40),
  "traits": [
    { "label": "الهيمنة 🦅", "value": 0-100, "toxic": true },
    { "label": "العدوانية 🐍", "value": 0-100, "toxic": true },
    { "label": "التعاطف 💖", "value": 0-100, "toxic": false },
    { "label": "التلاعب 🎭", "value": 0-100, "toxic": true }
  ],
  "verdict": "Detailed explanation of toxicity level, maximum 2 sentences."
}

Transcript: ${transcript}`;

        const responseText = await askGroq(getPrompt(language));
        try {
            const content = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(content);

            return {
                score: result.score || 0,
                level: result.level || "LOW",
                traits: result.traits || [],
                verdict: result.verdict || "تعذر تحديد المستوى."
            };
        } catch (parseError: any) {
            console.error("Toxic JSON parse failed:", parseError, responseText);
            return {
                score: 0,
                level: "ERROR",
                traits: [],
                verdict: "فشل في الاستخراج من الذكاء الاصطناعي."
            };
        }
    } catch (error: any) {
        console.error("Toxic analysis failed:", error);
        return {
            score: 0,
            level: "ERROR",
            traits: [],
            verdict: "⚠️ فشل في الاتصال بمحرك الذكاء الاصطناعي للاستخراج. التفاصيل: " + error.message
        };
    }
}
