/**
 * mediapipe.ts
 * Face Landmark Detection using @mediapipe/tasks-vision
 * Analyzes 468 face landmarks → detects emotion/stress/confidence signals
 */

import {
    FaceLandmarker,
    FilesetResolver,
    type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

export interface BodyLanguageResult {
    headTilt: number;          // degrees — negative = left, positive = right
    eyeOpenness: number;       // 0–100 (100 = fully open)
    browRaise: number;          // 0–100 (stress/surprise indicator)
    mouthTension: number;       // 0–100 (stress indicator)
    overallStress: number;      // 0–100 composite
    overallConfidence: number;  // 0–100 composite
    signals: string[];          // human-readable cues
}

let faceLandmarker: FaceLandmarker | null = null;
let isLoading = false;

export async function loadFaceLandmarker(): Promise<boolean> {
    if (faceLandmarker) return true;
    if (isLoading) return false;
    isLoading = true;
    try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
        });
        isLoading = false;
        return true;
    } catch (e) {
        isLoading = false;
        console.error('MediaPipe load error:', e);
        return false;
    }
}

export function analyzeFrame(videoElement: HTMLVideoElement, timestampMs: number): BodyLanguageResult | null {
    if (!faceLandmarker) return null;
    try {
        const result: FaceLandmarkerResult = faceLandmarker.detectForVideo(videoElement, timestampMs);
        if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

        const landmarks = result.faceLandmarks[0];
        const blendshapes = result.faceBlendshapes?.[0]?.categories ?? [];

        const getBlend = (name: string) => {
            const b = blendshapes.find(b => b.categoryName === name);
            return b ? Math.round(b.score * 100) : 50;
        };

        // Key landmarks for measurements
        const leftEye = landmarks[159];
        const rightEye = landmarks[386];

        // Head tilt (horizontal)
        const headTilt = Math.round((leftEye.y - rightEye.y) * 500);

        // Eye openness from blendshapes
        const eyeOpenness = Math.round(
            ((100 - getBlend('eyeBlinkLeft')) + (100 - getBlend('eyeBlinkRight'))) / 2
        );

        // Brow raise
        const browRaise = Math.round((getBlend('browInnerUp') + getBlend('browOuterUpLeft') + getBlend('browOuterUpRight')) / 3);

        // Mouth tension (compressed lips)
        const mouthTension = Math.round(100 - getBlend('mouthPucker') + getBlend('jawForward'));

        // Composite scores
        const overallStress = Math.min(100, Math.round(
            (100 - eyeOpenness) * 0.3 + browRaise * 0.3 + mouthTension * 0.2 + Math.abs(headTilt) * 0.2
        ));
        const overallConfidence = Math.round(100 - overallStress * 0.7);

        // Human-readable signals
        const signals: string[] = [];
        if (eyeOpenness < 40) signals.push('👁️ عيون ضيقة — توتر أو تركيز');
        if (browRaise > 60) signals.push('🤨 حاجبان مرفوعان — مفاجأة أو قلق');
        if (mouthTension > 70) signals.push('😬 شفاه مضغوطة — خداع محتمل');
        if (Math.abs(headTilt) > 8) signals.push('↗️ ميلان الرأس — تردد');
        if (overallStress < 30) signals.push('😌 هادئ ومسترخي');

        return { headTilt, eyeOpenness, browRaise, mouthTension, overallStress, overallConfidence, signals };
    } catch {
        return null;
    }
}

export function unloadFaceLandmarker() {
    faceLandmarker?.close();
    faceLandmarker = null;
}
