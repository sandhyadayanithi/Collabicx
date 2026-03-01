import React, { useState, useRef, useEffect, useCallback } from 'react';
import { auth } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Bold, List, Play, Square, Loader, AlertTriangle, CheckCircle, ChevronRight, Check } from 'lucide-react';

export default function PitchModule({ userId = "user123", targetId = "target123", credits = 10 }) {
    // Editor State
    const [pitchContent, setPitchContent] = useState("");
    const editorRef = useRef(null);
    const isTypingRef = useRef(false);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Voice Recording State
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState("Idle"); // Idle, Listening, Processing, Error
    const [finalTranscript, setFinalTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);

    // Initialize Speech Recognition once
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Using false + manual restart for maximum compatibility
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setRecordingStatus("Listening");
            };

            recognition.onresult = (event) => {
                let interim = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        setFinalTranscript(prev => prev + transcript + " ");
                    } else {
                        interim += transcript;
                    }
                }
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'no-speech') {
                    // Ignore no-speech and let onend handle the restart
                } else if (event.error === 'audio-capture' || event.error === 'not-allowed') {
                    setRecordingStatus("Error");
                    stopRecording();
                }
            };

            recognition.onend = () => {
                // Manual restart loop
                if (isRecordingRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        // ignore
                    }
                } else {
                    setRecordingStatus("Idle");
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Sync isRecording to a ref for the onend callback
    const isRecordingRef = useRef(isRecording);
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    const startRecording = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        // Reset transcripts and timer
        setFinalTranscript("");
        setInterimTranscript("");
        setTimeLeft(300);
        setIsRecording(true);
        setIsRecordingModalOpen(true);
        setRecordingStatus("Initializing...");

        // Start Speech Recognition
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.warn("Speech recognition already started or failed to start:", e);
        }

        // Start Timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsRecording(false);
                    if (recognitionRef.current) {
                        try {
                            recognitionRef.current.stop();
                        } catch (e) { }
                    }
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopRecording = () => {
        setIsRecording(false);
        setRecordingStatus("Processing...");
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Small delay to ensure final transcript results are processed
        setTimeout(() => {
            commitVoiceText();
            setIsRecordingModalOpen(false);
        }, 400);
    };

    const commitVoiceText = () => {
        const textToAppend = (finalTranscript + " " + interimTranscript).trim();
        if (textToAppend) {
            // Manage cursor jump manually for programmatic inserts
            isTypingRef.current = false;
            const spaceSeparator = pitchContent.length > 0 ? " " : "";
            const newContent = pitchContent + spaceSeparator + textToAppend;
            setPitchContent(newContent);

            // Update DOM manually to sync the state without losing caret on next keystroke
            if (editorRef.current) {
                editorRef.current.innerHTML = newContent;
            }
        }
    };

    const handleEditorInput = (e) => {
        isTypingRef.current = true;
        setPitchContent(e.currentTarget.innerHTML);
    };

    // Prevent cursor jumping by only updating contentEditable HTML if NOT typing
    useEffect(() => {
        if (!isTypingRef.current && editorRef.current && editorRef.current.innerHTML !== pitchContent) {
            editorRef.current.innerHTML = pitchContent;
        }
        // reset to false
        isTypingRef.current = false;
    }, [pitchContent]);

    const executeCommand = (command) => {
        document.execCommand(command, false, null);
        if (editorRef.current) {
            editorRef.current.focus();
            // Sync state after execCommand
            setPitchContent(editorRef.current.innerHTML);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const analyzePitch = async () => {
        if (!pitchContent.trim()) {
            alert("Please enter a pitch first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Please log in to use AI analysis.");
                return;
            }

            const idToken = await user.getIdToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

            const response = await fetch(`${backendUrl}/api/pitch/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    targetId,
                    pitchContent
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 402) {
                    throw new Error("INSUFFICIENT_ANALYZE_CREDITS");
                }
                throw new Error(errorData.error || "Failed to analyze pitch");
            }

            const data = await response.json();
            setAnalysisResult(data);

        } catch (err) {
            console.error("Analysis Error:", err);
            if (err.message === "INSUFFICIENT_ANALYZE_CREDITS") {
                alert("INSUFFICIENT_ANALYZE_CREDITS: Please recharge your account.");
            } else {
                alert(err.message || "An error occurred during analysis.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    // SVGCircle Progress Bar Component
    const SVGCircle = ({ score }) => {
        const radius = 60;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        const strokeColor = score >= 80 ? "stroke-green-500" : score >= 60 ? "stroke-yellow-500" : "stroke-red-500";

        return (
            <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                        className="text-gray-200 stroke-current drop-shadow-sm"
                        strokeWidth="12"
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                    />
                    <motion.circle
                        className={`${strokeColor}`}
                        strokeWidth="12"
                        strokeLinecap="round"
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-800">{score}</span>
                    <span className="text-sm text-gray-500 font-medium">/ 100</span>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[600px]">

                {/* LEFT COLUMN: Drafting Zone (Dark Glass Card) */}
                <div className="w-full lg:w-3/5 flex flex-col glass-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden bg-slate-900/40 backdrop-blur-xl group">

                    <div className="bg-slate-900/60 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => executeCommand('bold')}
                                className="p-2 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-xl transition-all active:scale-90"
                                title="Bold"
                            >
                                <Bold className="size-5" />
                            </button>
                            <button
                                onClick={() => executeCommand('insertUnorderedList')}
                                className="p-2 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-xl transition-all active:scale-90"
                                title="Bullet List"
                            >
                                <List className="size-5" />
                            </button>
                        </div>

                        <button
                            onClick={startRecording}
                            className="flex items-center gap-2 py-2 px-4 rounded-full font-black text-xs uppercase tracking-wider transition-all border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95 group/voice"
                        >
                            <div className="relative">
                                <Mic className="size-4 group-hover/voice:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-emerald-500 blur-md opacity-0 group-hover/voice:opacity-40 transition-opacity"></div>
                            </div>
                            Voice Input
                        </button>
                    </div>

                    <div
                        ref={editorRef}
                        contentEditable="true"
                        onInput={handleEditorInput}
                        className="flex-1 p-8 focus:outline-none text-slate-200 text-xl leading-relaxed min-h-[450px] overflow-y-auto custom-scrollbar bg-transparent selection:bg-emerald-500/20"
                        placeholder="Start drafting your world-changing pitch here..."
                        style={{
                            WebkitUserModify: "read-write",
                            wordWrap: "break-word"
                        }}
                    />

                    <div className="p-6 bg-slate-900/20 border-t border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="vibrant-badge px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-500 border border-emerald-500/20">
                                {pitchContent.split(/\s+/).filter(Boolean).length} Words
                            </div>

                        </div>
                        <button
                            onClick={analyzePitch}
                            disabled={isAnalyzing || !pitchContent.trim()}
                            className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-black rounded-full shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all active:scale-95 hover:shadow-emerald-500/20 group/btn"
                        >
                            {isAnalyzing ? (
                                <><Loader className="size-5 animate-spin" /> Analyzing...</>
                            ) : (
                                <>
                                    Get AI Feedback
                                    <ChevronRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: AI Feedback (Dark Glass Card) */}
                <div className="w-full lg:w-2/5 flex flex-col gap-6">
                    <div className="glass-card rounded-3xl border border-white/5 shadow-2xl flex-1 overflow-hidden bg-slate-900/40 backdrop-blur-xl flex flex-col">
                        {!analysisResult && !isAnalyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse"></div>
                                    <div className="relative z-10 size-24 bg-slate-800/80 rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl">
                                        <Mic className="size-12 text-emerald-400" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Ready for analysis?</h3>
                                <p className="text-slate-400 font-medium leading-relaxed max-w-[280px]">
                                    Draft your pitch on the left, then click analyze to get <span className="text-emerald-400">Gemini AI</span> powered feedback.
                                </p>
                            </div>
                        ) : isAnalyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse"></div>
                                    <Loader className="relative z-10 size-16 text-emerald-400 animate-spin" />
                                </div>
                                <p className="text-emerald-400 font-black text-xs uppercase tracking-widest animate-pulse">Scanning semantics...</p>
                                <h3 className="text-xl font-black text-white mt-4">AI is evaluating your pitch</h3>
                            </div>
                        ) : (
                            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-white tracking-tight">Pitch <span className="text-emerald-400">Intelligence</span></h2>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase text-emerald-500">Live Feedback</span>
                                    </div>
                                </div>

                                <div className="flex justify-center mb-10">
                                    <SVGCircle score={analysisResult.overallScore} />
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-10">
                                    {[
                                        { label: 'Clarity', score: analysisResult.clarityScore },
                                        { label: 'Confidence', score: analysisResult.confidenceScore },
                                        { label: 'Structure', score: analysisResult.structureScore }
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl text-center group/metric transition-colors hover:border-emerald-500/30">
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1 group-hover/metric:text-emerald-400 transition-colors">{item.label}</p>
                                            <p className="text-2xl font-black text-white tracking-tight">{item.score}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-8">
                                    {/* Strengths */}
                                    {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                                        <div>
                                            <h4 className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-4">
                                                <CheckCircle className="size-4" /> Strongest Points
                                            </h4>
                                            <div className="space-y-3">
                                                {analysisResult.strengths.map((str, i) => (
                                                    <div key={i} className="flex items-start gap-3 bg-slate-800/30 border border-white/5 p-4 rounded-2xl text-sm group/item hover:border-emerald-500/20 transition-all">
                                                        <Check className="size-4 text-emerald-400 mt-0.5 shrink-0 group-hover/item:scale-110 transition-transform" />
                                                        <span className="text-slate-300 font-medium leading-relaxed">{str}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Improvements */}
                                    {analysisResult.improvements && analysisResult.improvements.length > 0 && (
                                        <div>
                                            <h4 className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-4">
                                                <AlertTriangle className="size-4" /> Optimization Roadmap
                                            </h4>
                                            <div className="space-y-3">
                                                {analysisResult.improvements.map((imp, i) => (
                                                    <div key={i} className="flex items-start gap-3 bg-slate-800/30 border border-white/5 p-4 rounded-2xl text-sm group/item hover:border-amber-500/20 transition-all">
                                                        <ChevronRight className="size-4 text-amber-400 mt-0.5 shrink-0 group-hover/item:translate-x-1 transition-transform" />
                                                        <span className="text-slate-300 font-medium leading-relaxed">{imp}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* General Feedback */}
                                    {analysisResult.feedback && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                                <span className="material-symbols-outlined text-4xl">format_quote</span>
                                            </div>
                                            <p className="text-sm text-emerald-100/80 leading-relaxed font-medium italic relative z-10">"{analysisResult.feedback}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Voice Recording Modal (Redesigned) */}
            <AnimatePresence>
                {isRecordingModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md shadow-2xl">
                        <motion.div
                            initial={{ opacity: 0, translateY: 20, scale: 0.95 }}
                            animate={{ opacity: 1, translateY: 0, scale: 1 }}
                            exit={{ opacity: 0, translateY: 20, scale: 0.95 }}
                            className="glass-card bg-slate-900/90 border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            <div className="bg-slate-900/40 border-b border-white/5 p-8 flex flex-col items-center">
                                <div className="relative mb-8">
                                    {isRecording && (
                                        <>
                                            <motion.div
                                                className="absolute inset-0 bg-emerald-500/20 rounded-full"
                                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 bg-emerald-500/10 rounded-full"
                                                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.2, 0.8] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                            />
                                        </>
                                    )}
                                    <div className={`relative z-10 size-24 rounded-3xl border border-white/10 flex items-center justify-center transition-colors duration-500 ${isRecording ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                                        {isRecording ? <Mic className="size-12 animate-pulse" /> : <MicOff className="size-12" />}
                                    </div>
                                </div>

                                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">
                                    {isRecording ? (
                                        <span className="animate-pulse">
                                            {recordingStatus === "Listening" ? "Capturing Voice..." : recordingStatus}
                                        </span>
                                    ) : (
                                        recordingStatus === "Error" ? "Recording Error" :
                                            recordingStatus === "Processing..." ? "Syncing..." : "Ready to speak?"
                                    )}
                                </h3>
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-white/5">
                                    <div className={`size-1.5 rounded-full ${isRecording ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`}></div>
                                    <p className="text-slate-300 font-mono text-sm font-bold tracking-widest">{formatTime(timeLeft)}</p>
                                </div>
                            </div>

                            <div className="p-8 flex-1 min-h-[150px] max-h-[250px] overflow-y-auto custom-scrollbar bg-transparent">
                                <p className="text-slate-200 text-xl leading-relaxed text-center font-medium">
                                    {finalTranscript}
                                    <span className="text-emerald-400/60 transition-colors"> {interimTranscript}</span>
                                </p>
                                {!finalTranscript && !interimTranscript && (
                                    <p className="text-slate-500 text-center font-medium opacity-50 mt-10 text-lg">Start speaking to see your pitch come to life...</p>
                                )}
                            </div>

                            <div className="p-6 bg-slate-900/40 border-t border-white/5 flex justify-center pb-10">
                                <button
                                    onClick={stopRecording}
                                    className="h-14 px-12 bg-white text-slate-950 hover:bg-emerald-400 transition-all rounded-full font-black text-lg flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 group/stop"
                                >
                                    <Square className="size-6 fill-slate-950 group-hover:scale-90 transition-transform" />
                                    Finish & Sync
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
