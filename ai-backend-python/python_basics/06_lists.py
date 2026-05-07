# ─────────────────────────────────────────────────────────────
# 06_lists.py — Lists (= Arrays in JS)
# ─────────────────────────────────────────────────────────────

# ── 1. Create ─────────────────────────────────────────────────
fruits  = ["apple", "banana", "mango"]
numbers = [1, 2, 3, 4, 5]
mixed   = [1, "hello", True, None]   # Python allows mixed types
empty   = []

# ── 2. Access ─────────────────────────────────────────────────
print(fruits[0])    # apple   (first)
print(fruits[-1])   # mango   (last — Python superpower)
print(fruits[-2])   # banana  (second from last)

# ── 3. Slicing ────────────────────────────────────────────────
# JS:  arr.slice(start, end)
print(fruits[0:2])  # ['apple', 'banana']
print(fruits[1:])   # ['banana', 'mango']
print(fruits[:2])   # ['apple', 'banana']
print(fruits[::-1]) # ['mango', 'banana', 'apple']  (reverse)

# ── 4. Add Items ──────────────────────────────────────────────
fruits.append("grape")          # add to end  (= push)
fruits.insert(1, "cherry")      # add at index
fruits.extend(["kiwi", "pear"]) # add multiple (= push(...arr))
print(fruits)

# ── 5. Remove Items ───────────────────────────────────────────
fruits.remove("banana")         # remove by value
popped = fruits.pop()           # remove last (= pop)
popped_at = fruits.pop(0)       # remove at index
print(fruits)

# ── 6. Check Exists ───────────────────────────────────────────
# JS:  arr.includes("mango")
print("mango" in fruits)        # True / False

# ── 7. Length ─────────────────────────────────────────────────
print(len(fruits))

# ── 8. Sort ───────────────────────────────────────────────────
nums = [3, 1, 4, 1, 5, 9, 2]
nums.sort()                     # in-place sort
print(nums)

nums.sort(reverse=True)         # descending
print(nums)

# sorted() — returns new list, original unchanged
original = [3, 1, 4]
new_sorted = sorted(original)
print(original)    # [3, 1, 4]  — unchanged
print(new_sorted)  # [1, 3, 4]

# ── 9. List Comprehension ─────────────────────────────────────
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# map
doubled = [n * 2 for n in numbers]
print(doubled)

# filter
evens = [n for n in numbers if n % 2 == 0]
print(evens)

# map + filter
even_doubled = [n * 2 for n in numbers if n % 2 == 0]
print(even_doubled)

# ── 10. Useful Functions ──────────────────────────────────────
nums = [3, 1, 4, 1, 5, 9]
print(sum(nums))    # 23
print(max(nums))    # 9
print(min(nums))    # 1
print(list(set(nums)))  # unique values → [1, 3, 4, 5, 9]

# ── 11. Unpack (Destructuring) ────────────────────────────────
# JS:  const [a, b, c] = arr
a, b, c = [10, 20, 30]
print(a, b, c)

# rest
first, *rest = [1, 2, 3, 4, 5]
print(first)   # 1
print(rest)    # [2, 3, 4, 5]

# ── 12. Copy ──────────────────────────────────────────────────
original = [1, 2, 3]
shallow  = original.copy()   # or list(original)
shallow.append(4)
print(original)   # [1, 2, 3]  — not affected
print(shallow)    # [1, 2, 3, 4]
