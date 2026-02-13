"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  RotateCcw,
  Play,
  SkipForward,
  Volume2,
  RefreshCw,
} from "lucide-react";
type props = {
  originalText: string;
  onClose: () => void;
  onNext: () => void;
  onReplayOriginal: () => void;
};
const AudioPage = ({
  originalText,
  onClose,
  onNext,
  onReplayOriginal,
}: props) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Trạng thái lật mặt sau & loading
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState(""); // Chữ hiện realtime

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // --- 1. SETUP LIVE TRANSCRIPT (Web Speech API) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              setLiveTranscript((prev) => event.results[i][0].transcript);
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (interimTranscript) setLiveTranscript(interimTranscript);
        };
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // --- 2. RECORDING LOGIC ---
  const startRecording = async () => {
    setError(null);
    setLiveTranscript("");
    setResult(null);
    setIsAnalyzing(false); // Reset về mặt trước
    setAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // STOP -> AUTO SEND
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());

        // Gửi ngay lập tức
        sendToBackend(blob);
      };

      mediaRecorder.start();
      recognitionRef.current?.start(); // Start live text
      setIsRecording(true);
    } catch (err) {
      setError("Không thể truy cập microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsAnalyzing(true); // Lật mặt sau ngay để hiện loading
    }
  };

  // --- 3. BACKEND API ---
  const sendToBackend = async (blob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/learning/test-audio`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              original_text: originalText,
              audio_base64: base64Audio,
            }),
          },
        );

        const data = await response.json();
        console.log(data);

        if (data.code === 200) {
          // Backend trả về success: true
          setResult(data.data);
        } else {
          // Backend trả về lỗi (Rate limit hoặc lỗi khác)
          // Ta set result thành một object đặc biệt để hiển thị lỗi bên mặt sau thẻ
          setResult({
            score: 0,
            feedback: data.error || "Có lỗi xảy ra",
            wrong_words: [],
            isError: true, // Cờ đánh dấu đây là lỗi
          });
        }
      };
    } catch (err) {
      setError("Lỗi kết nối server.");
      setIsAnalyzing(false);
    }
  };

  // --- 4. UTILS ---
  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const reset = () => {
    setIsAnalyzing(false);
    setLiveTranscript("");
    setResult(null);
  };
  return (
    <>
      {/* CARD CONTAINER (3D SCENE) */}
      <div
        className="relative w-full max-w-md overflow-hidden h-[320px] animate-fade-in"
        style={{ perspective: "1000px" }}
      >
        {/* INNER CARD (FLIPPER) */}
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: isAnalyzing ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ================= FRONT SIDE (RECORDING) ================= */}
          <div
            className="absolute w-full h-full bg-[#18181b] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Header Status */}
            <div className="flex justify-between items-start p-3 pt-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-slate-600"}`}
                />
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  {isRecording ? "ĐANG LẮNG NGHE..." : "SẴN SÀNG"}
                </span>
              </div>
              <button
                onClick={onClose}
                className="hover:cursor-pointer text-slate-500 hover:text-white text-sm font-medium transition-colors"
              >
                Bỏ qua
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-2">
              {/* Target Text Box */}
              <div className="w-full bg-[#1e1e24] rounded-2xl p-2 mb-2 flex items-center justify-center min-h-[80px] shadow-inner">
                <h1 className="text-sm md:text-md font-bold text-white text-center leading-snug">
                  {originalText}
                </h1>
              </div>

              {/* Live Transcript Area */}
              <div className="w-full h-10 text-left px-2">
                {isRecording && (
                  <>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      BẠN ĐANG NÓI:
                    </p>
                    <p className="text-sm text-slate-300 font-medium italic truncate">
                      "{liveTranscript || "..."}"
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="h-15 flex items-center justify-center gap-12 pb-4">
              {/* Nghe Gốc */}
              <button
                onClick={onReplayOriginal}
                disabled={isRecording}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center group-hover:bg-slate-800 transition-all">
                  <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Nghe gốc
                </span>
              </button>

              {/* MAIN MIC BUTTON (Start/Stop) */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-15 h-15 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-95 ${
                  isRecording
                    ? "bg-white hover:bg-slate-100" // Stop Style (White)
                    : "bg-red-600 hover:bg-red-500 shadow-red-900/20" // Record Style (Red)
                }`}
              >
                {isRecording ? (
                  <div className="w-5 h-5 bg-black rounded-sm" /> // Square Icon for Stop
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Nghe Lại */}
              <button
                onClick={playRecording}
                disabled={!audioUrl || isRecording}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center group-hover:bg-slate-800 transition-all">
                  <Play className="w-4 h-4 text-slate-500 group-hover:text-slate-300 fill-current" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Nghe lại
                </span>
              </button>
            </div>
          </div>

          {/* ================= BACK SIDE (RESULT) ================= */}
          <div
            className="absolute w-full h-full bg-slate-800 rounded-3xl border border-slate-600 shadow-2xl flex flex-col overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {!result ? (
              // LOADING STATE
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 border-4 border-slate-600 border-t-green-500 rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-bold text-white mb-2">
                  Đang chấm điểm...
                </h2>
                <p className="text-slate-400">
                  AI đang phân tích giọng nói của bạn
                </p>
              </div>
            ) : (
              // RESULT STATE
              <div className="flex flex-col h-full bg-[#1e2330]">
                {result.isError ? (
                  // --- ERROR VIEW ---
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                      <div className="text-3xl">⚠️</div>
                    </div>
                    <h3 className="text-red-400 font-bold text-lg mb-2">
                      Rất tiếc!
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {result.feedback}
                    </p>
                    <button
                      onClick={reset}
                      className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-full text-white font-bold text-sm transition-all"
                    >
                      Thử lại ngay
                    </button>
                  </div>
                ) : (
                  // --- SUCCESS VIEW ---
                  <>
                    {/* Result Header */}
                    <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/40">
                      <div className="flex items-center gap-3">
                        {/* Score Ring */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 text-md ${
                            result.score >= 80
                              ? "border-green-500 text-green-400"
                              : result.score >= 50
                                ? "border-yellow-500 text-yellow-400"
                                : "border-red-500 text-red-400"
                          }`}
                        >
                          {result.score}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            Chính xác
                          </p>
                          <p
                            className={`text-sm font-bold ${
                              result.score >= 80
                                ? "text-green-400"
                                : result.score >= 50
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {result.score >= 90
                              ? "Tuyệt vời!"
                              : result.score >= 70
                                ? "Khá tốt"
                                : "Cần cố gắng"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={reset}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Result Body */}
                    <div className="flex-1 p-1 overflow-y-auto flex flex-col justify-center">
                      {/* Visual Feedback */}
                      <div className="text-[14px  ] leading-relaxed font-medium text-center mb-3 px-2">
                        {originalText.split(" ").map((word, index) => {
                          const cleanWord = word
                            .toLowerCase()
                            .replace(/[.,!?;:()]/g, "");
                          const isWrong = result.wrong_words
                            ?.map((w: string) => w.toLowerCase())
                            .includes(cleanWord);
                          return (
                            <span
                              key={index}
                              className={`inline-block mr-2 px-1 rounded-md transition-colors ${
                                isWrong
                                  ? "text-red-400 bg-red-400/10"
                                  : "text-green-400"
                              }`}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </div>

                      {/* AI Feedback */}
                      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-2 border border-blue-500/20 mx-2">
                        <div className="flex items-center gap-1 mb-2">
                          <div className="w-1 h-1 rounded-full bg-blue-400" />
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                            AI Góp ý
                          </span>
                        </div>
                        <p className="text-slate-200 text-[14px]">
                          {result.feedback}
                        </p>
                      </div>
                    </div>

                    {/* Result Footer Actions */}
                    <div className="p-2 border-t border-slate-700/50 flex items-center justify-between bg-slate-900/40">
                      <div className="flex gap-6 pl-4">
                        <button
                          onClick={playRecording}
                          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors group"
                        >
                          <div className="p-2 rounded-full border border-slate-600 group-hover:bg-slate-700 transition-all">
                            <Volume2 className="w-4 h-4" />
                          </div>
                          <span className="text-[8px] font-bold uppercase">
                            Nghe lại
                          </span>
                        </button>
                        <button
                          onClick={onReplayOriginal}
                          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors group"
                        >
                          <div className="p-2 rounded-full border border-slate-600 group-hover:bg-slate-700 transition-all">
                            <RotateCcw className="w-4 h-4" />
                          </div>
                          <span className="text-[8px] font-bold uppercase">
                            Nghe gốc
                          </span>
                        </button>
                      </div>
                      <button
                        onClick={onNext}
                        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-slate-200 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm"
                      >
                        TIẾP TỤC <SkipForward className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPage;
