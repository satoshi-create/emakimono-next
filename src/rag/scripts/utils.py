# utils.py
# 共通関数：JSONLからid, text, embedding配列を抽出
import json
import numpy as np

def load_jsonl_embeddings(jsonl_path):
    ids = []
    texts = []
    vectors = []

    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            obj = json.loads(line)
            ids.append(obj["id"])
            texts.append(obj["text"])
            vectors.append(obj["embedding"])

    # ベクトルはFAISSで扱いやすいようnp.float32に変換
    return ids, texts, np.array(vectors, dtype=np.float32)
