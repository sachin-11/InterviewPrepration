# ============================================================
# Pandas Basics — Beginner to Advanced
# Run: python 02_pandas/01_basics.py
# ============================================================

import pandas as pd
import numpy as np

print("=" * 60)
print("PANDAS BASICS — AI ENGINEER KE LIYE")
print("=" * 60)

# ============================================================
# SECTION 1: DATAFRAME BANANA
# ============================================================
print("\n--- SECTION 1: DataFrame Banana ---")

# Method 1: Dictionary se
data = {
    "name":       ["Alice", "Bob", "Carol", "David", "Eva"],
    "department": ["Engineering", "Marketing", "Engineering", "HR", "Data Science"],
    "salary":     [95000, 72000, 105000, 65000, 115000],
    "age":        [28, 34, 31, 29, 26],
    "is_active":  [True, True, True, False, True],
}

df = pd.DataFrame(data)
print(df)
print(f"\nShape: {df.shape}")        # (5, 5) — 5 rows, 5 columns
print(f"Columns: {list(df.columns)}")
print(f"dtypes:\n{df.dtypes}")

# ============================================================
# SECTION 2: BASIC INFO DEKHNA
# ============================================================
print("\n--- SECTION 2: DataFrame Info ---")

print("\ndf.info():")
df.info()  # column names, non-null count, dtypes

print("\ndf.describe() — numeric columns ki statistics:")
print(df.describe())  # count, mean, std, min, max, quartiles

print("\nFirst 3 rows (df.head(3)):")
print(df.head(3))

print("\nLast 2 rows (df.tail(2)):")
print(df.tail(2))

# ============================================================
# SECTION 3: COLUMNS ACCESS KARNA
# ============================================================
print("\n--- SECTION 3: Columns Access ---")

# Single column — Series return hoti hai
names = df["name"]
print(f"Names column:\n{names}")
print(f"Type: {type(names)}")  # pandas.core.series.Series

# Multiple columns — DataFrame return hota hai
subset = df[["name", "salary"]]
print(f"\nName + Salary:\n{subset}")

# ============================================================
# SECTION 4: ROWS FILTER KARNA (BAHUT IMPORTANT)
# ============================================================
print("\n--- SECTION 4: Filtering Rows ---")

# Boolean condition se filter
high_salary = df[df["salary"] > 90000]
print(f"Salary > 90000:\n{high_salary}")

# Multiple conditions — & (and), | (or)
# WHY PARENTHESES? Python operator precedence ke wajah se
eng_high = df[(df["department"] == "Engineering") & (df["salary"] > 90000)]
print(f"\nEngineering + Salary > 90000:\n{eng_high}")

# isin() — multiple values check karna
tech_depts = df[df["department"].isin(["Engineering", "Data Science"])]
print(f"\nTech departments:\n{tech_depts}")

# ============================================================
# SECTION 5: loc aur iloc — INDEXING
# ============================================================
print("\n--- SECTION 5: loc vs iloc ---")

# loc — label based (column name se)
# df.loc[row_label, column_label]
print(f"Row 0, 'name' column: {df.loc[0, 'name']}")
print(f"Rows 0-2, name+salary:\n{df.loc[0:2, ['name', 'salary']]}")

# iloc — integer position based
# df.iloc[row_index, col_index]
print(f"\nRow 0, Col 0 (iloc): {df.iloc[0, 0]}")
print(f"First 3 rows, first 2 cols:\n{df.iloc[:3, :2]}")

# ============================================================
# SECTION 6: SORTING
# ============================================================
print("\n--- SECTION 6: Sorting ---")

# Salary ke hisaab se sort (highest first)
sorted_df = df.sort_values("salary", ascending=False)
print(f"Sorted by salary (desc):\n{sorted_df[['name', 'salary']]}")

# Multiple columns se sort
multi_sort = df.sort_values(["department", "salary"], ascending=[True, False])
print(f"\nSorted by dept then salary:\n{multi_sort[['name', 'department', 'salary']]}")

# ============================================================
# SECTION 7: GROUPBY — DATA ANALYSIS KA CORE
# ============================================================
print("\n--- SECTION 7: GroupBy ---")

# Department ke hisaab se average salary
dept_avg = df.groupby("department")["salary"].mean()
print(f"Avg salary by department:\n{dept_avg}")

# Multiple aggregations
dept_stats = df.groupby("department").agg(
    avg_salary=("salary", "mean"),
    max_salary=("salary", "max"),
    employee_count=("name", "count")
)
print(f"\nDepartment stats:\n{dept_stats}")

# ============================================================
# SECTION 8: NEW COLUMNS BANANA (FEATURE ENGINEERING)
# ============================================================
print("\n--- SECTION 8: New Columns (Feature Engineering) ---")

# Simple calculation
df["salary_in_lakhs"] = df["salary"] / 100000
print(f"Salary in lakhs:\n{df[['name', 'salary', 'salary_in_lakhs']]}")

# apply() — custom function har row pe lagao
def salary_grade(salary):
    """Salary ke hisaab se grade assign karo."""
    if salary >= 100000:
        return "A"
    elif salary >= 80000:
        return "B"
    else:
        return "C"

df["grade"] = df["salary"].apply(salary_grade)
print(f"\nWith grades:\n{df[['name', 'salary', 'grade']]}")

# ============================================================
# SECTION 9: VALUE COUNTS — DISTRIBUTION DEKHNA
# ============================================================
print("\n--- SECTION 9: Value Counts ---")

print(f"Department distribution:\n{df['department'].value_counts()}")
print(f"\nGrade distribution:\n{df['grade'].value_counts()}")

print("\n✅ Pandas Basics Complete!")
