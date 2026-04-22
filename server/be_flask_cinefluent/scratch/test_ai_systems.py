import os
import sys
import json
from datetime import datetime

# Fix encoding for Windows console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Import Flask app context
sys.path.append(os.getcwd())
from app import create_app
from app.extensions import db
from app.models.models_model import Video, Subtitle, User, MovieAIAnalysis, UserKnowledgeState
from app.services.movie_ai_service import analyze_video_subtitles_service, save_video_ai_analysis_service
from app.services.kt_inference_service import dkt_engine

def test_pipeline():
    app = create_app()
    with app.app_context():
        print("--- 1. Kiểm tra Dữ liệu Phim ---")
        video = Video.query.first()
        if not video:
            print("❌ LỖI: Không tìm thấy video nào trong DB để test.")
            return

        subs_count = Subtitle.query.filter_by(video_id=video.id).count()
        print(f"Video: {video.title} (ID: {video.id})")
        print(f"Số lượng phụ đề: {subs_count}")

        if subs_count == 0:
            print("❌ LỖI: Video này chưa có phụ đề. Hãy upload sub trước.")
            return

        print("\n--- 2. Chạy thử Phân tích AI (Grammar + Cloze) ---")
        try:
            # Lấy 10 câu đầu để test cho nhanh
            test_subs = Subtitle.query.filter_by(video_id=video.id).limit(10).all()
            report = analyze_video_subtitles_service(video, test_subs)
            
            print("✅ Thành công: Đã phân tích AI.")
            print(f"Grammar Tags phổ biến: {report['dominant_grammar_tags']}")
            
            # Check cloze data for one sub
            sample_cloze = next((s.cloze_data for s in test_subs if s.cloze_data), None)
            if sample_cloze:
                print(f"Mẫu Cloze Data: {json.dumps(sample_cloze, ensure_ascii=False)}")
            else:
                print("⚠️ Cảnh báo: Không có câu nào sinh được Cloze Data (có thể do cụm từ quá ngắn).")

        except Exception as e:
            print(f"❌ LỖI Phân tích AI: {str(e)}")

        print("\n--- 3. Kiểm tra Dự đoán DKT (ONNX Inference) ---")
        try:
            user = User.query.first()
            if not user:
                print("⚠️ Bỏ qua: Không tìm thấy user nào để test DKT.")
            else:
                # Mock state hoặc lấy từ DB
                state = UserKnowledgeState.query.filter_by(user_id=user.id).first()
                latent = state.latent_state if state else None
                
                # Test predict logic: Tag 0 (Present Simple)
                # DKT Inference Singleton takes history sequence: list of [tag_id, is_correct]
                # For test, we use a simple sequence
                history = [[0, 1], [0, 1], [4, 0]] 
                probs = dkt_engine.predict_probabilities(history)
                
                if probs is not None:
                    print(f"✅ Thành công: ONNX Inference hoạt động.")
                    print(f"Dự đoán xác suất thuộc bài (Tag 0): {probs[0]:.4f}")
                    print(f"Dự đoán xác suất thuộc bài (Tag 4 - Past Simple): {probs[4]:.4f}")
                else:
                    print("❌ LỖI: ONNX Inference trả về None.")
        except Exception as e:
            print(f"❌ LỖI DKT Inference: {str(e)}")

        print("\n--- 4. Kiểm tra Export VTT Metadata ---")
        try:
            from app.services.video_service import export_subtitle_to_vtt
            vtt_url = export_subtitle_to_vtt(video.id)
            print(f"✅ Thành công: Xuất file VTT tại {vtt_url}")
            
            # Đọc thử file xem có [METADATA] không
            vtt_path = os.path.join(app.root_path, "storage", "subtitles", f"video_{video.id}.vtt")
            if os.path.exists(vtt_path):
                with open(vtt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "[METADATA]" in content:
                        print("✅ Kiểm chứng: File VTT chứa thẻ [METADATA] hợp lệ.")
                    else:
                        print("❌ LỖI: File VTT được tạo nhưng KHÔNG có thẻ [METADATA].")
            else:
                print(f"❌ LỖI: Không tìm thấy file VTT thực tế tại {vtt_path}")
        except Exception as e:
            print(f"❌ LỖI Export VTT: {str(e)}")

if __name__ == "__main__":
    test_pipeline()
