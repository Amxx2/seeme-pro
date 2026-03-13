const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function askGroq(prompt: string): Promise<string> {
    try {
        if (!GROQ_KEY) throw new Error("Missing GROQ API Key");
        const res = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 4096,
                response_format: { type: "json_object" }
            })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "{}";
    } catch (err: any) {
        console.error("Groq error:", err);
        return JSON.stringify({ error: true, message: err.message });
    }
}

export const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const MODEL = "gemini-2.0-flash"; // Fallback to gemini-2.0-flash if needed

export async function askGemini(prompt: string): Promise<string> {
    try {
        if (!GEMINI_KEY) throw new Error("Missing Gemini API Key");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    responseMimeType: "application/json",
                }
            })
        });

        if (!res.ok) {
            // Fallback to gemini-1.5-pro if 2.5/flash is not accessible
            if (res.status === 404 || res.status === 400 || res.status === 429) {
                const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
                const fallbackRes = await fetch(fallbackUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            responseMimeType: "application/json",
                        }
                    })
                });
                if (!fallbackRes.ok) {
                    const err = await fallbackRes.text();
                    throw new Error("Gemini API Error (fallback): " + err);
                }
                const fallbackData = await fallbackRes.json();
                return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            }
            const err = await res.text();
            throw new Error("Gemini API Error: " + err);
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    } catch (error: any) {
        console.error("askGemini caught error:", error);
        // Determine user-friendly message
        const isQuota = error.message.includes("429") || error.message.includes("Quota");
        const msg = isQuota ? "⚠️ عذراً، تم الوصول للحد الأقصى (Quota Exceeded). يرجى المحاولة لاحقاً." : "⚠️ حدث خطأ في الاتصال بالذكاء الاصطناعي.";

        // Return a universal fallback JSON string so JSON.parse in callers succeeds
        return JSON.stringify({
            error: true,
            message: msg,
            score: 0,
            level: "ERROR",
            verdict: msg,
            traits: [],
            session_id: "ERROR",
            analysis: { summary: msg, detailed: msg, strengths: [], areas_of_concern: [] },
            scores: { confidence: 0, calm: 0, clarity: 0, authenticity: 0, overall_grade: "F" },
            emotion_bar: [],
            ai_detection: { overall_risk: "clean", risk_score: 0, signals_detected: 0, signals: {}, assessment: msg, recommended_action: msg }
        });
    }
}

export async function askGeminiWithImage(prompt: string, base64Image: string): Promise<string> {
    try {
        if (!GEMINI_KEY) throw new Error("Missing Gemini API Key");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
            }
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            if (res.status === 404 || res.status === 400 || res.status === 429) {
                const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
                const fallbackRes = await fetch(fallbackUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!fallbackRes.ok) {
                    const err = await fallbackRes.text();
                    throw new Error("Gemini API Error (fallback): " + err);
                }
                const fallbackData = await fallbackRes.json();
                return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            }
            const err = await res.text();
            throw new Error("Gemini API Error: " + err);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    } catch (error: any) {
        console.error("askGeminiWithImage caught error:", error);
        const isQuota = error.message.includes("429") || error.message.includes("Quota");
        const msg = isQuota ? "⚠️ عذراً، تم الوصول للحد الأقصى (Quota Exceeded). يرجى المحاولة لاحقاً." : "⚠️ حدث خطأ في الاتصال بالذكاء الاصطناعي.";

        return JSON.stringify({
            error: true,
            message: msg,
            session: { id: "ERROR", frame_number: 0, timestamp: "00:00", language: "ar", baseline_established: false, calibration_progress: 0 },
            scores: { confidence: 0, calmness: 0, clarity: 0, authenticity: 0, engagement: 0, congruence: 0, overall_grade: "F" },
            emotion_bar: [],
            overlays: {
                face: { color: "#FF3B30", label: "خطأ", stress_level: "high" },
                eyes: { color: "#FF3B30", label: "خطأ", gaze: "unknown" },
                mouth: { color: "#FF3B30", label: "خطأ", speech: "unknown" },
                shoulders: { color: "#FF3B30", label: "خطأ", posture: "unknown" },
                hands: { color: "#FF3B30", label: "خطأ", gesture: "unknown" },
                fullbody: { color: "#FF3B30", label: "خطأ", orientation: "unknown" }
            },
            facs_detected: [],
            ai_detection: { overall_risk: "clean", risk_score: 0, signals_detected: 0, signals: {}, assessment: msg, recommended_action: msg },
            baseline: { established: false, progress_pct: 0, deviation_from_baseline: "none", note: msg },
            body_language: [],
            coaching_note: msg,
            disclaimer: msg,
            alert: { message: msg, level: "high", type: "error" }
        });
    }
}
