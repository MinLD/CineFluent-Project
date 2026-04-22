# =========================================
# PHẦN 1 - CHUẨN BỊ MÔI TRƯỜNG VÀ THƯ VIỆN
# =========================================

#!pip uninstall -y transformers tokenizers huggingface_hub accelerate datasets sentencepiece
#!pip install -q --no-cache-dir \
#   "transformers==4.57.1" \
#   "tokenizers>=0.22,<0.23" \
#   "huggingface_hub>=0.34,<1.0" \
#   "accelerate>=1.0,<2.0" \
#   "datasets>=3.0,<4.0" \
#   "sentencepiece"

import os
os.kill(os.getpid(), 9)

# =========================================
# IMPORT THƯ VIỆN
# =========================================

import io
import os
import re
import json
import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import torch
import torch.nn as nn

from dataclasses import dataclass
from typing import Optional, Tuple

from google.colab import files
from datasets import Dataset
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import accuracy_score, f1_score, classification_report
from transformers import (
    AutoTokenizer,
    AutoModel,
    DataCollatorWithPadding,
    TrainingArguments,
    Trainer,
)
from transformers.utils import ModelOutput

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

MODEL_NAME = "FacebookAI/xlm-roberta-base"

# =========================================
# PHẦN 2 - CHUẨN BỊ DỮ LIỆU VÀ TẠO NHÃN
# =========================================

SCORE_BINS = [
    {"id": 0, "name": "bin_1", "low": 1.00, "high": 1.30, "midpoint": 1.15},
    {"id": 1, "name": "bin_2", "low": 1.31, "high": 1.60, "midpoint": 1.46},
    {"id": 2, "name": "bin_3", "low": 1.61, "high": 1.90, "midpoint": 1.76},
    {"id": 3, "name": "bin_4", "low": 1.91, "high": 2.20, "midpoint": 2.05},
    {"id": 4, "name": "bin_5", "low": 2.21, "high": 2.50, "midpoint": 2.36},
    {"id": 5, "name": "bin_6", "low": 2.51, "high": 3.00, "midpoint": 2.75},
]

DIFF_LABEL_TO_ID = {b["name"]: b["id"] for b in SCORE_BINS}
DIFF_ID_TO_LABEL = {b["id"]: b["name"] for b in SCORE_BINS}
MIDPOINT_VECTOR = np.array([b["midpoint"] for b in SCORE_BINS], dtype=np.float32)

def score_to_bin_name(score: float) -> str:
    score = float(score)
    for b in SCORE_BINS:
        if b["low"] <= score <= b["high"]:
            return b["name"]
    if score < 1.00:
        return SCORE_BINS[0]["name"]
    return SCORE_BINS[-1]["name"]

def score_to_label(score: float) -> str:
    if score <= 1.60:
        return "easy"
    elif score <= 2.30:
        return "medium"
    return "hard"

def score_to_cefr(score: float) -> str:
    if score <= 1.60:
        return "A2"
    elif score <= 2.30:
        return "B1"
    return "B2"

uploaded = files.upload()

# Đọc dataset
dataset_file = next(iter(uploaded.keys()))
df = pd.read_csv(io.BytesIO(uploaded[dataset_file]))

required_columns = [
    "movie_id",
    "movie_title",
    "scene_id",
    "duration",
    "subtitle_text_clean",
    "difficulty_score",
    "grammar_tag_primary",
]

missing_columns = [col for col in required_columns if col not in df.columns]
if missing_columns:
    raise ValueError(f"Thiếu cột bắt buộc: {missing_columns}")

df = df.copy()

# Làm sạch dữ liệu
df["subtitle_text_clean"] = df["subtitle_text_clean"].astype(str).fillna("").str.strip()
df["difficulty_score"] = pd.to_numeric(df["difficulty_score"], errors="coerce")
df["duration"] = pd.to_numeric(df["duration"], errors="coerce")
df["grammar_tag_primary"] = df["grammar_tag_primary"].astype(str).fillna("").str.strip().str.lower()

