# ============================================================
# Pandas for AI — Training Data Prepare Karna
# Run: python 02_pandas/03_ai_usecase.py
# ============================================================
# Real AI use case: Customer reviews ka dataset prepare karna
# LLM fine-tuning ya sentiment analysis ke liye
# ============================================================

import pandas as pd
import numpy as np

print("=" * 60)
print("PANDAS FOR AI — TRAINING DATA PREPARATION")
print("=" * 60)

# ============================================================
# SCENARIO: Customer Reviews Dataset
# Goal: LLM ke liye training data prepare karna
# ============================================================

# Raw customer reviews data
reviews_data = {
    "review_id": range(1, 11),
    "product":   ["Laptop", "Phone", "Laptop", "Headphones", "Phone",
                  "Laptop", "Headphones", "Phone", "Laptop", "Headphones"],
    "rating":    [5, 2, 4, 5, 1, 3, 4, 5, 2, 3],
    "review_text": [
        "Amazing laptop! Very fast and reliable.",
        "Phone broke after 2 weeks. Terrible quality.",
        "Good laptop but battery could be better.",
        "Best headphones I've ever used. Crystal clear sound!",
        "Worst phone ever. Don't buy this garbage.",
        "Average laptop. Nothing special.",
        "Great headphones for the price.",
        "Love this phone! Camera is outstanding.",
        "Laptop overheats constantly. Very disappointed.",
        "Decent headphones. Sound quality is okay.",
    ],
    "helpful_votes": [45, 23, 12, 67, 89, 5, 34, 56, 78, 9],
    "verified_purchase": [True, True, False, True, True, True, False, True, True, False],
}

df = pd.DataFrame(reviews_data)
print("Raw Reviews Dataset:")
print(df[["review_id", "product", "rating", "review_text"]].to_string())

# ============================================================
# STEP 1: SENTIMENT LABEL BANANA (Feature Engineering)
# ============================================================
print("\n--- STEP 1: Sentiment Labels ---")

# Rating se sentiment derive karo
# AI model ko train karne ke liye labels chahiye
def rating_to_sentiment(rating: int) -> str:
    if rating >= 4:
        return "positive"
    elif rating == 3:
        return "neutral"
    else:
        return "negative"

df["sentiment"] = df["rating"].apply(rating_to_sentiment)
print(f"Sentiment distribution:\n{df['sentiment'].value_counts()}")

# ============================================================
# STEP 2: TEXT FEATURES BANANA
# ============================================================
print("\n--- STEP 2: Text Features ---")

# Review length — model ke liye useful feature
df["review_length"] = df["review_text"].str.len()
df["word_count"] = df["review_text"].str.split().str.len()

# Exclamation marks — enthusiasm indicator
df["has_exclamation"] = df["review_text"].str.contains("!").astype(int)

print(df[["review_text", "review_length", "word_count", "has_exclamation"]].to_string())

# ============================================================
# STEP 3: CATEGORICAL ENCODING
# ============================================================
print("\n--- STEP 3: Categorical Encoding ---")

# Machine learning models numbers samajhte hain, strings nahi
# One-Hot Encoding — har category ke liye alag column

# Method 1: pd.get_dummies()
product_encoded = pd.get_dummies(df["product"], prefix="product")
print(f"One-hot encoded products:\n{product_encoded}")

# Method 2: Label Encoding (ordinal data ke liye)
sentiment_map = {"negative": 0, "neutral": 1, "positive": 2}
df["sentiment_label"] = df["sentiment"].map(sentiment_map)
print(f"\nSentiment labels:\n{df[['sentiment', 'sentiment_label']]}")

# ============================================================
# STEP 4: TRAIN/TEST SPLIT
# ============================================================
print("\n--- STEP 4: Train/Test Split ---")

# WHY SPLIT?
# Model ko training data pe train karo
# Test data pe evaluate karo (model ne ye data nahi dekha)
# Agar same data pe train aur test karo → overfitting

# Shuffle karo pehle (order bias hatane ke liye)
df_shuffled = df.sample(frac=1, random_state=42).reset_index(drop=True)

# 80% train, 20% test
split_idx = int(len(df_shuffled) * 0.8)
train_df = df_shuffled[:split_idx]
test_df = df_shuffled[split_idx:]

print(f"Total samples : {len(df)}")
print(f"Training set  : {len(train_df)} samples (80%)")
print(f"Test set      : {len(test_df)} samples (20%)")

# ============================================================
# STEP 5: LLM TRAINING FORMAT MEIN CONVERT KARNA
# ============================================================
print("\n--- STEP 5: LLM Training Format ---")

# OpenAI fine-tuning format:
# {"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}

def create_training_example(row) -> dict:
    """Ek row ko LLM training format mein convert karta hai."""
    return {
        "messages": [
            {
                "role": "system",
                "content": "You are a sentiment analyzer. Classify the review as positive, neutral, or negative."
            },
            {
                "role": "user",
                "content": f"Review: {row['review_text']}"
            },
            {
                "role": "assistant",
                "content": row["sentiment"]
            }
        ]
    }

# Training examples banana
training_examples = [
    create_training_example(row)
    for _, row in train_df.iterrows()
]

print(f"Training examples created: {len(training_examples)}")
print(f"\nExample training record:")
import json
print(json.dumps(training_examples[0], indent=2))

# ============================================================
# STEP 6: DATASET STATISTICS (Model Card ke liye)
# ============================================================
print("\n--- STEP 6: Dataset Statistics ---")

stats = {
    "total_samples": len(df),
    "train_samples": len(train_df),
    "test_samples": len(test_df),
    "sentiment_distribution": df["sentiment"].value_counts().to_dict(),
    "product_distribution": df["product"].value_counts().to_dict(),
    "avg_review_length": df["review_length"].mean(),
    "avg_word_count": df["word_count"].mean(),
}

print("Dataset Statistics:")
for key, value in stats.items():
    print(f"  {key}: {value}")

print("\n✅ AI Training Data Preparation Complete!")
