"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  video: {
    id: number;
    title: string;
    source_type?: string;
    source_url: string;
    youtube_id?: string;
  };
  playerId?: string; // ID for the iframe element
}

export function VideoPlayer({
  video,
  playerId = "youtube-player",
}: VideoPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    console.log("VideoPlayer - Full video data:", video);
    console.log("VideoPlayer - youtube_id:", video.youtube_id);
    console.log("VideoPlayer - source_type:", video.source_type);
  }, [video]);

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      {video.youtube_id ? (
        // YouTube Video
        <div className="aspect-video">
          <div id={playerId} className="w-full h-full"></div>
        </div>
      ) : video.source_url ? (
        // Other video sources
        <div className="aspect-video">
          <video
            src={video.source_url}
            controls
            className="w-full h-full"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
        </div>
      ) : (
        // No video source
        <div className="aspect-video flex items-center justify-center bg-slate-800">
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">
              Không có nguồn video
            </p>
            <p className="text-slate-400 text-sm">
              Video này chưa có youtube_id hoặc source_url
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
