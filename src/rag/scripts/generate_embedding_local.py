# generate_embedding_local.py

from sentence_transformers import SentenceTransformer
import jsonlines

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

input_path = "../data/jsonl/kou_embedding_ready.jsonl"
output_path = "kou_with_embeddings.jsonl"

with jsonlines.open(input_path) as reader, jsonlines.open(output_path, mode='w') as writer:
    for record in reader:
        record["embedding"] = model.encode(record["text"]).tolist()
        writer.write(record)
