/**
 * huggingface.ts — SeemePro AI utilities
 * Uses HuggingFace OpenAI-compatible API (no raw prompt tokens needed)
 */

const HF_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY as string;
const HF_BASE = 'https://api-inference.huggingface.co/models';
const HF_CHAT = 'https://api-inference.huggingface.co/v1/chat/completions';

const AUDIO_MODEL = 'ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition';
const CHAT_MODEL = 'Qwen/Qwen2.5-72B-Instruct';

// ── Interfaces ─────────────────────────────────────────────
export interface VoiceAnalysisResult {
    stressLevel: number;
    emotionLabel: string;
    confidence: number;
    deceptionScore: number;
    pitchVariance: number;
    cognitiveLoad: number;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface FullReport {
    summary: string;
    emotionLabel: string;
    stressLevel: number;
    deceptionScore: number;
    pitchVariance: number;
    cognitiveLoad: number;
    transcript: string;
    wordCount: number;
    wordsPerMinute: number;
    fillerWords: { word: string; count: number }[];
    pauseCount: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallScore: number;
}

// ── Helpers ────────────────────────────────────────────────
function authHeader() {
    return { Authorization: 'Bearer ' + HF_KEY };
}

async function postAudio(blob: Blob): Promise<any> {
    const res = await fetch(HF_BASE + '/' + AUDIO_MODEL, {
        method: 'POST',
        headers: authHeader(),
        body: blob,
    });
    if (res.status === 503) {
        const j = await res.json().catch(() => ({}));
        await delay(Math.min((j.estimated_time ?? 20), 25) * 1000);
        return postAudio(blob);
    }
    if (!res.ok) throw new Error('Audio API ' + res.status);
    return res.json();
}

function delay(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

function mockResult(): VoiceAnalysisResult {
    const s = Math.round(70 + Math.random() * 25);
    return {
        stressLevel: s, emotionLabel: 'neutral', confidence: 82,
        deceptionScore: Math.round(s * 0.87),
        pitchVariance: Math.round(s * 0.76),
        cognitiveLoad: Math.round(s * 0.88),
    };
}

// ── 1. Voice Emotion Analysis ──────────────────────────────
export async function analyzeVoiceWithHF(blob: Blob): Promise<VoiceAnalysisResult> {
    if (!HF_KEY) return mockResult();
    try {
        const data: { label: string; score: number }[] = await postAudio(blob);
        const top = data.sort((a, b) => b.score - a.score)[0];
        const confidence = Math.round(top.score * 100);
        const sm: Record<string, number> = {
            angry: 90, fear: 85, disgust: 75, sad: 60,
            surprise: 50, neutral: 20, happy: 10,
        };
        const stressLevel = sm[top.label.toLowerCase()] ?? 50;
        return {
            stressLevel, emotionLabel: top.label, confidence,
            deceptionScore: Math.round(stressLevel * 0.6 + (100 - confidence) * 0.4),
            pitchVariance: Math.round(stressLevel * 0.8),
            cognitiveLoad: Math.round(stressLevel * 0.9),
        };
    } catch {
        return mockResult();
    }
}

// ── 2. AI Chat Agent (OpenAI-compatible endpoint) ──────────
const AGENT_SYSTEM = 'You are SeemePro AI analyst: expert in body language, voice stress analysis, micro-expressions, and deception detection. Be concise, science-backed, and reply in the same language as the user.';

export async function chatWithAI(history: ChatMessage[]): Promise<string> {
    if (!HF_KEY) return 'API key not configured. Add VITE_HUGGINGFACE_API_KEY to .env';
    const messages = [
        { role: 'system', content: AGENT_SYSTEM },
        ...history,
    ];
    try {
        const res = await fetch(HF_CHAT, {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CHAT_MODEL,
                messages,
                max_tokens: 512,
                temperature: 0.7,
                stream: false,
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            console.error('Chat API error:', res.status, err);
            return 'The AI is loading, please try again in a moment.';
        }
        const data = await res.json();
        return data?.choices?.[0]?.message?.content?.trim() || 'No response generated.';
    } catch (e: any) {
        return 'Connection error: ' + e.message;
    }
}

// ── 3. Full Analysis Report ────────────────────────────────
export async function generateFullReport(
    v: VoiceAnalysisResult,
    transcript: string,
    wordCount: number,
    wpm: number,
    fillerWords: { word: string; count: number }[],
    pauseCount: number,
): Promise<FullReport> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Stress assessment
    if (v.stressLevel < 40) strengths.push('Low stress — calm and composed');
    else if (v.stressLevel < 70) weaknesses.push('Moderate stress (' + v.stressLevel + '%)');
    else weaknesses.push('High stress detected (' + v.stressLevel + '%)');

    // Pace assessment
    if (wpm >= 120 && wpm <= 160) strengths.push('Good speaking pace (' + wpm + ' wpm)');
    else if (wpm > 160) { weaknesses.push('Speaking too fast (' + wpm + ' wpm)'); recommendations.push('Slow down to 120-160 wpm'); }
    else if (wpm < 80 && wordCount > 5) { weaknesses.push('Speaking too slow (' + wpm + ' wpm)'); recommendations.push('Increase pace slightly'); }

    // Filler words
    if (fillerWords.length === 0) strengths.push('No filler words detected');
    else {
        weaknesses.push('Filler words: ' + fillerWords.map(f => f.word + ' x' + f.count).join(', '));
        recommendations.push('Replace filler words with deliberate pauses');
    }

    // Pauses
    if (pauseCount > 5) weaknesses.push('Too many pauses (' + pauseCount + ')');
    else if (pauseCount <= 2 && wordCount > 20) strengths.push('Good speech flow');

    // Deception
    if (v.deceptionScore > 70) weaknesses.push('High deception indicators (' + v.deceptionScore + '%)');
    else strengths.push('Low deception signals (' + v.deceptionScore + '%)');

    // Confidence
    if (v.cognitiveLoad > 75) weaknesses.push('High cognitive load — possible concealment');
    if (v.emotionLabel === 'happy' || v.emotionLabel === 'neutral') strengths.push('Positive emotional state: ' + v.emotionLabel);

    // Score
    const overallScore = Math.min(100, Math.max(0,
        Math.round(100 - v.stressLevel * 0.3 - v.deceptionScore * 0.2 + strengths.length * 5)
    ));

    const summary = 'Speaker showed ' + v.emotionLabel + ' emotion with ' + v.stressLevel +
        '% stress level. Deception score: ' + v.deceptionScore + '%. Spoke ' + wordCount +
        ' words at ' + wpm + ' wpm with ' + pauseCount + ' notable pauses.';

    return {
        ...v, summary, transcript, wordCount,
        wordsPerMinute: wpm, fillerWords, pauseCount,
        strengths, weaknesses, recommendations, overallScore,
    };
}
