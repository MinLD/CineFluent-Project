/**
 * Web Worker xử lý bóc tách (parse) WebVTT.
 *
 * Tại sao cần Worker?
 * -> Khi file VTT có hàng nghìn câu, việc xử lý chuỗi văn bản (String processing)
 * trên luồng chính (Main Thread) có thể gây lag UI.
 * Worker sẽ làm việc này ở luồng phụ, UI vẫn sẽ mượt mà 60 FPS.
 */

self.onmessage = (e: MessageEvent) => {
  const { vttText } = e.data;

  try {
    const subtitles = parseVTT(vttText);
    self.postMessage({ success: true, subtitles });
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message });
  }
};

/**
 * Hàm parse VTT được tối ưu hóa để chạy trong Worker.
 */
function parseVTT(vttText: string): any[] {
  const lines = vttText.replace(/\r/g, "").split("\n");
  const subtitles: any[] = [];
  let currentSub: any = null;

  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toUpperCase() === "WEBVTT") {
      startIndex = i + 1;
      break;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      currentSub = null; // [FIX] Quan trọng: Khi gặp dòng trống, kết thúc khối sub cũ để không bị dính số thứ tự khối sau
      continue;
    }

    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->").map((s) => s.trim());
      currentSub = {
        id: subtitles.length + 1,
        start_time: timeToSeconds(startStr),
        end_time: timeToSeconds(endStr),
        content_en: "",
        content_vi: null,
      };
      subtitles.push(currentSub);
    } else if (currentSub) {
      if (/^\d+$/.test(line) && !currentSub.content_en) {
        continue;
      }
      if (!currentSub.content_en) {
        currentSub.content_en = line;
      } else if (currentSub.content_vi === null) {
        currentSub.content_vi = line;
      } else {
        currentSub.content_vi += " " + line;
      }
    }
  }

  return subtitles;
}

function timeToSeconds(t: string): number {
  const parts = t.split(":");
  let hours = 0,
    minutes = 0,
    seconds = 0;

  if (parts.length === 3) {
    hours = parseFloat(parts[0]);
    minutes = parseFloat(parts[1]);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    minutes = parseFloat(parts[0]);
    seconds = parseFloat(parts[1]);
  } else {
    seconds = parseFloat(parts[0]);
  }
  return hours * 3600 + minutes * 60 + seconds;
}
