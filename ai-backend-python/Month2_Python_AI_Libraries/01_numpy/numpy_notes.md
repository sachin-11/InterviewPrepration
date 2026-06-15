# NumPy — Complete Notes for AI Engineers

## NumPy Kya Hai?

NumPy = **Numerical Python**

Python ki normal list slow hoti hai kyunki:
- Har element ek alag Python object hai
- Memory mein scattered hoti hai

NumPy array fast hai kyunki:
- Sab elements ek hi type ke hote hain (int, float)
- Memory mein contiguous (side by side) store hote hain
- C language mein likha gaya hai internally

## AI Mein NumPy Kahan Use Hota Hai?

```
Text → Embedding Model → [0.23, -0.45, 0.87, ...] ← YE NumPy Array Hai!
```

- **Embeddings store karna** — har word/sentence ek float array hai
- **Cosine similarity calculate karna** — do embeddings kitni similar hain
- **Matrix multiplication** — neural network ka core operation
- **Data normalization** — values ko 0-1 range mein laana
- **Batch processing** — ek saath 1000 samples process karna

## Key Concepts

### 1. ndarray — NumPy ka main data structure
```python
import numpy as np
arr = np.array([1, 2, 3])  # 1D array
matrix = np.array([[1,2],[3,4]])  # 2D array (matrix)
```

### 2. Shape — array ki dimensions
```python
arr.shape    # (3,)      → 3 elements, 1D
matrix.shape # (2, 2)   → 2 rows, 2 columns
```

### 3. dtype — data type
```python
np.array([1.0, 2.0]).dtype  # float64
np.array([1, 2]).dtype      # int64
```

### 4. Broadcasting — different shapes pe operations
```python
arr = np.array([1, 2, 3])
arr + 10  # [11, 12, 13] — 10 har element pe add hota hai
```

## Interview Questions

**Q: NumPy list se faster kyun hai?**
A: NumPy arrays contiguous memory mein store hote hain aur C mein implement hain. Python lists mein har element ek Python object hai jisme overhead hota hai.

**Q: Broadcasting kya hai?**
A: Jab do arrays ki shapes different hoon, NumPy automatically smaller array ko repeat karke operation karta hai. Example: (3,) array ko (3,3) matrix se add karna.

**Q: AI mein numpy ka sabse important use kya hai?**
A: Embeddings — text ko float vectors mein convert karna aur unke beech similarity calculate karna (cosine similarity).

**Q: axis=0 aur axis=1 mein kya fark hai?**
A: axis=0 = column-wise operation (rows ke across), axis=1 = row-wise operation (columns ke across)
