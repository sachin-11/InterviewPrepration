# ─────────────────────────────────────────────────────────────
# 04_loops.py — for / while loops
# ─────────────────────────────────────────────────────────────

# ── 1. for loop over list ─────────────────────────────────────
# JS:  for (const name of names)
names = ["Arjun", "Priya", "Ravi"]

for name in names:
    print(f"Hello {name}")

# ── 2. range() — number loop ──────────────────────────────────
# JS:  for (let i = 0; i < 5; i++)
for i in range(5):
    print(i)          # 0 1 2 3 4

# range(start, stop, step)
for i in range(1, 10, 2):
    print(i)          # 1 3 5 7 9

# ── 3. enumerate() — index + value ───────────────────────────
# JS:  names.forEach((name, i) => ...)
for i, name in enumerate(names):
    print(f"[{i}] {name}")

# ── 4. Loop over dict ─────────────────────────────────────────
user = {"name": "Arjun", "age": 25, "role": "admin"}

# keys only
for key in user:
    print(key)

# values only
for val in user.values():
    print(val)

# key + value (most common)
# JS:  Object.entries(user).forEach(([k, v]) => ...)
for key, val in user.items():
    print(f"{key}: {val}")

# ── 5. while loop ─────────────────────────────────────────────
count = 0
while count < 3:
    print(f"count = {count}")
    count += 1        # Python has no count++ or count--

# ── 6. break / continue ───────────────────────────────────────
for i in range(10):
    if i == 3:
        continue      # skip 3
    if i == 6:
        break         # stop at 6
    print(i)          # 0 1 2 4 5

# ── 7. Loop with else ─────────────────────────────────────────
# Unique to Python — else runs if loop completed without break
for i in range(5):
    if i == 10:       # never true
        break
else:
    print("Loop finished without break")

# ── 8. zip() — loop two lists together ───────────────────────
# JS:  names.forEach((name, i) => { const score = scores[i] })
scores = [85, 92, 78]
for name, score in zip(names, scores):
    print(f"{name}: {score}")

# ── 9. List Comprehension (compact loop) ─────────────────────
# JS:  names.map(n => n.upper())
upper_names = [n.upper() for n in names]
print(upper_names)    # ['ARJUN', 'PRIYA', 'RAVI']

# with condition
# JS:  names.filter(n => n.startsWith("A"))
a_names = [n for n in names if n.startswith("A")]
print(a_names)        # ['Arjun']
