# ============================================================
# NumPy for AI — Vectors, Embeddings, Similarity
# Run: python 01_numpy/02_vectors_for_ai.py
# ============================================================
# YE FILE SABSE IMPORTANT HAI AI ENGINEERS KE LIYE
# Embeddings NumPy arrays hi hote hain!
# ============================================================

import numpy as np

print("=" * 60)
print("NUMPY FOR AI — EMBEDDINGS & SIMILARITY")
print("=" * 60)

# ============================================================
# CONCEPT 1: EMBEDDING KYA HOTA HAI?
# ============================================================
print("\n--- CONCEPT 1: Embedding = Float Array ---")

# Real life mein OpenAI text-embedding-3-small
# "Hello" ko 1536 floats mein convert karta hai
# Hum yahan simplified example use karenge

# Imagine karo ye 3 sentences ke embeddings hain
# (Real mein ye 1536 numbers hote hain, hum 4 use kar rahe hain)
sentence_embeddings = {
    "I love Python programming": np.array([0.8, 0.2, 0.9, 0.1]),
    "Python is great for coding": np.array([0.7, 0.3, 0.8, 0.2]),
    "I enjoy eating pizza":       np.array([0.1, 0.9, 0.2, 0.8]),
}

print("Sentence Embeddings:")
for sentence, embedding in sentence_embeddings.items():
    print(f"  '{sentence[:30]}...' → {embedding}")

# ============================================================
# CONCEPT 2: COSINE SIMILARITY — EMBEDDINGS COMPARE KARNA
# ============================================================
print("\n--- CONCEPT 2: Cosine Similarity ---")

