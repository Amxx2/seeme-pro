const HF_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || "";
const HF_BASE = 'https://router.huggingface.co/hf-inference/models';
import { askGroq } from './gemini';

export interface HungerResult {
    score: number;
    level: string;
    emoji: string;
    verdict: string;
    traits: { key: string; label: string; value: number }[];
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

export async function analyzeHungerWithOpenAI(audioBlob: Blob, language: string = 'ar'): Promise<HungerResult> {
    try {
        let transcript = "";
        try {
            transcript = await transcribe(audioBlob);
            if (!transcript.trim()) throw new Error("Empty transcript");
        } catch (err: any) {
            console.warn("Whisper failed, using fallback empty text.", err);
            transcript = "[No transcript available - Assume hungry/impatient breathing patterns]";
        }

        const getPrompt = (lang: string) => `Analyze the following transcript to detect if the speaker is hungry (hanger/irritability). Return JSON ONLY.
Format MUST strictly be this JSON with text and emojis (e.g., 🍔, 😡, 🥱) in the verdict and labels translated strictly to this language: "${lang}". Keep the JSON keys in English.
{
  "score": 0-100 (higher means hungrier),
  "level": "STARVING" (if > 70), "HUNGRY" (if > 45), "PECKISH" (if > 20), "FULLY FED" (if <= 20),
  "emoji": "🫠" for STARVING, "😤" for HUNGRY, "😐" for PECKISH, "😊" for FULLY FED,
  "verdict": "Detailed analysis of hunger markers like vocal irritability or impatience.",
  "traits": [
    { "key": "irritability", "label": "التهيج 😤", "value": 0-100 },
    { "key": "energy", "label": "الطاقة 📉", "value": 0-100 },
    { "key": "dryness", "label": "الجفاف 🏜️", "value": 0-100 },
    { "key": "patience", "label": "الصبر ⏳", "value": 0-100 }
  ]
}

Transcript: ${transcript}`;

        const responseText = await askGroq(getPrompt(language));
        try {
            const content = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(content);

            return {
                score: result.score || 0,
                level: result.level || "FULLY FED",
                emoji: result.emoji || "😊",
                verdict: result.verdict || "تعذر تحديد المستوى.",
                traits: result.traits || []
            };
        } catch (parseError: any) {
            console.error("Hunger JSON parse failed:", parseError, responseText);
            return {
                score: 0,
                level: "ERROR",
                emoji: "⚠️",
                verdict: "فشل في الاستخراج من الذكاء الاصطناعي.",
                traits: []
            };
        }
    } catch (error: any) {
        console.error("Hunger analysis failed:", error);
        return {
            score: 0,
            level: "ERROR",
            emoji: "⚠️",
            verdict: "فشل في الاتصال بمحرك الذكاء الاصطناعي للاستخراج. التفاصيل: " + error.message,
            traits: []
        };
    }
}
