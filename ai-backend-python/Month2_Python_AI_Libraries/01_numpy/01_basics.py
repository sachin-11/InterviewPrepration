# ============================================================
# NumPy Basics — Beginner to Advanced
# Run: python 01_numpy/01_basics.py
# ============================================================

import numpy as np

print("=" * 60)
print("NUMPY BASICS — AI ENGINEER KE LIYE")
print("=" * 60)

# ============================================================
# SECTION 1: ARRAY BANANA (Creating Arrays)
# ============================================================
print("\n--- SECTION 1: Arrays Banana ---")

# Python list se array banana
python_list = [1, 2, 3, 4, 5]
np_array = np.array(python_list)

print(f"Python list : {python_list}")
print(f"NumPy array : {np_array}")
print(f"Type        : {type(np_array)}")
print(f"dtype       : {np_array.dtype}")   # int64 — element ka type
print(f"shape       : {np_array.shape}")   # (5,) — 5 elements, 1D

# Float array — AI mein mostly float use hota hai (embeddings)
float_array = np.array([1.5, 2.7, 3.2], dtype=np.float32)
print(f"\nFloat array : {float_array}")
print(f"dtype       : {float_array.dtype}")  # float32

# 2D Array (Matrix) — neural network weights aise store hote hain
matrix = np.array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
])
print(f"\n2D Matrix:\n{matrix}")
print(f"Shape: {matrix.shape}")  # (3, 3) — 3 rows, 3 columns

# ============================================================
# SECTION 2: SPECIAL ARRAYS (Kaam Aane Wale)
# ============================================================
print("\n--- SECTION 2: Special Arrays ---")

# zeros — sab 0 se initialize karna (model weights initialize karte waqt)
zeros = np.zeros((3, 4))
print(f"Zeros (3x4):\n{zeros}")

# ones — sab 1
ones = np.ones((2, 3))
print(f"\nOnes (2x3):\n{ones}")

# arange — range ki tarah (0 se 9 tak)
range_arr = np.arange(0, 10, 2)  # start, stop, step
print(f"\narange(0,10,2): {range_arr}")  # [0 2 4 6 8]

# linspace — equally spaced values (graphs ke liye)
linspace_arr = np.linspace(0, 1, 5)  # 0 se 1 tak, 5 values
print(f"linspace(0,1,5): {linspace_arr}")  # [0. 0.25 0.5 0.75 1.]

# random — random values (model initialization mein use hota hai)
np.random.seed(42)  # seed set karo reproducibility ke liye
random_arr = np.random.randn(3, 3)  # normal distribution
print(f"\nRandom (3x3):\n{random_arr}")

# ============================================================
# SECTION 3: INDEXING AND SLICING
# ============================================================
print("\n--- SECTION 3: Indexing & Slicing ---")

arr = np.array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])

print(f"Array: {arr}")
print(f"arr[0]    = {arr[0]}")      # 10 — pehla element
print(f"arr[-1]   = {arr[-1]}")     # 100 — aakhri element
print(f"arr[2:5]  = {arr[2:5]}")    # [30 40 50] — index 2 se 4 tak
print(f"arr[::2]  = {arr[::2]}")    # [10 30 50 70 90] — har doosra

# 2D indexing
matrix = np.array([[1,2,3],[4,5,6],[7,8,9]])
print(f"\nMatrix:\n{matrix}")
print(f"matrix[0,0] = {matrix[0,0]}")   # 1 — row 0, col 0
print(f"matrix[1,2] = {matrix[1,2]}")   # 6 — row 1, col 2
print(f"matrix[0,:] = {matrix[0,:]}")   # [1 2 3] — puri row 0
print(f"matrix[:,1] = {matrix[:,1]}")   # [2 5 8] — pura column 1

# Boolean indexing — AI mein filtering ke liye
scores = np.array([45, 78, 92, 34, 88, 56, 71])
high_scores = scores[scores > 70]  # 70 se zyada wale
print(f"\nScores: {scores}")
print(f"Score > 70: {high_scores}")  # [78 92 88 71]

# ============================================================
# SECTION 4: OPERATIONS (Math)
# ============================================================
print("\n--- SECTION 4: Mathematical Operations ---")

a = np.array([1, 2, 3, 4])
b = np.array([10, 20, 30, 40])

# Element-wise operations (har element pe alag alag)
print(f"a + b  = {a + b}")    # [11 22 33 44]
print(f"a * b  = {a * b}")    # [10 40 90 160]
print(f"a ** 2 = {a ** 2}")   # [1 4 9 16]
print(f"a / 2  = {a / 2}")    # [0.5 1. 1.5 2.]

# Aggregate functions
print(f"\nSum    : {a.sum()}")    # 10
print(f"Mean   : {a.mean()}")   # 2.5
print(f"Max    : {a.max()}")    # 4
print(f"Min    : {a.min()}")    # 1
print(f"Std Dev: {a.std():.4f}")  # standard deviation

# Matrix multiplication — neural networks ka core!
# @ operator = matrix multiply
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
C = A @ B  # ya np.dot(A, B)
print(f"\nMatrix A:\n{A}")
print(f"Matrix B:\n{B}")
print(f"A @ B (Matrix Multiply):\n{C}")

# ============================================================
# SECTION 5: RESHAPE — BAHUT IMPORTANT IN AI
# ============================================================
print("\n--- SECTION 5: Reshape ---")

# WHY RESHAPE?
# Neural networks expect specific input shapes
# Example: image (28x28 pixels) ko flatten karna (784,) mein

flat = np.arange(12)  # [0, 1, 2, ..., 11]
print(f"Original (12,): {flat}")

reshaped = flat.reshape(3, 4)  # 3 rows, 4 columns
print(f"\nReshaped (3,4):\n{reshaped}")

reshaped_3d = flat.reshape(2, 2, 3)  # 3D
print(f"\nReshaped (2,2,3):\n{reshaped_3d}")

# -1 matlab "NumPy khud calculate karo"
auto_reshape = flat.reshape(4, -1)  # 4 rows, columns auto
print(f"\nReshape(4,-1):\n{auto_reshape}")

# flatten — kisi bhi shape ko 1D mein
print(f"\nFlatten: {reshaped.flatten()}")

# ============================================================
# SECTION 6: BROADCASTING — MAGIC OF NUMPY
# ============================================================
print("\n--- SECTION 6: Broadcasting ---")

# Broadcasting = different shapes pe operations
# Rule: shapes right se left compare hote hain

matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]])

row_vector = np.array([10, 20, 30])  # shape (3,)

# row_vector automatically har row pe apply hota hai
result = matrix + row_vector
print(f"Matrix + [10,20,30]:\n{result}")
# [[11 22 33]
#  [14 25 36]
#  [17 28 39]]

# Scalar broadcasting
print(f"\nMatrix * 2:\n{matrix * 2}")

print("\n✅ NumPy Basics Complete!")
