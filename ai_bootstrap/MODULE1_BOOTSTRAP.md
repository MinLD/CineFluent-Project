# Module 1 Bootstrap

Muc tieu cua Module 1:
- Phan tich subtitle, metadata, va dac trung hoi thoai
- Cham do kho theo cap cau/canh
- Tong hop thanh do kho cap phim

## 1. Ban chat cua bai toan

Khong can day may "tu nao kho, tu nao de" theo tung tu mot.

Ta cho may nhieu vi du subtitle da duoc gan nhan:
- easy
- medium
- hard

Sau do model se tu hoc pattern:
- cau ngan thuong de hon
- tu vung pho bien thuong de hon
- cau co nhieu menh de thuong kho hon
- noi nhanh, noi nuot am, nhieu tieng on thuong kho hon

## 2. Cach lam nhanh cho nguoi moi

Buoc 1:
- Lay subtitle thanh cac doan ngan 1-2 cau

Buoc 2:
- Gan nhan ban dau bang Gemini hoac quy tac

Buoc 3:
- Nguoi lam du an review lai 100-300 mau

Buoc 4:
- Train mot model phan loai nho

## 3. Rubric gan nhan ban dau

### Easy
- Tu vung pho bien, quen thuoc
- Cau ngan
- Ngu phap co ban: present simple, be, can, need
- It menh de
- Nghe ro, toc do cham hoac vua

### Medium
- Co 1-2 yeu to kho vua phai
- Co cum tu dai hon, them mot menh de phu
- Co the co past simple, present perfect, modal, cau phuc ngan
- Toc do noi vua, co mot chut noi nuot am

### Hard
- Tu vung hiem, tru tuong, hoc thuat, slang hoac idiom
- Cau dai, nhieu menh de
- Co dao ngu, conditional, passive, reduced clause
- Toc do noi nhanh, accent kho, nhieu noise

## 4. Giai thich cac cot trong file CSV

- `scene_id`: ma dong subtitle hoac canh
- `subtitle_text`: noi dung subtitle
- `speech_rate_wps`: toc do noi, words per second
- `topic`: chu de
- `grammar_tags`: diem ngu phap chinh
- `vocab_level_hint`: uoc luong muc tu vung
- `noise_level`: low, medium, high
- `difficulty_label`: easy, medium, hard
- `rationale`: ly do gan nhan

## 5. Prompt de Gemini gan nhan ban dau

```text
You are helping build a movie-English difficulty dataset for Vietnamese learners.

Classify the subtitle into one of: easy, medium, hard.

Consider:
- vocabulary familiarity
- grammar complexity
- sentence length
- likely listening difficulty
- speed and noise metadata if provided

Return strict JSON:
{
  "difficulty_label": "easy|medium|hard",
  "grammar_tags": ["..."],
  "topic": ["..."],
  "vocab_level_hint": "A1|A2|B1|B2|C1",
  "rationale": "short explanation"
}

Subtitle: {{subtitle_text}}
Speech rate: {{speech_rate_wps}}
Noise level: {{noise_level}}
```

## 6. Demo toi thieu cho vong chung ket

Demo ngan gon nhat:
- Chon 3 phim
- Tach subtitle thanh nhieu scene
- Module 1 cham do kho tung scene
- Tong hop ra do kho phim
- Giao dien show:
  - phim nao danh cho beginner
  - phim nao danh cho intermediate
  - phim nao danh cho advanced

## 7. Cach tong hop tu scene sang movie

Moi scene co:
- difficulty score: easy=1, medium=2, hard=3

Diem phim:
- Lay trung binh co trong so
- Tang trong so cho scene noi nhanh, noise cao, subtitle dai

Vi du:
- average_score < 1.7 -> beginner
- 1.7 den < 2.3 -> intermediate
- >= 2.3 -> advanced

## 8. Dieu quan trong nhat

Ban khong can bat dau bang model lon.

Chi can:
- dataset nho nhung sach
- rubric ro rang
- mot model phan loai subtitle hoat dong duoc

The la du de noi voi giam khao rang he thong da co AI rieng de hieu do kho phim.
