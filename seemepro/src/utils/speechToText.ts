/**
 * speechToText.ts — Web Speech API wrapper
 * Live transcript + filler words + pauses + WPM analysis
 */

export interface SpeechAnalysis {
    fullTranscript: string;
    wordCount: number;
    fillerWords: { word: string; count: number }[];
    pauseCount: number;
    wordsPerMinute: number;
    durationSeconds: number;
}

const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'i mean', 'so', 'well', 'right', 'okay', 'hmm', 'er', 'ah'];

interface SREvent {
    resultIndex: number;
    results: { [i: number]: { [i: number]: { transcript: string }; isFinal: boolean }; length: number };
}

export class SpeechToTextService {
    private sr: any = null;
    private finals: string[] = [];
    private startTime = 0;
    private lastSpeech = 0;
    private pauses = 0;
    private onUpdate: (text: string, isFinal: boolean) => void;
    private lang: string;

    constructor(onUpdate: (text: string, isFinal: boolean) => void, lang = 'en-US') {
        this.onUpdate = onUpdate;
        this.lang = lang;
    }

    isSupported(): boolean {
        return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    }

    start() {
        if (!this.isSupported()) return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.sr = new SR();
        this.sr.continuous = true;
        this.sr.interimResults = true;
        this.sr.lang = this.lang;
        this.finals = [];
        this.startTime = Date.now();
        this.lastSpeech = Date.now();
        this.pauses = 0;

        this.sr.onresult = (event: SREvent) => {
            const now = Date.now();
            if ((now - this.lastSpeech) / 1000 > 2) this.pauses++;
            this.lastSpeech = now;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) this.finals.push(text);
                this.onUpdate(text, event.results[i].isFinal);
            }
        };

        this.sr.onerror = (e: any) => console.warn('SR error:', e.error);
        this.sr.start();
    }

    stop(): SpeechAnalysis {
        this.sr?.stop();
        const fullTranscript = this.finals.join(' ').trim();
        const words = fullTranscript.split(/\s+/).filter(Boolean);
        const dur = (Date.now() - this.startTime) / 1000;
        const wpm = dur > 0 ? Math.round((words.length / dur) * 60) : 0;
        const lower = fullTranscript.toLowerCase();
        const fillerWords = FILLERS.map(fw => ({
            word: fw,
            count: (lower.match(new RegExp('\\b' + fw + '\\b', 'g')) || []).length,
        })).filter(f => f.count > 0);

        return {
            fullTranscript,
            wordCount: words.length,
            fillerWords,
            pauseCount: this.pauses,
            wordsPerMinute: wpm,
            durationSeconds: dur,
        };
    }
}