# Loại dòng không hợp lệ
df = df[df["subtitle_text_clean"] != ""].reset_index(drop=True)
df = df[df["difficulty_score"].notna()].reset_index(drop=True)
df = df[df["duration"].notna()].reset_index(drop=True)
df = df[df["grammar_tag_primary"] != ""].reset_index(drop=True)

# Giới hạn score
df["difficulty_score"] = df["difficulty_score"].clip(lower=1.0, upper=3.0)

# Tạo nhãn difficulty
df["difficulty_bin"] = df["difficulty_score"].apply(score_to_bin_name)
df["labels_difficulty"] = df["difficulty_bin"].map(DIFF_LABEL_TO_ID)

# Tạo nhãn grammar
grammar_tags = sorted(df["grammar_tag_primary"].unique().tolist())
GRAMMAR_LABEL_TO_ID = {tag: idx for idx, tag in enumerate(grammar_tags)}
GRAMMAR_ID_TO_LABEL = {idx: tag for tag, idx in GRAMMAR_LABEL_TO_ID.items()}

df["labels_grammar"] = df["grammar_tag_primary"].map(GRAMMAR_LABEL_TO_ID)

print("Rows:", len(df))
print("Movies:", df["movie_id"].nunique())
print("\nDifficulty bins:")
print(df["difficulty_bin"].value_counts().sort_index())
print("\nGrammar tags:")
print(df["grammar_tag_primary"].value_counts().head(20))

df.head()

# =========================================
# PHẦN 3 - TRỰC QUAN HÓA DỮ LIỆU
# =========================================

# 3.1. Phân bố difficulty bins
bin_counts = df["difficulty_bin"].value_counts().sort_index()

plt.figure(figsize=(8, 4))
bin_counts.plot(kind="bar")
plt.title("Phân bố difficulty bins")
plt.xlabel("Difficulty bin")
plt.ylabel("Số lượng mẫu")
plt.xticks(rotation=0)
plt.tight_layout()
plt.show()
# 3.2. Top grammar tags
top_grammar = df["grammar_tag_primary"].value_counts().head(10)

plt.figure(figsize=(10, 5))
top_grammar.plot(kind="bar")
plt.title("Top 10 grammar tags")
plt.xlabel("Grammar tag")
plt.ylabel("Số lượng mẫu")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.show()

# =========================================
# PHẦN 4 - CHIA DỮ LIỆU
# =========================================

groups = df["movie_id"]

# Chia train_valid và test
outer_splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEED)
train_valid_idx, test_idx = next(outer_splitter.split(df, groups=groups))

train_valid_df = df.iloc[train_valid_idx].reset_index(drop=True)
test_df = df.iloc[test_idx].reset_index(drop=True)

# Chia tiếp train và validation
inner_groups = train_valid_df["movie_id"]
inner_splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEED + 1)
train_idx, valid_idx = next(inner_splitter.split(train_valid_df, groups=inner_groups))

train_df = train_valid_df.iloc[train_idx].reset_index(drop=True)
valid_df = train_valid_df.iloc[valid_idx].reset_index(drop=True)

print("Train rows:", len(train_df), "| movies:", train_df["movie_id"].nunique())
print("Valid rows:", len(valid_df), "| movies:", valid_df["movie_id"].nunique())
print("Test rows :", len(test_df),  "| movies:", test_df["movie_id"].nunique())

# Trực quan kích thước các tập dữ liệu
split_counts = pd.Series({
    "Train": len(train_df),
    "Validation": len(valid_df),
    "Test": len(test_df)
})

plt.figure(figsize=(6, 4))
split_counts.plot(kind="bar")
plt.title("Kích thước các tập dữ liệu")
plt.ylabel("Số lượng mẫu")
plt.xticks(rotation=0)
plt.tight_layout()
plt.show()

# =========================================
# PHẦN 5 - TOKENIZATION VÀ DATASET
# =========================================

train_ds = Dataset.from_pandas(
    train_df[["subtitle_text_clean", "labels_difficulty", "labels_grammar"]],
    preserve_index=False
)
valid_ds = Dataset.from_pandas(
    valid_df[["subtitle_text_clean", "labels_difficulty", "labels_grammar"]],
    preserve_index=False
)
test_ds = Dataset.from_pandas(
    test_df[["subtitle_text_clean", "labels_difficulty", "labels_grammar"]],
    preserve_index=False
)

