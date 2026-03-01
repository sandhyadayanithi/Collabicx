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
    const [finalTranscript, setFinalTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let currentInterim = "";
                let currentFinal = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentFinal += event.results[i][0].transcript;
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }

                if (currentFinal) {
                    setFinalTranscript((prev) => prev + currentFinal);
                }
                setInterimTranscript(currentInterim);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                stopRecording();
            };

            recognitionRef.current.onend = () => {
                // Automatically restart if still supposed to be recording
                if (isRecording) {
                    recognitionRef.current.start();
                }
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording]);

    const startRecording = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        setFinalTranscript("");
        setInterimTranscript("");
        setTimeLeft(300);
        setIsRecording(true);
        setIsRecordingModalOpen(true);

        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    stopRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Append the final recorded text to the editor
        commitVoiceText();
        setTimeout(() => {
            setIsRecordingModalOpen(false);
        }, 500);
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
        <div className="max-w-7xl mx-auto p-4 md:p-8 h-full flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pitch Practice</h1>
                    <p className="text-gray-500 mt-1">Refine your elevator pitch with AI feedback</p>
                </div>
                <button
                    onClick={analyzePitch}
                    disabled={isAnalyzing || !pitchContent.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2"
                >
                    {isAnalyzing ? <><Loader className="w-5 h-5 animate-spin" /> Analyzing...</> : "Get AI Feedback"}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 flex-1">

                {/* LEFT COLUMN: Drafting Zone */}
                <div className="w-full lg:w-3/5 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                        <button
                            onClick={() => executeCommand('bold')}
                            className="p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors"
                            title="Bold"
                        >
                            <Bold className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => executeCommand('insertUnorderedList')}
                            className="p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors"
                            title="Bullet List"
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-2" />
                        <button
                            onClick={startRecording}
                            className="flex items-center gap-2 py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium transition-colors border border-red-100"
                        >
                            <Mic className="w-4 h-4" />
                            Voice Input
                        </button>
                    </div>

                    <div
                        ref={editorRef}
                        contentEditable="true"
                        onInput={handleEditorInput}
                        className="flex-1 p-6 focus:outline-none text-gray-800 text-lg leading-relaxed min-h-[400px] overflow-y-auto"
                        placeholder="Type your elevator pitch here, or use Voice Input..."
                        style={{
                            WebkitUserModify: "read-write",
                            wordWrap: "break-word"
                        }}
                    />
                </div>

                {/* RIGHT COLUMN: Dashboard */}
                <div className="w-full lg:w-2/5 flex flex-col">
                    {!analysisResult && !isAnalyzing ? (
                        <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                                <Mic className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Start your first pitch</h3>
                            <p className="text-gray-500 max-w-sm">
                                Write or record your pitch in the editor, and our AI will evaluate your clarity, structure, and confidence.
                            </p>
                        </div>
                    ) : isAnalyzing ? (
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-8 min-h-[400px]">
                            <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium animate-pulse">Analyzing pitch semantics...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">AI Feedback Dashboard</h2>

                            <div className="flex justify-center mb-8">
                                <SVGCircle score={analysisResult.overallScore} />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Clarity</p>
                                    <p className="text-2xl font-bold text-gray-900">{analysisResult.clarityScore}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Confidence</p>
                                    <p className="text-2xl font-bold text-gray-900">{analysisResult.confidenceScore}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Structure</p>
                                    <p className="text-2xl font-bold text-gray-900">{analysisResult.structureScore}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Strengths */}
                                {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-2 text-green-700 font-semibold mb-3">
                                            <CheckCircle className="w-5 h-5" /> Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysisResult.strengths.map((str, i) => (
                                                <li key={i} className="flex items-start gap-2 bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                                                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <span>{str}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Improvements */}
                                {analysisResult.improvements && analysisResult.improvements.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-2 text-amber-700 font-semibold mb-3">
                                            <AlertTriangle className="w-5 h-5" /> Areas to Improve
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysisResult.improvements.map((imp, i) => (
                                                <li key={i} className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">
                                                    <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <span>{imp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* General Feedback */}
                                {analysisResult.feedback && (
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <p className="text-sm text-indigo-900 leading-relaxed italic">"{analysisResult.feedback}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Voice Recording Modal */}
            <AnimatePresence>
                {isRecordingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm shadow-2xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col"
                        >
                            <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-col items-center">
                                <div className="relative mb-4 mt-2">
                                    {isRecording && (
                                        <motion.div
                                            className="absolute inset-0 bg-red-100 rounded-full"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    )}
                                    <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {isRecording ? <Mic className="w-10 h-10" /> : <MicOff className="w-10 h-10" />}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                    {isRecording ? "Listening..." : "Recording Paused"}
                                </h3>
                                <p className="text-gray-500 font-mono text-xl">{formatTime(timeLeft)}</p>
                            </div>

                            <div className="p-6 flex-1 min-h-[150px] max-h-[250px] overflow-y-auto bg-white">
                                <p className="text-gray-800 text-lg leading-relaxed">
                                    {finalTranscript}
                                    <span className="text-gray-400 italic"> {interimTranscript}</span>
                                </p>
                                {!finalTranscript && !interimTranscript && (
                                    <p className="text-gray-400 text-center italic mt-10">Start speaking clearly into your microphone...</p>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                                <button
                                    onClick={stopRecording}
                                    className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-colors focus:ring-4 focus:ring-gray-200"
                                >
                                    <Square className="w-5 h-5 fill-current" />
                                    Stop & Insert
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