# WHY COSINE SIMILARITY?
# Do vectors kitne similar direction mein point kar rahe hain
# Value: -1 (opposite) to 1 (same direction)
# 1 = bilkul same, 0 = unrelated, -1 = opposite

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Do vectors ke beech cosine similarity calculate karta hai.
    
    Formula: cos(θ) = (A · B) / (||A|| × ||B||)
    
    A · B = dot product (element-wise multiply karke sum)
    ||A|| = magnitude (vector ki length)
    """
    # Dot product — element-wise multiply karke sum
    dot_product = np.dot(vec1, vec2)
    
    # Magnitudes (lengths)
    magnitude_v1 = np.linalg.norm(vec1)  # sqrt(sum of squares)
    magnitude_v2 = np.linalg.norm(vec2)
    
    # Avoid division by zero
    if magnitude_v1 == 0 or magnitude_v2 == 0:
        return 0.0
    
    return dot_product / (magnitude_v1 * magnitude_v2)


# Test karo
e1 = sentence_embeddings["I love Python programming"]
e2 = sentence_embeddings["Python is great for coding"]
e3 = sentence_embeddings["I enjoy eating pizza"]

sim_12 = cosine_similarity(e1, e2)
sim_13 = cosine_similarity(e1, e3)

print(f"'Python programming' vs 'Python coding' : {sim_12:.4f}")
print(f"'Python programming' vs 'eating pizza'  : {sim_13:.4f}")
print(f"\nResult: Python sentences zyada similar hain! ({sim_12:.4f} > {sim_13:.4f})")

# ============================================================
# CONCEPT 3: SEMANTIC SEARCH — RAG KA CORE
# ============================================================
print("\n--- CONCEPT 3: Semantic Search (RAG ka Core) ---")

# Ye exactly wahi hai jo RAG systems karte hain:
# 1. Documents ke embeddings store karo
# 2. Query ka embedding lo
# 3. Sabse similar document dhundo

# Document database (simplified embeddings)
documents = [
    {"text": "Python is used for machine learning", "embedding": np.array([0.9, 0.1, 0.8, 0.2])},
    {"text": "JavaScript is used for web development", "embedding": np.array([0.1, 0.9, 0.2, 0.8])},
    {"text": "NumPy is a Python library for math", "embedding": np.array([0.85, 0.15, 0.75, 0.25])},
    {"text": "React is a JavaScript framework", "embedding": np.array([0.15, 0.85, 0.25, 0.75])},
    {"text": "TensorFlow is used for deep learning", "embedding": np.array([0.88, 0.12, 0.82, 0.18])},
]

def semantic_search(query_embedding: np.ndarray, docs: list, top_k: int = 3) -> list:
    """
    Query ke liye sabse relevant documents dhundta hai.
    Ye RAG system ka retrieval step hai.
    """
    results = []
    
    for doc in docs:
        similarity = cosine_similarity(query_embedding, doc["embedding"])
        results.append({
            "text": doc["text"],
            "similarity": similarity
        })
    
    # Similarity ke hisaab se sort karo (highest first)
    results.sort(key=lambda x: x["similarity"], reverse=True)
    
    return results[:top_k]


# Query: "Python math library"
query_embedding = np.array([0.87, 0.13, 0.77, 0.23])

print("Query: 'Python math library'")
print("\nTop 3 Similar Documents:")
results = semantic_search(query_embedding, documents, top_k=3)
for i, result in enumerate(results, 1):
    print(f"  {i}. [{result['similarity']:.4f}] {result['text']}")

# ============================================================
# CONCEPT 4: NORMALIZATION — DATA PREPROCESSING
# ============================================================
print("\n--- CONCEPT 4: Normalization ---")

# WHY NORMALIZE?
# AI models work better when data is in same range (0-1 or -1 to 1)
# Example: salary [50000, 100000] aur age [25, 35] — different scales

raw_data = np.array([
    [50000, 25],   # salary, age
    [75000, 30],
    [100000, 35],
    [60000, 28],
])

print(f"Raw data:\n{raw_data}")

# Min-Max Normalization: (x - min) / (max - min) → 0 to 1
def min_max_normalize(data: np.ndarray) -> np.ndarray:
    """Har column ko 0-1 range mein laata hai."""
    col_min = data.min(axis=0)   # har column ka minimum
    col_max = data.max(axis=0)   # har column ka maximum
    return (data - col_min) / (col_max - col_min)

normalized = min_max_normalize(raw_data)
print(f"\nNormalized (0-1):\n{normalized}")

# Z-score Normalization: (x - mean) / std → mean=0, std=1
def z_score_normalize(data: np.ndarray) -> np.ndarray:
    """Standard normalization — mean 0, std 1."""
    return (data - data.mean(axis=0)) / data.std(axis=0)

z_normalized = z_score_normalize(raw_data)
print(f"\nZ-score Normalized:\n{z_normalized}")

# ============================================================
# CONCEPT 5: BATCH OPERATIONS — PRODUCTION MEIN SPEED
# ============================================================
print("\n--- CONCEPT 5: Batch Operations ---")

# Production mein ek ek sample process karna slow hai
# Batch mein process karo — NumPy ek saath sab karta hai

# 1000 embeddings ek saath process karna
np.random.seed(42)
batch_embeddings = np.random.randn(1000, 128)  # 1000 samples, 128 dimensions
query = np.random.randn(128)  # ek query embedding

# Sab 1000 embeddings ke saath similarity ek line mein!
# Without NumPy: 1000 iterations ka loop
# With NumPy: ek vectorized operation
similarities = batch_embeddings @ query  # dot product with all 1000

# Normalize
norms = np.linalg.norm(batch_embeddings, axis=1) * np.linalg.norm(query)
cosine_sims = similarities / norms

# Top 5 most similar
top_5_indices = np.argsort(cosine_sims)[-5:][::-1]
print(f"Top 5 similar indices: {top_5_indices}")
print(f"Their similarities: {cosine_sims[top_5_indices].round(4)}")

print("\n✅ NumPy for AI Complete!")
print("\nYAD RAKHO:")
print("  Embedding = NumPy float array")
print("  Cosine Similarity = do embeddings kitni similar hain")
print("  Semantic Search = query embedding vs all doc embeddings")
print("  Normalization = data ko same scale pe laana")