train_ds, valid_ds, test_ds

# Tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
MAX_LENGTH = 128

def tokenize_batch(batch):
    return tokenizer(
        batch["subtitle_text_clean"],
        truncation=True,
        max_length=MAX_LENGTH,
    )

train_ds = train_ds.map(tokenize_batch, batched=True)
valid_ds = valid_ds.map(tokenize_batch, batched=True)
test_ds = test_ds.map(tokenize_batch, batched=True)

data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

# =========================================
# PHẦN 6 - XÂY DỰNG MÔ HÌNH MULTI-TASK
# =========================================

@dataclass
class MultiTaskOutput(ModelOutput):
    loss: Optional[torch.FloatTensor] = None
    difficulty_logits: Optional[torch.FloatTensor] = None
    grammar_logits: Optional[torch.FloatTensor] = None
    hidden_states: Optional[Tuple[torch.FloatTensor, ...]] = None
    attentions: Optional[Tuple[torch.FloatTensor, ...]] = None

class XLMRMultiTaskModel(nn.Module):
    def __init__(self, model_name: str, num_difficulty_labels: int, num_grammar_labels: int):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        hidden_size = self.encoder.config.hidden_size
        dropout_prob = getattr(self.encoder.config, "hidden_dropout_prob", 0.1)

        self.dropout = nn.Dropout(dropout_prob)
        self.difficulty_head = nn.Linear(hidden_size, num_difficulty_labels)
        self.grammar_head = nn.Linear(hidden_size, num_grammar_labels)

        self.loss_difficulty = nn.CrossEntropyLoss()
        self.loss_grammar = nn.CrossEntropyLoss()

    def forward(
        self,
        input_ids=None,
        attention_mask=None,
        token_type_ids=None,
        labels_difficulty=None,
        labels_grammar=None,
    ):
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
            return_dict=True,
        )

        # Lấy embedding của token đầu tiên
        pooled = outputs.last_hidden_state[:, 0]
        pooled = self.dropout(pooled)

        difficulty_logits = self.difficulty_head(pooled)
        grammar_logits = self.grammar_head(pooled)

        loss = None
        if labels_difficulty is not None and labels_grammar is not None:
            loss_diff = self.loss_difficulty(difficulty_logits, labels_difficulty)
            loss_gram = self.loss_grammar(grammar_logits, labels_grammar)
            loss = 0.6 * loss_diff + 0.4 * loss_gram

        return MultiTaskOutput(
            loss=loss,
            difficulty_logits=difficulty_logits,
            grammar_logits=grammar_logits,
            hidden_states=outputs.hidden_states,
            attentions=outputs.attentions,
        )

model = XLMRMultiTaskModel(
    model_name=MODEL_NAME,
    num_difficulty_labels=len(SCORE_BINS),
    num_grammar_labels=len(GRAMMAR_LABEL_TO_ID),
)

model

# =========================================
# PHẦN 7 - HUẤN LUYỆN VÀ ĐÁNH GIÁ
# =========================================

def compute_metrics(eval_pred):
    predictions, labels = eval_pred

    difficulty_logits, grammar_logits = predictions
    labels_difficulty, labels_grammar = labels

    difficulty_preds = np.argmax(difficulty_logits, axis=-1)
    grammar_preds = np.argmax(grammar_logits, axis=-1)

    return {
        "difficulty_accuracy": accuracy_score(labels_difficulty, difficulty_preds),
        "difficulty_f1_macro": f1_score(labels_difficulty, difficulty_preds, average="macro"),
        "grammar_accuracy": accuracy_score(labels_grammar, grammar_preds),
        "grammar_f1_macro": f1_score(labels_grammar, grammar_preds, average="macro"),
    }

training_args = TrainingArguments(
    output_dir="/content/xlmr_multitask_ckpt",
    eval_strategy="epoch",
    save_strategy="epoch",
    logging_strategy="steps",
    logging_steps=50,
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="difficulty_f1_macro",
    greater_is_better=True,
    save_total_limit=2,
    fp16=torch.cuda.is_available(),
    report_to="none",
    seed=SEED,
    label_names=["labels_difficulty", "labels_grammar"],
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=valid_ds,
    processing_class=tokenizer,
    data_collator=data_collator,
    compute_metrics=compute_metrics,
)

