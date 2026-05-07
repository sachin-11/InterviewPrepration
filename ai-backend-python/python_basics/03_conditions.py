# ─────────────────────────────────────────────────────────────
# 03_conditions.py — if / elif / else
# ─────────────────────────────────────────────────────────────

# ── 1. Basic if/elif/else ─────────────────────────────────────
# JS uses {} braces — Python uses INDENTATION (4 spaces)
score = 75

if score >= 90:
    print("Grade: A")
elif score >= 75:
    print("Grade: B")
elif score >= 60:
    print("Grade: C")
else:
    print("Grade: F")

# ── 2. Comparison Operators ───────────────────────────────────
# ==  equal
# !=  not equal
# >   greater
# <   less
# >=  greater or equal
# <=  less or equal
# is  same object (use for None check)
# in  contains

x = 10
print(x == 10)   # True
print(x != 5)    # True
print(x > 5)     # True

# ── 3. Logical Operators ──────────────────────────────────────
# JS:  &&  ||  !
# PY:  and  or  not

age = 25
has_id = True

if age >= 18 and has_id:
    print("Entry allowed")

if age < 18 or not has_id:
    print("Entry denied")

# ── 4. Ternary (one-liner if) ─────────────────────────────────
# JS:  const label = score > 50 ? "pass" : "fail"
label = "pass" if score > 50 else "fail"
print(label)   # pass

# ── 5. None / Empty Check ─────────────────────────────────────
user = None
name = ""
items = []

if user is None:
    print("No user")

if not name:           # empty string is falsy
    print("Name is empty")

if not items:          # empty list is falsy
    print("No items")

# ── 6. in operator ────────────────────────────────────────────
role = "admin"
allowed_roles = ["admin", "moderator", "superuser"]

if role in allowed_roles:
    print(f"{role} has access")

# ── 7. match/case (Python 3.10+) = switch in JS ──────────────
status_code = 404

match status_code:
    case 200:
        print("OK")
    case 400:
        print("Bad Request")
    case 404:
        print("Not Found")
    case 500:
        print("Server Error")
    case _:             # default
        print("Unknown status")
