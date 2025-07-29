# 01_load_embeddings.py
# データ読み込みの事前チェック用スクリプト
from utils import load_jsonl_embeddings
import os

jsonl_path = os.path.join("..", "data/embeddings", "kou_with_embeddings.jsonl")
ids, texts, vectors = load_jsonl_embeddings(jsonl_path)

print(f"✅ Loaded {len(ids)} records.")
print(f"✅ Shape of vectors: {vectors.shape}")
