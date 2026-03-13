/**
 * useFaceMeshOverlay.ts — Cinematic FaceMesh Canvas Overlay (SeeMePro)
 * Draws real-time forensic overlays above a live/recorded video element.
 * Uses @mediapipe/tasks-vision FaceLandmarker (VIDEO mode).
 * Design palette: SKILL.md — Cosmic Sky #0a0c16, cyan #00d2ff, red #ef4444, green #10b981
 */

import { useEffect, useRef } from 'react';

// ── Landmark index groups ────────────────────────────────────────────────────
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const LEFT_BROW = [70, 63, 105, 66, 107];
const RIGHT_BROW = [336, 296, 334, 293, 300];

// ── Singleton landmarker (lazy loaded from CDN) ──────────────────────────────
let _lm: any = null;
let _loading = false;

async function getLandmarker(): Promise<any> {
    if (_lm) return _lm;
    if (_loading) return null;
    _loading = true;
    try {
        const { FaceLandmarker: FL, FilesetResolver: FR } = await import('@mediapipe/tasks-vision');
        const vision = await FR.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
        _lm = await FL.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
        });
    } catch (e) {
        console.warn('[FaceMesh] CDN load failed, overlays will use fallback mode.', e);
        _lm = 'FAILED';
    } finally {
        _loading = false;
    }
    return _lm;
}

// ── Public interface ─────────────────────────────────────────────────────────
export interface FaceMeshOverlayOptions {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isActive: boolean;
    /** Candidate name shown in bottom bar (LiveInterview) */
    candidateName?: string;
    /** Job role shown in bottom bar */
    role?: string;
    /** Session elapsed seconds (for timer bar) */
    elapsedSecs?: number;
    /** Dominant emotion label from AI */
    analysisLabel?: string;
    /** Stress 0-100 from AI */
    stressLevel?: number;
    /** Confidence 0-100 from AI (optional) */
    confidence?: number;
    /** Authenticity 0-100 from AI (optional) */
    authenticity?: number;
    /** Mode: 'live' for LiveInterview, 'forensic' for VideoAnalysis */
    mode?: 'live' | 'forensic';
    /** Session ID for forensic mode */
    sessionId?: string;
}