trainer.train()

valid_metrics = trainer.evaluate(valid_ds, metric_key_prefix="valid")
test_metrics = trainer.evaluate(test_ds, metric_key_prefix="test")

print("VALID:", valid_metrics)
print("TEST :", test_metrics)

pred_output = trainer.predict(test_ds)

difficulty_logits, grammar_logits = pred_output.predictions
labels_difficulty, labels_grammar = pred_output.label_ids

difficulty_preds = np.argmax(difficulty_logits, axis=-1)
grammar_preds = np.argmax(grammar_logits, axis=-1)

print("Difficulty report:")
print(classification_report(labels_difficulty, difficulty_preds, digits=4))

print("Grammar report:")
print(classification_report(labels_grammar, grammar_preds, digits=4))

# Trực quan metric
metric_df = pd.DataFrame({
    "Metric": [
        "Difficulty Accuracy",
        "Difficulty F1 Macro",
        "Grammar Accuracy",
        "Grammar F1 Macro"
    ],
    "Value": [
        test_metrics["test_difficulty_accuracy"],
        test_metrics["test_difficulty_f1_macro"],
        test_metrics["test_grammar_accuracy"],
        test_metrics["test_grammar_f1_macro"]
    ]
})

plt.figure(figsize=(8, 4))
plt.bar(metric_df["Metric"], metric_df["Value"])
plt.title("Kết quả đánh giá trên tập test")
plt.ylabel("Score")
plt.xticks(rotation=20, ha="right")
plt.ylim(0, 1)
plt.tight_layout()
plt.show()

# =========================================
# PHẦN 8 - Demo
# =========================================


# Hàm hỗ trợ đọc file .srt
new_subtitle_upload = files.upload()

def parse_srt_timecode(time_text: str) -> float:
    time_text = time_text.strip().replace(",", ".")
    h, m, s = time_text.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)

