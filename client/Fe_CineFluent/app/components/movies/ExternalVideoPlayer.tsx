"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import HLSPlayer from "./HLSPlayer";
import { SubtitlePanel } from "./SubtitlePanel";
import { externalMovieService } from "@/app/services/externalMovieService";
import { Loader2 } from "lucide-react";
import { I_Subtitle } from "@/app/lib/types/video";

interface ExternalVideoPlayerProps {
  videoId: number;
}

export default function ExternalVideoPlayer({
  videoId,
}: ExternalVideoPlayerProps) {
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subtitles, setSubtitles] = useState<I_Subtitle[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentEmbed, setCurrentEmbed] = useState<string>("");

  useEffect(() => {
    const fetchStream = async () => {
      try {
        // 1. Lấy Stream URL từ VidSrc
        const info = await externalMovieService.getStream(videoId);
        setStreamInfo(info);
        if (info?.primary_embed) {
          setCurrentEmbed(info.primary_embed);
        } else if (
          info?.all_embeds &&
          Object.values(info.all_embeds).length > 0
        ) {
          setCurrentEmbed(Object.values(info.all_embeds)[0] as string);
        }

        // 2. Lấy Subtitle từ API của mình (đã lưu trong DB)
        // Lưu ý: Cần endpoint lấy sub theo video_id (dùng lại API cũ)
        const subRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/videos/${videoId}/subtitles`,
        );
        const subData = await subRes.json();
        setSubtitles(subData.data || []);
      } catch (error) {
        console.error("Error fetching stream or subtitles:", error);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchStream();
    }
  }, [videoId]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        <span className="ml-3">Loading Stream & Subtitles...</span>
      </div>
    );
  }

  if (!streamInfo?.primary_embed && !streamInfo?.stream_url) {
    return (
      <div className="text-white text-center mt-20">Stream not found.</div>
    );
  }

  // Ưu tiên dùng Stream URL (.m3u8) để có sub sync
  // Nếu không có, dùng Embed URL (iframe)
  const streamUrl = `https://vidsrc.xyz/api/source/${streamInfo.imdb_id}`;
  // Lưu ý: VidSrc API cho source có thể phức tạp hơn.
  // Tạm thời dùng Embed URL nếu không lấy được m3u8 trực tiếp dễ dàng.

  // ⚠️ VIDSRC HIỆN TẠI CHỦ YẾU CHO EMBED IFRAME
  // Để có .m3u8 clean, cần dùng proxy hoặc dịch vụ trả phí.
  // Tạm thời mình sẽ dùng IFRAME + SUBTITLE OVERLAY (như đã bàn).

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Main Content: Video + Subtitle Panel */}
      <div className="flex-1 flex flex-col relative">
        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Server Selector */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {streamInfo?.all_embeds &&
              Object.entries(streamInfo.all_embeds).map(([provider, url]) => (
                <button
                  key={provider}
                  onClick={() => setCurrentEmbed(url as string)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentEmbed === url
                      ? "bg-yellow-500 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {provider}
                </button>
              ))}
          </div>

          <div className="absolute inset-0 z-0">
            <iframe
              key={currentEmbed} // Force reload on change
              src={currentEmbed}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Sidebar Subtitle (Learning Mode) */}
      <div className="w-[400px] border-l border-zinc-800 bg-zinc-900 z-30">
        <SubtitlePanel
          subtitles={subtitles}
          currentTime={currentTime}
          onSubtitleClick={(time: number) => {
            // Khó seek iframe, chỉ seek được biến local currentTime
            setCurrentTime(time);
          }}
          // Thêm chế độ Manual Sync
          isExternalMovie={true}
        />
      </div>
    </div>
  );
}