export function useFaceMeshOverlay({
    videoRef,
    canvasRef,
    isActive,
    candidateName = '',
    role = '',
    elapsedSecs = 0,
    analysisLabel = '',
    stressLevel = 0,
    confidence = 0,
    authenticity = 0,
    mode = 'live',
    sessionId = '',
}: FaceMeshOverlayOptions) {
    const rafRef = useRef<number | null>(null);
    const lastLmTs = useRef<number>(0);
    const lastResult = useRef<any>(null);

    useEffect(() => {
        if (!isActive) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            const c = canvasRef.current;
            if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
            return;
        }

        let stopped = false;
        let landmarker: any = null;
        getLandmarker().then(lm => { if (!stopped) landmarker = lm; });

        const drawFrame = (nowMs: number) => {
            if (stopped) return;
            rafRef.current = requestAnimationFrame(drawFrame);

            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.readyState < 2) return;

            // Sync canvas ↔ video DOM size
            const rect = video.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) return;
            const W = Math.floor(rect.width);
            const H = Math.floor(rect.height);
            if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, W, H);

            // ── 1. Vignette ────────────────────────────────────────────────────
            const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, 'rgba(0,0,0,0.45)');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, W, H);

            // ── 2. Cyan scanline ───────────────────────────────────────────────
            const scanY = (nowMs * 0.12) % H;
            const scanGrad = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6);
            scanGrad.addColorStop(0, 'rgba(0,210,255,0)');
            scanGrad.addColorStop(0.5, 'rgba(0,210,255,0.07)');
            scanGrad.addColorStop(1, 'rgba(0,210,255,0)');
            ctx.fillStyle = scanGrad;
            ctx.fillRect(0, scanY - 6, W, 12);

            // ── 3. REC top-left ────────────────────────────────────────────────
            const recOn = Math.sin(nowMs / 600) > 0;
            if (recOn) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(16, 16, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.shadowBlur = 12; ctx.shadowColor = '#ef4444';
                ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = recOn ? '#ef4444' : '#ef444466';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('● REC', 26, 20);

            // Real timestamp
            const now = new Date();
            const ts = now.toLocaleTimeString('en-GB', { hour12: false });
            const dt = now.toLocaleDateString('en-GB');
            ctx.fillStyle = '#00d2ff';
            ctx.font = '10px monospace';
            ctx.fillText(`${dt}  ${ts}`, 26, 34);

            // ── 4. Top-right header ────────────────────────────────────────────
            const header = mode === 'forensic' ? 'FORENSIC ANALYSIS' : 'LIVE ANALYSIS';
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            const hw = ctx.measureText(header).width + 20;
            ctx.fillRect(W - hw - 4, 6, hw + 4, 34);
            ctx.fillStyle = mode === 'forensic' ? '#8b5cf6' : '#00d2ff';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(header, W - 8, 20);
            ctx.fillStyle = '#ffffff66';
            ctx.font = '9px monospace';
            ctx.fillText(sessionId ? `ID:${sessionId.slice(-8)}` : `SeeMePro v4`, W - 8, 33);
            ctx.textAlign = 'left';

            // ── 5. MediaPipe FaceMesh ──────────────────────────────────────────
            let lm: any[] | null = null;
            let blends: any[] = [];

            if (landmarker && landmarker !== 'FAILED') {
                try {
                    if (nowMs - lastLmTs.current > 30) { // throttle ~30fps
                        lastLmTs.current = nowMs;
                        const result = landmarker.detectForVideo(video, nowMs);
                        if (result?.faceLandmarks?.length) {
                            lastResult.current = result;
                        }
                    }
                } catch { /* skip frame */ }
            }

            if (lastResult.current?.faceLandmarks?.length) {
                lm = lastResult.current.faceLandmarks[0];
                blends = lastResult.current.faceBlendshapes?.[0]?.categories ?? [];
            }

            // helpers
            const px = (i: number) => lm![i].x * W;
            const py = (i: number) => lm![i].y * H;
            const getBlend = (name: string) => {
                const b = blends.find((b: any) => b.categoryName === name);
                return b ? Math.round(b.score * 100) : 0;
            };

            if (lm) {
                // ── 5a. GREEN FACE OVAL CONTOUR ──────────────────────────────
                ctx.save();
                ctx.beginPath();
                FACE_OVAL.forEach((idx, i) => {
                    i === 0 ? ctx.moveTo(px(idx), py(idx)) : ctx.lineTo(px(idx), py(idx));
                });
                ctx.closePath();
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 6; ctx.shadowColor = '#10b981';
                ctx.stroke();
                ctx.restore();

                // ── 5b. Bounding box (yellow) + corner brackets ──────────────
                let minX = W, maxX = 0, minY = H, maxY = 0;
                FACE_OVAL.forEach(i => {
                    const x = px(i), y = py(i);
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                });
                const boxPadX = (maxX - minX) * 0.1, boxPadY = (maxY - minY) * 0.06;
                minX -= boxPadX; maxX += boxPadX; minY -= boxPadY; maxY += boxPadY;
                const bW = maxX - minX, bH = maxY - minY;

                const boxColor = stressLevel > 65 ? '#ef4444' : stressLevel > 40 ? '#f59e0b' : '#fbbf24';
                ctx.save();
                ctx.strokeStyle = boxColor;
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 10; ctx.shadowColor = boxColor;
                ctx.strokeRect(minX, minY, bW, bH);
                ctx.restore();

                // Corner brackets (yellow glow)
                const bracketLen = Math.min(bW, bH) * 0.16;
                ctx.save();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 8; ctx.shadowColor = '#fbbf24';
                [[minX, minY, 1, 1], [maxX, minY, -1, 1], [maxX, maxY, -1, -1], [minX, maxY, 1, -1]].forEach(([bx, by, dx, dy]) => {
                    ctx.beginPath();
                    ctx.moveTo(bx as number, (by as number) + (dy as number) * bracketLen);
                    ctx.lineTo(bx as number, by as number);
                    ctx.lineTo((bx as number) + (dx as number) * bracketLen, by as number);
                    ctx.stroke();
                });
                ctx.restore();

                // ── 5c. RED EYE CIRCLES (pulsing glow) ──────────────────────
                const eyePulse = 1 + 0.15 * Math.sin(nowMs / 400);
                const drawEye = (indices: number[]) => {
                    let ex = 0, ey = 0;
                    indices.forEach(i => { ex += px(i); ey += py(i); });
                    ex /= indices.length; ey /= indices.length;
                    const r = Math.max(Math.abs(px(indices[0]) - px(indices[3])) * 0.55, 10) * eyePulse;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(ex, ey, r, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 16; ctx.shadowColor = '#ef4444';
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();
                    ctx.restore();
                };
                drawEye(LEFT_EYE); drawEye(RIGHT_EYE);

                // ── 5d. CYAN EYEBROW lines ───────────────────────────────────
                [[LEFT_BROW, '#00d2ff'], [RIGHT_BROW, '#00d2ff']].forEach(([brow, col]) => {
                    const indices = brow as number[];
                    ctx.save();
                    ctx.beginPath();
                    indices.forEach((idx, i) => { i === 0 ? ctx.moveTo(px(idx), py(idx)) : ctx.lineTo(px(idx), py(idx)); });
                    ctx.strokeStyle = col as string;
                    ctx.lineWidth = 1.5;
                    ctx.shadowBlur = 6; ctx.shadowColor = col as string;
                    ctx.stroke();
                    ctx.restore();
                });

                // ── 5e. WHITE LIP CONTOUR ────────────────────────────────────
                ctx.save();
                ctx.beginPath();
                LIPS.forEach((idx, i) => { i === 0 ? ctx.moveTo(px(idx), py(idx)) : ctx.lineTo(px(idx), py(idx)); });
                ctx.closePath();
                ctx.strokeStyle = mode === 'forensic' ? 'rgba(255,255,255,0.5)' : 'rgba(0,210,255,0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();

                // ── 5f. CYAN MESH DOTS (every 6th point) ─────────────────────
                ctx.save();
                ctx.fillStyle = 'rgba(0,210,255,0.55)';
                for (let i = 0; i < lm.length; i += 6) {
                    ctx.beginPath(); ctx.arc(px(i), py(i), 1.1, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();

                // ── 5g. RIGHT-SIDE ANALYSIS PANEL ───────────────────────────
                const eyeBlink = Math.round((getBlend('eyeBlinkLeft') + getBlend('eyeBlinkRight')) / 2);
                const browRaise = getBlend('browInnerUp');
                const jawOpen = getBlend('jawOpen');
                const eyeContact = eyeBlink < 25 ? 'DIRECT ✓' : 'AVERTED ↗';
                const emotion = analysisLabel || (stressLevel > 65 ? 'STRESSED' : stressLevel > 35 ? 'CAUTIOUS' : 'NEUTRAL');
                const confScore = confidence > 0 ? confidence : Math.max(0, 100 - stressLevel);
                const authScore = authenticity > 0 ? authenticity : Math.max(0, 95 - stressLevel * 0.5);
                const deceptionRisk = stressLevel > 65 ? 'HIGH 🔴' : stressLevel > 40 ? 'MED 🟡' : 'LOW 🟢';

                const liveLabels: { label: string; value: string; color: string; val?: number }[] = mode === 'live' ? [
                    { label: 'CONFIDENCE', value: `${confScore}%`, color: '#00d2ff', val: confScore },
                    { label: 'EYE CONTACT', value: eyeContact, color: '#fbbf24' },
                    { label: 'STRESS', value: `${stressLevel}%`, color: stressLevel > 60 ? '#ef4444' : '#10b981', val: stressLevel },
                    { label: 'EMOTION', value: emotion, color: '#8b5cf6' },
                    { label: 'BROW RAISE', value: `${browRaise}%`, color: '#f59e0b', val: browRaise },
                ] : [
                    { label: 'FACE', value: 'DETECTED ✓', color: '#10b981' },
                    { label: 'MICRO EXP', value: 'DETECTED', color: '#00d2ff' },
                    { label: 'AUTHENTICITY', value: `${authScore}%`, color: '#3b82f6', val: Math.round(authScore) },
                    { label: 'DECEPTION', value: deceptionRisk, color: stressLevel > 65 ? '#ef4444' : stressLevel > 40 ? '#f59e0b' : '#10b981' },
                    { label: 'EYE CONTACT', value: eyeContact, color: '#fbbf24' },
                    { label: 'JAW TENSION', value: `${jawOpen}%`, color: '#f59e0b', val: jawOpen },
                ];

                const panelX = maxX + 14;
                const rowH = 28;
                liveLabels.forEach(({ label, value, color, val }, i) => {
                    const y = minY + i * rowH;
                    if (y + rowH > H - 40) return;

                    // BG
                    ctx.fillStyle = 'rgba(10,12,22,0.82)';
                    ctx.beginPath(); ctx.roundRect(panelX, y, 178, 24, 4); ctx.fill();
                    // Color bar
                    ctx.fillStyle = color;
                    ctx.beginPath(); ctx.roundRect(panelX, y, 4, 24, [4, 0, 0, 4]); ctx.fill();
                    // Value fill
                    if (val !== undefined) {
                        ctx.fillStyle = color + '25';
                        ctx.fillRect(panelX + 4, y, (val / 100) * 174, 24);
                    }
                    // Connector
                    ctx.strokeStyle = color + '44';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(maxX, minY + i * rowH + 12);
                    ctx.lineTo(panelX, y + 12);
                    ctx.stroke();
                    // Label text
                    ctx.fillStyle = '#ffffff80';
                    ctx.font = '8px monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(label, panelX + 8, y + 10);
                    // Value text
                    ctx.fillStyle = color;
                    ctx.font = 'bold 10px monospace';
                    ctx.fillText(value, panelX + 8, y + 21);
                });

                // ── NO FACE warning if box too small ─────────────────────────
            } else {
                // Fallback: draw subtle crosshair in center
                const cx = W / 2, cy = H / 2;
                ctx.save();
                ctx.strokeStyle = '#ef444433';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 8]);
                ctx.beginPath(); ctx.moveTo(cx - 40, cy); ctx.lineTo(cx + 40, cy); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 40); ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#ef444499';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('⚠ FACE NOT DETECTED', cx, cy + 60);
                ctx.textAlign = 'left';
            }

            // ── 6. BOTTOM BAR (mode-specific) ─────────────────────────────────
            const barH = 36;
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, H - barH, W, barH);
            // Top border glow
            ctx.fillStyle = mode === 'live' ? '#00d2ff33' : '#8b5cf633';
            ctx.fillRect(0, H - barH, W, 1);

            if (mode === 'live') {
                // LIVE: candidate name | role | LIVE badge | timer
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(candidateName || 'CANDIDATE', 12, H - barH + 15);
                ctx.fillStyle = '#00d2ff';
                ctx.font = '10px monospace';
                ctx.fillText(role || 'POSITION', 12, H - barH + 28);

                // LIVE badge
                const liveX = W / 2 - 28;
                if (Math.sin(nowMs / 500) > 0) {
                    ctx.beginPath();
                    ctx.arc(liveX - 10, H - barH + 18, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ef4444';
                    ctx.shadowBlur = 8; ctx.shadowColor = '#ef4444';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('● LIVE', W / 2, H - barH + 22);

                // Session timer
                const mins = String(Math.floor(elapsedSecs / 60)).padStart(2, '0');
                const secs = String(elapsedSecs % 60).padStart(2, '0');
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 13px monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`⏱ ${mins}:${secs}`, W - 12, H - barH + 22);
            } else {
                // FORENSIC: emotion bar from bottom
                const emotions: { label: string; val: number; col: string }[] = [
                    { label: 'CONF', val: lm ? Math.max(0, 100 - stressLevel) : 0, col: '#00d2ff' },
                    { label: 'AUTH', val: lm ? Math.round(authenticity > 0 ? authenticity : Math.max(0, 95 - stressLevel * 0.5)) : 0, col: '#3b82f6' },
                    { label: 'STRESS', val: stressLevel, col: '#ef4444' },
                    { label: 'CALM', val: lm ? Math.max(0, 100 - stressLevel * 0.6) : 0, col: '#10b981' },
                ];
                const segW2 = W / emotions.length;
                emotions.forEach(({ label, val, col }, i) => {
                    const bx = i * segW2;
                    ctx.fillStyle = col + '30';
                    ctx.fillRect(bx, H - barH, (val / 100) * segW2, barH);
                    ctx.fillStyle = col;
                    ctx.fillRect(bx, H - barH, (val / 100) * segW2, 2);
                    ctx.font = 'bold 9px monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${label} ${val}%`, bx + 6, H - barH + 22);
                });
            }

            ctx.textAlign = 'left';
        };

        rafRef.current = requestAnimationFrame(drawFrame);

        return () => {
            stopped = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isActive, candidateName, role, elapsedSecs, analysisLabel, stressLevel, confidence, authenticity, mode, sessionId]);
}
