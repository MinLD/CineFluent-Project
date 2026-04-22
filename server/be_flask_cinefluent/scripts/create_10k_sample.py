import pandas as pd

INPUT_FILE = r"C:\Users\DDML\Downloads\EdNet-KT1\EdNet_100k_MVP_Part5.csv"
OUTPUT_FILE = r"C:\Users\DDML\Downloads\EdNet-KT1\EdNet_10k_MVP_Part5.csv"
TARGET_USERS = 10000

def create_sample():
    print("1. Đang tải tệp dữ liệu MVP 11.4 triệu dòng (Vui lòng đợi một chút)...")
    df = pd.read_csv(INPUT_FILE)
    
    print("2. Lấy danh sách học sinh (User ID)...")
    unique_users = df['user_id'].unique()
    print(f"   => File hiện tại đang chứa {len(unique_users):,} học sinh khác nhau.")
    
    if len(unique_users) > TARGET_USERS:
        # Lấy 10.000 id học sinh ngẫu nhiên đầu tiên
        selected_users = unique_users[:TARGET_USERS]
        print(f"3. Cắt lấy dữ liệu của {TARGET_USERS:,} học sinh tương ứng...")
        df_sampled = df[df['user_id'].isin(selected_users)]
    else:
        df_sampled = df
        print(f"Chú ý: Chỉ có {len(unique_users)} users nên không cần cắt thêm.")
        
    print(f"   => Dataset thu gọn mới còn lại chính xác: {len(df_sampled):,} dòng tương tác.")
    
    print("4. Đang lưu ra file EdNet_10k_MVP_Part5.csv...")
    df_sampled.to_csv(OUTPUT_FILE, index=False)
    
    print("--- HOÀN TẤT THÀNH CÔNG! ---")
    print(f"Đường dẫn file đã cắt: {OUTPUT_FILE}")

if __name__ == '__main__':
    create_sample()
