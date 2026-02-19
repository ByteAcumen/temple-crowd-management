'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Play, Pause, Square, AlertTriangle, Users,
    CheckCircle, Loader2, Brain, ZoomIn, Activity,
    ChevronUp, ChevronDown, Eye,
} from 'lucide-react';

/* ─────────────── constants ─────────────── */
const ROBOFLOW_URL = 'https://serverless.roboflow.com/crowd-counting-dataset-w3o7w/2';
const ROBOFLOW_KEY = 'wsdLXeUN3MmbPrvRMrqF';
const FRAME_INTERVAL_MS = 1500; // call API every 1.5s

/* ─────────────── types ─────────────── */
interface Detection {
    x: number; y: number;
    width: number; height: number;
    confidence: number;
    class: string;
}
interface RoboflowResponse {
    predictions: Detection[];
    image: { width: number; height: number };
}
interface FrameResult {
    count: number;
    timestamp: number; // video time in seconds
    confidence: number;
}

/* ─────────────── helpers ─────────────── */
function crowdStatus(count: number) {
    if (count > 50) return { label: 'CRITICAL', bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' };
    if (count > 25) return { label: 'WARNING', bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' };
    return { label: 'SAFE', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' };
}

/* ─────────────── Sparkline ─────────────── */
function Sparkline({ data }: { data: FrameResult[] }) {
    if (data.length < 2) return null;
    const MAX_W = 280, H = 48;
    const maxV = Math.max(...data.map(d => d.count), 1);
    const pts = data.map((d, i) => {
        const x = (i / (data.length - 1)) * MAX_W;
        const y = H - (d.count / maxV) * (H - 4) - 2;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={MAX_W} height={H} className="overflow-visible">
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
            </defs>
            <polyline fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={pts} />
        </svg>
    );
}

/* ─────────────── Main Component ─────────────── */
export default function VideoAnalyzer() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);  // overlay for bboxes
    const hiddenRef = useRef<HTMLCanvasElement>(null);  // offscreen for frame extraction
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [playing, setPlaying] = useState(false);
    const [analysing, setAnalysing] = useState(false);
    const [count, setCount] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [history, setHistory] = useState<FrameResult[]>([]);
    const [apiErr, setApiErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });

    /* ── resize overlay canvas to match displayed video ── */
    const syncCanvas = useCallback(() => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c) return;
        const rect = v.getBoundingClientRect();
        c.width = rect.width;
        c.height = rect.height;
        setVideoDims({ w: rect.width, h: rect.height });
    }, []);

    useEffect(() => {
        const ro = new ResizeObserver(syncCanvas);
        if (videoRef.current) ro.observe(videoRef.current);
        return () => ro.disconnect();
    }, [syncCanvas]);

    /* ── draw bounding boxes on overlay canvas ── */
    const drawBoxes = useCallback((preds: Detection[], imgW: number, imgH: number) => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, c.width, c.height);

        const scaleX = c.width / imgW;
        const scaleY = c.height / imgH;

        preds.forEach(p => {
            const x = (p.x - p.width / 2) * scaleX;
            const y = (p.y - p.height / 2) * scaleY;
            const w = p.width * scaleX;
            const h = p.height * scaleY;

            const alpha = Math.min(Math.max(p.confidence, 0.4), 1);
            const color = p.confidence > 0.7 ? '#ef4444' : '#f97316';

            // Box
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha;
            ctx.strokeRect(x, y, w, h);

            // Fill
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.08;
            ctx.fillRect(x, y, w, h);
            ctx.globalAlpha = 1;

            // Label
            const label = `${Math.round(p.confidence * 100)}%`;
            ctx.fillStyle = color;
            ctx.font = 'bold 10px system-ui';
            ctx.fillRect(x, y - 14, ctx.measureText(label).width + 8, 14);
            ctx.fillStyle = '#fff';
            ctx.fillText(label, x + 4, y - 3);
        });
    }, []);

    /* ── extract frame + call Roboflow ── */
    const analyseFrame = useCallback(async () => {
        const v = videoRef.current;
        const h = hiddenRef.current;
        if (!v || !h || v.paused || v.ended) return;

        h.width = v.videoWidth;
        h.height = v.videoHeight;
        const ctx = h.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(v, 0, 0);

        const base64 = h.toDataURL('image/jpeg', 0.82).split(',')[1];
        setLoading(true);
        setApiErr(null);

        try {
            const res = await fetch(`${ROBOFLOW_URL}?api_key=${ROBOFLOW_KEY}&confidence=35`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: base64,
            });
            if (!res.ok) throw new Error(`Roboflow error: ${res.status}`);
            const data: RoboflowResponse = await res.json();

            const preds = data.predictions || [];
            const n = preds.length;
            const avgCon = n > 0 ? preds.reduce((a, p) => a + p.confidence, 0) / n : 0;

            setCount(n);
            setConfidence(avgCon);
            setHistory(prev => [...prev.slice(-49), { count: n, timestamp: v.currentTime, confidence: avgCon }]);
            drawBoxes(preds, data.image?.width || v.videoWidth, data.image?.height || v.videoHeight);
        } catch (e: any) {
            setApiErr(e.message || 'API error');
        } finally {
            setLoading(false);
        }
    }, [drawBoxes]);

    /* ── start / stop analysis ── */
    const startAnalysis = useCallback(() => {
        setAnalysing(true);
        analyseFrame();
        intervalRef.current = setInterval(analyseFrame, FRAME_INTERVAL_MS);
    }, [analyseFrame]);

    const stopAnalysis = useCallback(() => {
        setAnalysing(false);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }, []);

    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            v.play();
            setPlaying(true);
            if (!analysing) startAnalysis();
        } else {
            v.pause();
            setPlaying(false);
        }
    }, [analysing, startAnalysis]);

    const stop = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        v.pause();
        v.currentTime = 0;
        setPlaying(false);
        stopAnalysis();
        setCount(0);
        setConfidence(0);
    }, [stopAnalysis]);

    /* ── file load ── */
    const loadFile = useCallback((file: File) => {
        if (!file.type.startsWith('video/')) return;
        setFileName(file.name);
        setVideoSrc(URL.createObjectURL(file));
        setHistory([]);
        setCount(0);
        setConfidence(0);
        setApiErr(null);
        setPlaying(false);
        stopAnalysis();
    }, [stopAnalysis]);

    /* ── drag & drop ── */
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) loadFile(f);
    };

    /* cleanup on unmount */
    useEffect(() => () => { stopAnalysis(); }, [stopAnalysis]);

    const st = crowdStatus(count);

    /* ─────────────── Render ─────────────── */
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                        <Eye className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800">Video Crowd Detection</h3>
                        <p className="text-xs text-slate-400 font-medium">Powered by Roboflow crowd-counting AI model</p>
                    </div>
                </div>
                {analysing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-black text-red-600">ANALYSING</span>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-5">
                {/* Drop zone or Video player */}
                {!videoSrc ? (
                    <motion.div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        animate={{ borderColor: dragging ? '#f97316' : '#e2e8f0', backgroundColor: dragging ? '#fff7ed' : '#f8fafc' }}
                        className="border-2 border-dashed rounded-3xl h-56 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all select-none"
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dragging ? 'bg-orange-100' : 'bg-slate-100'} transition-colors`}>
                            <Upload className={`w-7 h-7 ${dragging ? 'text-orange-500' : 'text-slate-400'}`} />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-slate-700 text-base">Drop a crowd video here</p>
                            <p className="text-xs text-slate-400 mt-1">MP4, MOV, AVI, WebM · Any duration</p>
                        </div>
                        <div className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-colors">
                            Choose Video File
                        </div>
                        <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) loadFile(e.target.files[0]); }} />
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {/* Video + overlay */}
                        <div className="relative rounded-2xl overflow-hidden bg-black">
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                className="w-full max-h-[420px] object-contain"
                                onLoadedMetadata={syncCanvas}
                                onEnded={() => { setPlaying(false); stopAnalysis(); }}
                            />
                            {/* Bounding box overlay */}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 pointer-events-none"
                                style={{ width: '100%', height: '100%' }}
                            />
                            {/* Live badge */}
                            {analysing && (
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[10px] font-black text-white font-mono">LIVE AI</span>
                                </div>
                            )}
                            {/* Count overlay top-right */}
                            {analysing && (
                                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                                    <p className="text-[10px] text-white/60 font-bold uppercase">People</p>
                                    <p className="text-2xl font-black text-white tabular-nums">{count}</p>
                                </div>
                            )}
                            {/* Loading spinner */}
                            {loading && (
                                <div className="absolute bottom-3 right-3">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={togglePlay}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors">
                                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {playing ? 'Pause' : 'Play & Analyse'}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={stop}
                                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors">
                                <Square className="w-4 h-4" />
                            </motion.button>
                            <button onClick={() => { setVideoSrc(null); stop(); setHistory([]); }}
                                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                                ↩ Change Video
                            </button>
                            <span className="ml-auto text-xs text-slate-400 font-medium truncate max-w-[200px]">📹 {fileName}</span>
                        </div>
                    </div>
                )}

                {/* Stats rows */}
                <AnimatePresence>
                    {videoSrc && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Crowd count */}
                            <div className={`rounded-2xl border p-4 ${st.light} ${st.border}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">People Detected</p>
                                    <Users className={`w-4 h-4 ${st.text}`} />
                                </div>
                                <p className={`text-3xl font-black tabular-nums ${st.text}`}>{count}</p>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black mt-1 ${st.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.bg}`} />{st.label}
                                </span>
                            </div>

                            {/* Avg confidence */}
                            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">AI Confidence</p>
                                    <Brain className="w-4 h-4 text-purple-600" />
                                </div>
                                <p className="text-3xl font-black tabular-nums text-purple-700">{Math.round(confidence * 100)}%</p>
                                <p className="text-[11px] text-purple-500 font-medium mt-1">Avg per detection</p>
                            </div>

                            {/* Frames analysed */}
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Frames Analysed</p>
                                    <Activity className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-3xl font-black tabular-nums text-blue-700">{history.length}</p>
                                <p className="text-[11px] text-blue-500 font-medium mt-1">Every 1.5s interval</p>
                            </div>

                            {/* Peak count */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Peak Count</p>
                                    <ZoomIn className="w-4 h-4 text-slate-600" />
                                </div>
                                <p className="text-3xl font-black tabular-nums text-slate-800">
                                    {history.length > 0 ? Math.max(...history.map(h => h.count)) : 0}
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium mt-1">Highest detected</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* API Error */}
                <AnimatePresence>
                    {apiErr && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-sm font-medium text-red-700">{apiErr}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Trend sparkline */}
                <AnimatePresence>
                    {history.length > 2 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden">
                            <button onClick={() => setShowHistory(h => !h)}
                                className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-orange-500" />Crowd Count Trend</span>
                                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <AnimatePresence>
                                {showHistory && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="mt-2 px-4 py-4 bg-white border border-slate-100 rounded-2xl">
                                        <div className="flex items-end justify-between mb-3">
                                            <p className="text-xs font-bold text-slate-500">People detected over {history.length} frames</p>
                                            <p className="text-xs text-slate-400">Avg: {Math.round(history.reduce((a, h) => a + h.count, 0) / history.length)}</p>
                                        </div>
                                        <Sparkline data={history} />
                                        <div className="flex items-start justify-between mt-3 overflow-x-auto gap-1 max-h-24 overflow-y-auto pr-2" style={{ willChange: 'scroll-position' }}>
                                            {history.slice(-20).map((h, i) => (
                                                <div key={i} className="text-center shrink-0">
                                                    <div className={`w-6 text-[9px] font-black ${h.count > 50 ? 'text-red-600' : h.count > 25 ? 'text-orange-600' : 'text-emerald-600'}`}>{h.count}</div>
                                                    <div className="text-[8px] text-slate-300">{h.timestamp.toFixed(0)}s</div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info footer */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-xs text-slate-500 font-medium">
                        Model: <span className="font-bold text-slate-700">crowd-counting-dataset-w3o7w v2</span> ·
                        API: <span className="font-bold text-slate-700">Roboflow Serverless</span> ·
                        Interval: <span className="font-bold text-slate-700">1 frame / 1.5s</span>
                    </p>
                </div>
            </div>

            {/* hidden offscreen canvas */}
            <canvas ref={hiddenRef} className="hidden" />
        </div>
    );
}
