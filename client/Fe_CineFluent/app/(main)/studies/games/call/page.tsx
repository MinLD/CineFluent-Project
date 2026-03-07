"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquareText,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Peer from "peerjs";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";

// ... (Video Call logic will be here)
function VideoCallInterface() {
  const [peerId, setPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [isCalling, setIsCalling] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [copied, setCopied] = useState(false);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const [aiTopics, setAiTopics] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<any>(null);

  useEffect(() => {
    // Initialize PeerJS
    // Wait for window to be available (CSR)
    if (typeof window === "undefined") return;

    import("peerjs").then(({ default: Peer }) => {
      const peer = new Peer();

      peer.on("open", (id) => {
        setPeerId(id);
      });

      peer.on("call", (call) => {
        // Answer incoming call automatically
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            call.answer(stream);
            currentCallRef.current = call;

            call.on("stream", (remoteStream) => {
              if (remoteVideoRef.current)
                remoteVideoRef.current.srcObject = remoteStream;
              setCallActive(true);
              fetchAiTopics(); // Generate topics when call connects
            });

            call.on("close", handleCallEnded);
          })
          .catch((err) => {
            console.error("Failed to get local stream", err);
            toast.error("Không thể truy cập Camera/Micro.");
          });
      });

      peerInstance.current = peer;
    });

    // Start local camera immediately for preview
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Failed to get local stream pre-call", err);
      });

    return () => {
      if (currentCallRef.current) currentCallRef.current.close();
      if (peerInstance.current) peerInstance.current.destroy();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCall = () => {
    if (!remotePeerId.trim()) {
      toast.error("Vui lòng nhập ID người nhận cuộc gọi!");
      return;
    }

    if (!peerInstance.current || !localStreamRef.current) {
      toast.error("Chưa sẵn sàng, vui lòng đợi...");
      return;
    }

    setIsCalling(true);
    const call = peerInstance.current.call(
      remotePeerId,
      localStreamRef.current,
    );
    currentCallRef.current = call;

    call.on("stream", (remoteStream) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = remoteStream;
      setIsCalling(false);
      setCallActive(true);
      fetchAiTopics(); // Generate topics when call connects
    });

    call.on("close", handleCallEnded);
    call.on("error", (err) => {
      console.error(err);
      toast.error("Cuộc gọi lỗi.");
      setIsCalling(false);
      handleCallEnded();
    });
  };

  const handleCallEnded = () => {
    setCallActive(false);
    setIsCalling(false);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    toast.message("Cuộc gọi đã kết thúc.");
    setAiTopics(null);
  };

  const endCall = () => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
    }
    handleCallEnded();
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const copyPeerId = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
      toast.success("Đã copy ID của bạn!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchAiTopics = async () => {
    setLoadingAi(true);
    try {
      // Backend should implement this
      const res = await fetch(`${FeApiProxyUrl}/learning/ai-call-topics`);
      const data = await res.json();
      if (res.ok) {
        setAiTopics(data.data);
      } else {
        toast.error("Không thể lấy chủ đề từ AI.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] min-h-[500px] w-full max-w-7xl mx-auto animate-fade-in font-sans">
      {/* Video Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="relative flex-1 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {/* Nhắc nhở nếu chưa gọi */}
          {!callActive && !isCalling && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 p-6 text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <Video className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Bắt đầu trò chuyện 1:1
              </h2>
              <p className="text-slate-400 max-w-sm mb-8">
                Gửi mã ID của bạn cho người khác, hoặc nhập mã ID của họ để tận
                hưởng cuộc gọi tích hợp AI.
              </p>

              <div className="flex gap-4 w-full justify-center flex-wrap">
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 w-64">
                  <span className="text-slate-500 text-sm font-semibold whitespace-nowrap">
                    ID CỦA BẠN:
                  </span>
                  <span className="text-emerald-400 font-mono font-bold tracking-wider truncate">
                    {peerId || "Đang lấy ID..."}
                  </span>
                  {peerId && (
                    <button
                      onClick={copyPeerId}
                      className="ml-auto text-slate-400 hover:text-white"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={remotePeerId}
                    onChange={(e) => setRemotePeerId(e.target.value)}
                    placeholder="Nhập mã ID bạn bè..."
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono font-bold w-48"
                  />
                  <button
                    onClick={handleCall}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                  >
                    Gọi ngay
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCalling && !callActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur z-10 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-white font-semibold">Đang kết nối...</p>
            </div>
          )}

          {/* Remote Video (Lớn) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${callActive ? "opacity-100" : "opacity-0"}`}
          />

          {/* Local Video (Nhỏ góc phải) */}
          <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted // Always mute local video playback to avoid feedback loop
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        </div>

        {/* Call Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex justify-center gap-4 shrink-0">
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${audioEnabled ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"}`}
          >
            {audioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${videoEnabled ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"}`}
          >
            {videoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          {callActive && (
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-500/20"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* AI Side Panel */}
      <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 left-0"></div>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <MessageSquareText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">AI Trợ Lý</h3>
            <p className="text-xs text-blue-300">Gợi ý nội dung hội thoại</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {!callActive ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm text-center px-4">
              <MessageSquareText className="w-12 h-12 mb-4 opacity-50" />
              <p>
                Trợ lý AI Gemini sẽ tự động sinh chủ đề và từ vựng gợi ý ngay
                khi cuộc gọi bắt đầu để giúp bạn và đối tác duy trì cuộc hội
                thoại thú vị.
              </p>
            </div>
          ) : loadingAi ? (
            <div className="flex flex-col items-center justify-center h-full text-blue-400 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold animate-pulse">
                AI đang suy nghĩ...
              </p>
            </div>
          ) : aiTopics ? (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Chủ đề gợi ý
                </span>
                <p className="text-white font-medium p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 leading-relaxed">
                  "{aiTopics.topic}"
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Câu hỏi khơi mào (Ice-breakers)
                </span>
                {aiTopics.questions?.map((q: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm rounded-xl"
                  >
                    <span className="font-bold text-blue-400 mr-2">Q:</span> {q}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Từ vựng ghi điểm
                </span>
                <div className="flex flex-wrap gap-2">
                  {aiTopics.vocabulary?.map((v: any, i: number) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-emerald-300 flex flex-col"
                    >
                      <span className="font-bold">{v.word}</span>
                      <span className="text-xs text-slate-400">
                        {v.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchAiTopics}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 transition-colors text-white text-sm font-bold rounded-xl mt-4 border border-slate-700"
              >
                Đổi chủ đề khác
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm text-center">
              <p>Chưa có dữ liệu.</p>
              <button
                onClick={fetchAiTopics}
                className="mt-4 text-blue-400 font-bold hover:underline"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VideoCallPage() {
  return (
    <div className="bg-[#020617] pt-1 px-4 sm:px-6 lg:px-8 pb-4 h-screen overflow-hidden">
      <Suspense
        fallback={
          <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        }
      >
        <VideoCallInterface />
      </Suspense>
    </div>
  );
}
