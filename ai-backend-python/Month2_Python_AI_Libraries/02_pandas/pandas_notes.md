# Pandas — Complete Notes for AI Engineers

## Pandas Kya Hai?

Pandas = **Panel Data** (financial data se naam aaya)

Excel ki tarah sochlo — lekin Python mein, 10x powerful, aur millions of rows handle kar sakta hai.

## Core Data Structures

### Series — 1D labeled array
```python
import pandas as pd
s = pd.Series([10, 20, 30], index=["a", "b", "c"])
# a    10
# b    20
# c    30
```

### DataFrame — 2D table (rows + columns)
```python
df = pd.DataFrame({
    "name": ["Alice", "Bob"],
    "salary": [90000, 75000]
})
#     name  salary
# 0  Alice   90000
# 1    Bob   75000
```

## AI Mein Pandas Kahan Use Hota Hai?

1. **Training Data Load karna** — CSV/JSON se data padhna
2. **Data Cleaning** — missing values, duplicates hatana
3. **Feature Engineering** — naye columns banana model ke liye
4. **EDA (Exploratory Data Analysis)** — data samajhna before training
5. **Model Output Analysis** — predictions analyze karna
6. **Dataset Statistics** — mean, std, distribution dekhna

## Key Operations

| Operation | Code | Use Case |
|-----------|------|----------|
| Load CSV | `pd.read_csv("file.csv")` | Training data load |
| Filter rows | `df[df["age"] > 25]` | Data filtering |
| Group by | `df.groupby("dept").mean()` | Category analysis |
| Missing values | `df.fillna(0)` | Data cleaning |
| New column | `df["new"] = df["a"] + df["b"]` | Feature engineering |
| Sort | `df.sort_values("salary", ascending=False)` | Ranking |

## Interview Questions

**Q: DataFrame aur Series mein kya fark hai?**
A: Series 1D hai (ek column), DataFrame 2D hai (multiple columns). DataFrame ko Series ka collection bhi keh sakte hain.

**Q: loc aur iloc mein kya fark hai?**
A: `loc` label-based indexing hai (column name se), `iloc` integer-based hai (position se). `df.loc[0, "name"]` vs `df.iloc[0, 0]`

**Q: groupby kaise kaam karta hai?**
A: Split-Apply-Combine pattern: data ko groups mein split karo, har group pe function apply karo, results combine karo.

**Q: AI mein pandas ka sabse important use kya hai?**
A: Data preprocessing — missing values handle karna, categorical variables encode karna, features normalize karna before model training.

**Q: Large datasets ke liye pandas slow kyun hota hai?**
A: Pandas single-threaded hai aur RAM mein data load karta hai. Data processing ke time Pandas data ka 5x to 10x memory consume karta hai (RAM multiplier rule), jis se Out Of Memory (OOM) errors aate hain. Large data ke liye Polars, Dask, ya Spark use karte hain.

**Q: "Large Dataset" matlab kitna bada? Kaise decide karein ki Pandas use karna hai ya Polars?**
A: 
1. **Dataset Size Classification (RAM Rule):**
   - **Small (< 100 MB):** Har haal mein Pandas use karein. (Runs in milliseconds).
   - **Medium (100 MB - 1 GB):** Pandas easily handle kar lega, par complex operations (groupby, merges) thoda lag kar sakte hain.
   - **Large (1 GB - 10+ GB):** Yahan **Polars** use karna best hai. Pandas yahan crash ho sakta hai kyunki 1 GB file RAM mein active calculations ke dauran 5-10 GB tak occupy kar sakti hai.
   - **Very Large (> 20 GB / Distributed):** Yahan Dask ya Spark/PySpark use karte hain jo distributed system pe chalte hain.

2. **Pandas vs Polars Decision Matrix:**
   - **Pandas Kab Use Karein:**
     - Jab dataset < 1 GB ho.
     - Jab interactive EDA ya rapid plotting (matplotlib, seaborn) karni ho.
     - Scikit-learn ke ML models mein direct feed karna ho (ecosystem integration mature hai).
   - **Polars Kab Use Karein:**
     - Jab data > 1 GB ho aur fast performance ya lightweight RAM consumption chahiye.
     - **Multi-threading:** Polars automatic saare CPU cores use karta hai (Rust engine).
     - **Lazy Evaluation:** Read karne se pehle queries ko optimize karta hai, taki memory waste na ho.