def clean_subtitle_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r"<[^>]*>", " ", text)
    text = re.sub(r"{\\.*?}", " ", text)
    text = re.sub(r"\[.*?\]", " ", text)
    text = re.sub(r"\(.*?\)", " ", text)
    text = text.replace("♪", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text

def parse_srt_content(content: str):
    blocks = re.split(r"\n\s*\n", content.strip(), flags=re.MULTILINE)
    rows = []

    for idx, block in enumerate(blocks, start=1):
        lines = [line.strip("\ufeff").strip() for line in block.splitlines() if line.strip()]
        if len(lines) < 2:
            continue

        time_line_idx = 1 if re.fullmatch(r"\d+", lines[0]) else 0
        if time_line_idx >= len(lines):
            continue

        time_line = lines[time_line_idx]
        if "-->" not in time_line:
            continue

        start_text, end_text = [part.strip() for part in time_line.split("-->")[:2]]
        text_lines = lines[time_line_idx + 1:]

        subtitle_text_clean = clean_subtitle_text(" ".join(text_lines))
        if not subtitle_text_clean:
            continue

        start_sec = parse_srt_timecode(start_text)
        end_sec = parse_srt_timecode(end_text)
        duration = max(end_sec - start_sec, 0.1)

        rows.append({
            "scene_id": f"infer_{idx:05d}",
            "duration": duration,
            "subtitle_text_clean": subtitle_text_clean,
        })

    return pd.DataFrame(rows)

# Đọc File và Dự đoán
srt_file = next(iter(new_subtitle_upload.keys()))
srt_content = io.BytesIO(new_subtitle_upload[srt_file]).read().decode("utf-8-sig", errors="ignore")
infer_df = parse_srt_content(srt_content)

print("Số segment:", len(infer_df))
infer_df.head()
if len(infer_df) == 0:
    raise ValueError("Không đọc được segment nào từ file .srt")

infer_ds = Dataset.from_pandas(infer_df[["subtitle_text_clean"]], preserve_index=False)
infer_ds = infer_ds.map(tokenize_batch, batched=True)

pred_output = trainer.predict(infer_ds)
difficulty_logits, grammar_logits = pred_output.predictions

difficulty_probs = torch.softmax(torch.tensor(difficulty_logits), dim=-1).numpy()
grammar_probs = torch.softmax(torch.tensor(grammar_logits), dim=-1).numpy()

infer_df = infer_df.copy()
infer_df["pred_score"] = difficulty_probs @ MIDPOINT_VECTOR
infer_df["pred_label"] = infer_df["pred_score"].apply(score_to_label)
infer_df["pred_cefr"] = infer_df["pred_score"].apply(score_to_cefr)
infer_df["pred_grammar_tag"] = [GRAMMAR_ID_TO_LABEL[int(x)] for x in np.argmax(grammar_logits, axis=-1)]
infer_df["difficulty_confidence"] = difficulty_probs.max(axis=1)
infer_df["grammar_confidence"] = grammar_probs.max(axis=1)

infer_df.head(10)

# Tổng hợp mức độ của cả phim
def score_to_movie_level(score: float) -> str:
    if score <= 1.60:
        return "Beginner"
    elif score <= 2.30:
        return "Intermediate"
    return "Advanced"

def build_cefr_range(cefr_ratios: dict) -> str:
    ordered = ["A2", "B1", "B2"]
    present = [x for x in ordered if cefr_ratios.get(x, 0.0) >= 0.15]
    if not present:
        return "B1"
    if len(present) == 1:
        return present[0]
    return f"{present[0]}-{present[-1]}"

weights = infer_df["duration"].clip(lower=0.1).to_numpy()
movie_score = float(np.average(infer_df["pred_score"], weights=weights))
movie_level = score_to_movie_level(movie_score)

difficulty_ratios = infer_df["pred_label"].value_counts(normalize=True).to_dict()
cefr_ratios = infer_df["pred_cefr"].value_counts(normalize=True).to_dict()
movie_cefr_range = build_cefr_range(cefr_ratios)

report = {
    "movie_file": srt_file,
    "segment_count": int(len(infer_df)),
    "movie_score": round(movie_score, 4),
    "movie_level": movie_level,
    "movie_cefr_range": movie_cefr_range,
    "difficulty_ratios": difficulty_ratios,
    "cefr_ratios": cefr_ratios,
}

print(json.dumps(report, ensure_ascii=False, indent=2))

# Trực quan hóa kết quả demo
pred_label_counts = infer_df["pred_label"].value_counts()

plt.figure(figsize=(6, 4))
pred_label_counts.plot(kind="bar")
plt.title("Phân bố độ khó của subtitle phim")
plt.xlabel("Mức độ")
plt.ylabel("Số segment")
plt.xticks(rotation=0)
plt.tight_layout()
plt.show()
cefr_counts = infer_df["pred_cefr"].value_counts().reindex(["A2", "B1", "B2"], fill_value=0)

plt.figure(figsize=(6, 4))
cefr_counts.plot(kind="bar")
plt.title("Phân bố CEFR của subtitle phim")
plt.xlabel("CEFR")
plt.ylabel("Số segment")
plt.xticks(rotation=0)
plt.tight_layout()
plt.show()

#lưu model
SAVE_DIR = "/content/xlmr_multitask_model"
os.makedirs(SAVE_DIR, exist_ok=True)

torch.save(model.state_dict(), os.path.join(SAVE_DIR, "multitask_model.pt"))
tokenizer.save_pretrained(SAVE_DIR)

with open(os.path.join(SAVE_DIR, "score_bins.json"), "w", encoding="utf-8") as f:
    json.dump(SCORE_BINS, f, ensure_ascii=False, indent=2)

with open(os.path.join(SAVE_DIR, "grammar_label_map.json"), "w", encoding="utf-8") as f:
    json.dump(
        {
            "grammar_label_to_id": GRAMMAR_LABEL_TO_ID,
            "grammar_id_to_label": {str(k): v for k, v in GRAMMAR_ID_TO_LABEL.items()},
        },
        f,
        ensure_ascii=False,
        indent=2,
    )

print("Saved to:", SAVE_DIR)

