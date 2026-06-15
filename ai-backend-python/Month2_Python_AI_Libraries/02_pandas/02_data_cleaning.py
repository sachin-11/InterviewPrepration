# ============================================================
# Pandas Data Cleaning — AI Training Data Prepare Karna
# Run: python 02_pandas/02_data_cleaning.py
# ============================================================
# AI mein 80% time data cleaning mein jaata hai!
# Garbage in = Garbage out (model bhi galat output dega)
# ============================================================

import pandas as pd
import numpy as np

print("=" * 60)
print("PANDAS DATA CLEANING — AI KE LIYE")
print("=" * 60)

# Messy dataset banana (real data aise hi hota hai)
messy_data = {
    "name":       ["Alice", "Bob", None, "David", "Eva", "Bob", "Frank"],
    "age":        [28, 34, 31, None, 26, 34, -5],      # None aur invalid age
    "salary":     [95000, 72000, 105000, 65000, None, 72000, 80000],
    "department": ["Engineering", "marketing", "ENGINEERING", "HR", "Data Science", "marketing", "IT"],
    "email":      ["alice@co.com", "bob@co.com", "carol@co.com", "david@co.com", "eva@co.com", "bob@co.com", "frank@co.com"],
    "experience": ["5 years", "8 years", "10 years", "3 years", "2 years", "8 years", "6 years"],
}

df = pd.DataFrame(messy_data)
print("Original Messy Data:")
print(df)

# ============================================================
# STEP 1: MISSING VALUES HANDLE KARNA
# ============================================================
print("\n--- STEP 1: Missing Values ---")

# Missing values check karo
print("Missing values per column:")
print(df.isnull().sum())

# Total missing
total_missing = df.isnull().sum().sum()
print(f"\nTotal missing values: {total_missing}")

# Missing percentage
missing_pct = (df.isnull().sum() / len(df)) * 100
print(f"\nMissing percentage:\n{missing_pct}")

# Strategy 1: Drop rows with missing values
df_dropped = df.dropna()
print(f"\nAfter dropna(): {len(df_dropped)} rows (was {len(df)})")

# Strategy 2: Fill with specific value
df_filled = df.copy()
df_filled["name"].fillna("Unknown", inplace=True)
df_filled["salary"].fillna(df_filled["salary"].mean(), inplace=True)  # mean se fill
df_filled["age"].fillna(df_filled["age"].median(), inplace=True)       # median se fill

print(f"\nAfter fillna():")
print(df_filled[["name", "age", "salary"]])

# ============================================================
# STEP 2: DUPLICATES HATANA
# ============================================================
print("\n--- STEP 2: Duplicates ---")

print(f"Duplicate rows: {df.duplicated().sum()}")
print(f"Duplicate emails: {df['email'].duplicated().sum()}")

# Duplicates dekhna
print("\nDuplicate rows:")
print(df[df.duplicated(keep=False)])  # sab duplicates dikhao

# Duplicates hatana
df_clean = df_filled.drop_duplicates(subset=["email"], keep="first")
print(f"\nAfter removing duplicates: {len(df_clean)} rows")

# ============================================================
# STEP 3: DATA TYPES FIX KARNA
# ============================================================
print("\n--- STEP 3: Data Types ---")

print(f"Current dtypes:\n{df_clean.dtypes}")

# "5 years" se "5" nikalna (string se number)
df_clean["experience_years"] = (
    df_clean["experience"]
    .str.replace(" years", "")  # " years" hatao
    .astype(int)                 # string to integer
)

print(f"\nExperience extracted:\n{df_clean[['experience', 'experience_years']]}")

# ============================================================
# STEP 4: TEXT NORMALIZE KARNA
# ============================================================
print("\n--- STEP 4: Text Normalization ---")

# Department mein inconsistency: "marketing", "ENGINEERING", "Engineering"
print(f"Before: {df_clean['department'].unique()}")

df_clean["department"] = df_clean["department"].str.title()  # Title Case
print(f"After:  {df_clean['department'].unique()}")

# Email lowercase
df_clean["email"] = df_clean["email"].str.lower().str.strip()

# ============================================================
# STEP 5: INVALID DATA HATANA
# ============================================================
print("\n--- STEP 5: Invalid Data ---")

# Age -5 invalid hai
print(f"Before age filter: {len(df_clean)} rows")
df_clean = df_clean[df_clean["age"] > 0]
print(f"After age > 0 filter: {len(df_clean)} rows")

# ============================================================
# STEP 6: FINAL CLEAN DATASET
# ============================================================
print("\n--- STEP 6: Final Clean Dataset ---")
print(df_clean[["name", "age", "salary", "department", "experience_years"]])
print(f"\nFinal shape: {df_clean.shape}")
print(f"Missing values: {df_clean.isnull().sum().sum()}")

print("\n✅ Data Cleaning Complete!")
print("\nYAD RAKHO:")
print("  1. Missing values → fillna() ya dropna()")
print("  2. Duplicates → drop_duplicates()")
print("  3. Wrong types → astype(), str.replace()")
print("  4. Inconsistent text → str.title(), str.lower()")
print("  5. Invalid values → boolean filter")
