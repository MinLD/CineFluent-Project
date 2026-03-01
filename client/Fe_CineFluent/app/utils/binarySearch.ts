import { I_Subtitle } from "../lib/types/video";

/**
 * Tìm index của subtitle hiện tại dựa trên thời gian video (Binary Search - O(log n)).
 */
export function findCurrentSubtitleIndex(
  subtitles: I_Subtitle[],
  time: number,
): number {
  if (!subtitles || subtitles.length === 0) return -1;

  let left = 0;
  let right = subtitles.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    // Nếu subtitle này đã bắt đầu (start_time <= time)
    if (subtitles[mid].start_time <= time) {
      result = mid; // Lưu lại vị trí này
      left = mid + 1; // Tìm tiếp ở bên phải để xem có câu nào bắt đầu muộn hơn nhưng vẫn thỏa mãn không
    } else {
      right = mid - 1; // Tìm ở bên trái
    }
  }

  return result;
}
