
import re

def parse_srt(content: str):
    """
    Parse nội dung file SRT thành list subtitles.
    
    Input (file SRT):
        1
        00:00:04,260 --> 00:00:19,190
        <i>Là Sam đây, Chúc các bạn xem phim vui vẻ!</i>
        
        2
        00:00:35,750 --> 00:00:39,350
        Ngày xửa ngày xưa,
        Vào một ngày tươi đẹp
    
    Output:
        [
            {"index": 1, "start_time": 4.26, "end_time": 19.19, "text": "Là Sam đây..."},
            {"index": 2, "start_time": 35.75, "end_time": 39.35, "text": "Ngày xửa..."},
        ]
    """
    # Pattern để match từng block subtitle
    pattern = r'(\d+)\s*\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*\n(.*?)(?=\n\n\d+\s*\n|\n\n|\Z)'
    
    matches = re.findall(pattern, content, re.DOTALL)
    
    subtitles = []
    for match in matches:
        index, start, end, text = match
        
        # Xóa HTML tags như <i>, </i>, <b>, </b>...
        text = re.sub(r'<[^>]+>', '', text)
        # Xóa ký tự đặc biệt và trim
        text = text.replace('\r', '').strip()
        # Gộp nhiều dòng thành một (thay \n bằng space)
        text = ' '.join(text.split('\n'))
        
        if text:  # Chỉ thêm nếu có text
            subtitles.append({
                "index": int(index),
                "start_time": time_to_seconds(start.replace('.', ',')),
                "end_time": time_to_seconds(end.replace('.', ',')),
                "text": text
            })
    
    return subtitles


def time_to_seconds(time_str: str) -> float:
    """
    Chuyển đổi timestamp SRT sang giây.
    
    Ví dụ: "00:01:23,456" → 83.456 (giây)
    """
    time_str = time_str.replace(',', '.')
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = float(parts[2])
    
    return hours * 3600 + minutes * 60 + seconds
