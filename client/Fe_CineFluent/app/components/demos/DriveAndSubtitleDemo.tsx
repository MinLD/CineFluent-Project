import React, { useState } from "react";
import axios from "axios";

const DriveAndSubtitleDemo = () => {
  const [videoFileId, setVideoFileId] = useState("");
  const [subtitles, setSubtitles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Demo Streaming: Chỉ cần gắn link vào src
  const streamUrl = videoFileId
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/videos/stream/drive/${videoFileId}`
    : "";

  // 2. Demo Parse Subtitle
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      // Gọi API parse
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/videos/subtitles/parse`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      console.log("Parsed Subtitles:", response.data.data);
      setSubtitles(response.data.data); // Mảng { start_time, end_time, text }
    } catch (error) {
      console.error("Error parsing subtitle:", error);
      alert("Lỗi parse subtitle!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-5 border rounded-lg max-w-2xl mx-auto mt-10 space-y-8">
      <h1 className="text-2xl font-bold mb-4">
        Demo: Drive Stream & Subtitle API
      </h1>

      {/* SECTION 1: STREAMING */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold bg-blue-100 p-2 rounded">
          1. Video Streaming
        </h2>
        <input
          type="text"
          placeholder="Nhập Google Drive File ID..."
          className="w-full p-2 border rounded"
          value={videoFileId}
          onChange={(e) => setVideoFileId(e.target.value)}
        />

        {streamUrl && (
          <div className="aspect-video bg-black rounded overflow-hidden">
            {/* Thẻ video chuẩn HTML5 */}
            <video controls className="w-full h-full" src={streamUrl} />
          </div>
        )}
        <p className="text-sm text-gray-500">
          * Video sẽ tự động load chunk (Range Request). Mở Network Tab để xem
          các request 206 Partial Content.
        </p>
      </div>

      {/* SECTION 2: SUBTITLE PARSING */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold bg-green-100 p-2 rounded">
          2. Parse SRT to JSON
        </h2>
        <input type="file" accept=".srt" onChange={handleFileUpload} />

        {isUploading && <p>Đang xử lý...</p>}

        {subtitles.length > 0 && (
          <div className="bg-gray-50 p-4 rounded h-64 overflow-auto border">
            <h3 className="font-bold mb-2">
              Kết quả JSON ({subtitles.length} dòng):
            </h3>
            <pre className="text-xs">{JSON.stringify(subtitles, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveAndSubtitleDemo;
