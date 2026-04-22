import os
import io
import json
import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import torch
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    DataCollatorWithPadding,
    TrainingArguments,
    Trainer,
)

# =========================================
# PHẦN 1 - CONFIG & TẠO SEED
# =========================================
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

MODEL_NAME = "FacebookAI/xlm-roberta-base"
CSV_PATH = "tense.csv"  # Đặt file tense.csv cùng thư mục
MAX_LENGTH = 64 # Giảm xuống 64 vì các câu tense khá ngắn => Train cực nhanh

print(f"Loading data from: {CSV_PATH}")

if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(f"Không tìm thấy file {CSV_PATH}. Vui lòng đặt file csv vào cùng thư mục.")

# =========================================
# PHẦN 2 - ĐỌC VÀ CHUẨN BỊ DỮ LIỆU
# =========================================
try:
    df = pd.read_csv(CSV_PATH, encoding='utf-8')
except UnicodeDecodeError:
    df = pd.read_csv(CSV_PATH, encoding='ISO-8859-1')

# Dọn dẹp khoảng trắng ở tên cột (Fix KeyError)
df.columns = df.columns.str.strip()

df = df.dropna(subset=['sentence', 'tense'])
df['sentence'] = df['sentence'].astype(str).str.strip()
df['tense'] = df['tense'].astype(str).str.strip().str.lower()
df = df[df['sentence'] != ""]

# Tạo từ điển Label
grammar_tags = sorted(df["tense"].unique().tolist())
GRAMMAR_LABEL_TO_ID = {tag: idx for idx, tag in enumerate(grammar_tags)}
GRAMMAR_ID_TO_LABEL = {idx: tag for tag, idx in GRAMMAR_LABEL_TO_ID.items()}

num_labels = len(grammar_tags)
df["label"] = df["tense"].map(GRAMMAR_LABEL_TO_ID)

print(f"Total Rows: {len(df)}")
print(f"Total Classes: {num_labels}")
print("Label Distribution:")
print(df["tense"].value_counts())

# =========================================
# PHẦN 3 - CHIA DATASET VÀ TOKENIZE
# =========================================
# Chia Train (80%), Valid (10%), Test (10%)
train_df, temp_df = train_test_split(df, test_size=0.2, random_state=SEED, stratify=df["label"])
valid_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=SEED, stratify=temp_df["label"])

print(f"Train: {len(train_df)} | Valid: {len(valid_df)} | Test: {len(test_df)}")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize_batch(batch):
    return tokenizer(
        batch["sentence"],
        padding=False,
        truncation=True,
        max_length=MAX_LENGTH,
    )

train_ds = Dataset.from_pandas(train_df[["sentence", "label"]], preserve_index=False).map(tokenize_batch, batched=True)
valid_ds = Dataset.from_pandas(valid_df[["sentence", "label"]], preserve_index=False).map(tokenize_batch, batched=True)
test_ds = Dataset.from_pandas(test_df[["sentence", "label"]], preserve_index=False).map(tokenize_batch, batched=True)

data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

# =========================================
# PHẦN 4 - BUILD MODEL (SINGLE-TASK)
# =========================================
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, 
    num_labels=num_labels,
    id2label=GRAMMAR_ID_TO_LABEL,
    label2id=GRAMMAR_LABEL_TO_ID
)

# =========================================
# PHẦN 5 - TRAINING
# =========================================
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1_macro": f1_score(labels, preds, average="macro"),
    }

training_args = TrainingArguments(
    output_dir="./xlmr_grammar_ckpt",
    eval_strategy="epoch",
    save_strategy="epoch",
    logging_strategy="steps",
    logging_steps=20,
    learning_rate=3e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=5, # 5 epoch vì Single-Task hội tụ nhanh
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="f1_macro",
    greater_is_better=True,
    save_total_limit=2,
    fp16=torch.cuda.is_available(),
    report_to="none",
    seed=SEED,
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

print("Starting training...")
trainer.train()

# =========================================
# PHẦN 6 - EVALUATION & SAVE
# =========================================
print("Evaluating on Test Set...")
test_metrics = trainer.evaluate(test_ds, metric_key_prefix="test")
print(test_metrics)

pred_output = trainer.predict(test_ds)
preds = np.argmax(pred_output.predictions, axis=-1)

print("\nClassification Report (Test Set):")
print(classification_report(test_df["label"], preds, target_names=[GRAMMAR_ID_TO_LABEL[i] for i in range(num_labels)], digits=4))

SAVE_DIR = "./xlm_grammar_model_final"
os.makedirs(SAVE_DIR, exist_ok=True)

trainer.save_model(SAVE_DIR)
tokenizer.save_pretrained(SAVE_DIR)

# Lưu từ điển ID Map cho Backend sử dụng
with open(os.path.join(SAVE_DIR, "grammar_label_map.json"), "w", encoding="utf-8") as f:
    json.dump({
        "grammar_label_to_id": GRAMMAR_LABEL_TO_ID,
        "grammar_id_to_label": {str(k): v for k, v in GRAMMAR_ID_TO_LABEL.items()}
    }, f, ensure_ascii=False, indent=2)

print(f"✅ Đã huấn luyện xong và lưu Model tại: {SAVE_DIR}")
