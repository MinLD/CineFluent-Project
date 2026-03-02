import { useEffect, forwardRef, memo } from "react";
import { AlertCircle } from "lucide-react";
import { I_Video } from "@/app/lib/types/video";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";

interface VideoPlayerProps {
  video: I_Video;
  playerId?: string; // ID for the iframe element
}

// Hàm trợ giúp tách ID từ URL YouTube
function extractYouTubeID(url: string): string | null {
  const pattern = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

// Sử dụng forwardRef & memo để VideoPlayerWrapper có thể điều khiển mượt mà và tránh re-render thừa
export const VideoPlayer = memo(
  forwardRef<HTMLVideoElement, VideoPlayerProps>(
    ({ video, playerId = "youtube-player" }, ref) => {
      useEffect(() => {
        console.log("VideoPlayer - source_url:", video.stream_url);
        console.log("VideoPlayer - source_type:", video.source_type);
      }, [video]);

      const youtubeId =
        video.source_type === "youtube"
          ? extractYouTubeID(video.source_url)
          : null;

      return (
        <div className="bg-slate-900 overflow-hidden ">
          {video.source_type === "youtube" && youtubeId ? (
            // YouTube Video
            <div className="aspect-video">
              <div id={playerId} className="w-full h-full"></div>
            </div>
          ) : video.stream_url && video.source_type === "local" ? (
            // Other video sources
            <div className="aspect-video">
                <video
                  ref={ref}
                src={`${FeApiProxyUrl}/videos/stream/drive/${video.stream_url}`}
                  controls={false}
                  className="w-full h-full"
                  autoPlay
                  playsInline
                />
            </div>
          ) : (
            // No video source
            <div className="aspect-video flex items-center justify-center bg-slate-800">
              <div className="text-center p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">
                  Không có nguồn video hợp lệ
                </p>
                <p className="text-slate-400 text-sm">
                  Kiểm tra lại source_url: {video.source_url}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    },
  ),
);

VideoPlayer.displayName = "VideoPlayer";
