
import re

def parse_srt(content: str):
    """
    Parse nội dung file SRT cực kỳ bền bỉ (Robust).
    Xử lý tốt mọi loại xuống dòng (\n, \r\n, \r) và khoảng trắng dư thừa.
    """
    # Bước 1: Chuẩn hóa xuống dòng về \n
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    
    # Bước 2: Chia file thành các khối (đoạn phụ đề)
    # Các đoạn thường cách nhau bởi ít nhất một dòng trống (\n\n)
    blocks = re.split(r'\n\s*\n', content.strip())
    
    subtitles = []
    for block in blocks:
        lines = [line.strip() for line in block.strip().split('\n') if line.strip()]
        if len(lines) < 2:
            continue
            
        # Tìm dòng chứa thời gian (có ký hiệu -->)
        timing_idx = -1
        for i, line in enumerate(lines):
            if '-->' in line:
                timing_idx = i
                break
        
        if timing_idx == -1:
            continue
            
        timing_line = lines[timing_idx]
        # Text là tất cả các dòng sau dòng timing
        text_lines = lines[timing_idx + 1:]
        text = ' '.join(text_lines).strip()
        
        # Cleanup text: Xóa HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        if not text:
            continue

        # Parse timing dùng regex để an tâm về format
        time_matches = re.findall(r'(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})', timing_line)
        if len(time_matches) >= 2:
            start_str = time_matches[0]
            end_str = time_matches[1]
            
            subtitles.append({
                "index": len(subtitles) + 1,
                "start_time": time_to_seconds(start_str),
                "end_time": time_to_seconds(end_str),
                "text": text
            })
            
    return subtitles


def time_to_seconds(time_str: str) -> float:
    """
    Chuyển đổi timestamp SRT/VTT sang giây (Hỗ trợ cả , và .)
    """
    time_str = time_str.replace(',', '.')
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = float(parts[2])
    
    return hours * 3600 + minutes * 60 + seconds


def parse_vtt(content: str):
    """
    Parse nội dung file WebVTT cực kỳ bền bỉ.
    """
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    
    # Xóa header WEBVTT
    content = re.sub(r'^WEBVTT.*?\n', '', content, flags=re.IGNORECASE)
    
    blocks = re.split(r'\n\s*\n', content.strip())
    
    subtitles = []
    for block in blocks:
        lines = [line.strip() for line in block.strip().split('\n') if line.strip()]
        if not lines:
            continue
            
        timing_idx = -1
        for i, line in enumerate(lines):
            if '-->' in line:
                timing_idx = i
                break
                
        if timing_idx == -1:
            continue
            
        timing_line = lines[timing_idx]
        text_lines = lines[timing_idx + 1:]
        text = ' '.join(text_lines).strip()
        text = re.sub(r'<[^>]+>', '', text)
        
        if not text:
            continue

        # VTT có thể có timing dạng 00:00.000 hoặc 00:00:00.000
        raw_times = re.findall(r'(\d{0,2}:?\d{2}:\d{2}\.\d{3})', timing_line)
        
        if len(raw_times) >= 2:
            start_str = raw_times[0]
            end_str = raw_times[1]
            
            # Nếu thiếu phần giờ (HH:), ta thêm vào
            def format_vtt_time(ts):
                if ts.count(':') == 1: return f"00:{ts}"
                return ts

            subtitles.append({
                "index": len(subtitles) + 1,
                "start_time": time_to_seconds(format_vtt_time(start_str)),
                "end_time": time_to_seconds(format_vtt_time(end_str)),
                "text": text
            })
            
    return subtitles
