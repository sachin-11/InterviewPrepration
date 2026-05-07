# ─────────────────────────────────────────────────────────────
# 01_variables.py — Variables & Data Types
# ─────────────────────────────────────────────────────────────

# ── JS vs Python ──────────────────────────────────────────────
# JS:   let name = "Arjun"
# PY:   name = "Arjun"       ← no let/const/var

# ── 1. Basic Types ────────────────────────────────────────────
name    = "Arjun"       # str
age     = 25            # int
salary  = 75000.50      # float
is_active = True        # bool  (capital T/F — not true/false like JS)
nothing = None          # None  (= null in JS)

print(name, age, salary, is_active, nothing)

# ── 2. type() — check karo kya hai ───────────────────────────
print(type(name))       # <class 'str'>
print(type(age))        # <class 'int'>
print(type(is_active))  # <class 'bool'>
print(type(nothing))    # <class 'NoneType'>

# ── 3. Multiple Assignment ────────────────────────────────────
x = y = z = 0           # teeno 0 ho gaye
a, b, c = 1, 2, 3       # destructuring (JS: const [a,b,c] = [1,2,3])
print(a, b, c)          # 1 2 3

# ── 4. Type Conversion ────────────────────────────────────────
num_str = "42"
num_int = int(num_str)      # str → int
num_float = float(num_str)  # str → float
back_str = str(100)         # int → str

print(num_int + 8)      # 50
print(num_float)        # 42.0
print(back_str + "!")   # 100!

# ── 5. Constants (convention — UPPER_CASE) ────────────────────
# Python mein real const nahi hota, convention se karte hain
MAX_RETRIES = 3
API_BASE_URL = "https://api.example.com"

# ── 6. None Check ─────────────────────────────────────────────
# JS:  if (val === null || val === undefined)
# PY:  if val is None
value = None
if value is None:
    print("value is empty")

# ── 7. Truthy / Falsy ─────────────────────────────────────────
# Falsy in Python: None, 0, "", [], {}, False
# Truthy: everything else

print(bool(0))      # False
print(bool(""))     # False
print(bool([]))     # False
print(bool(None))   # False
print(bool("hi"))   # True
print(bool([1]))    # True
