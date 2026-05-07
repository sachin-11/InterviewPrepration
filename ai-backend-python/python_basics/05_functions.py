# ─────────────────────────────────────────────────────────────
# 05_functions.py — Functions (complete)
# ─────────────────────────────────────────────────────────────

# ── 1. Basic Function ─────────────────────────────────────────
def greet(name):
    return f"Hello {name}"

print(greet("Arjun"))

# ── 2. Type Hints (use in production always) ──────────────────
def add(a: int, b: int) -> int:
    return a + b

print(add(3, 5))   # 8

# ── 3. Default Parameters ─────────────────────────────────────
# JS:  function createUser(name, role = "user")
def create_user(name: str, role: str = "user") -> dict:
    return {"name": name, "role": role}

print(create_user("Arjun"))           # role = "user" (default)
print(create_user("Priya", "admin"))  # role = "admin"

# ── 4. Keyword Arguments ──────────────────────────────────────
# Python mein arguments naam se bhi pass kar sakte ho
def connect(host: str, port: int, timeout: int = 30):
    return f"Connecting to {host}:{port} (timeout={timeout}s)"

# positional
print(connect("localhost", 5432))

# keyword — order matter nahi karta
print(connect(port=5432, host="localhost", timeout=60))

# ── 5. *args — variable positional args ──────────────────────
# JS:  function sumAll(...numbers)
def sum_all(*numbers) -> int:
    return sum(numbers)

print(sum_all(1, 2, 3, 4, 5))   # 15

# ── 6. **kwargs — variable keyword args ──────────────────────
# JS:  function buildQuery({ page = 1, limit = 10 } = {})
def build_query(**kwargs) -> dict:
    return {
        "page":  kwargs.get("page", 1),
        "limit": kwargs.get("limit", 10),
        "sort":  kwargs.get("sort", "asc"),
    }

print(build_query(page=2, limit=20))

# ── 7. Return Multiple Values ─────────────────────────────────
# JS mein ye nahi hota — Python ka feature
def min_max(nums: list) -> tuple:
    return min(nums), max(nums)

low, high = min_max([3, 1, 9, 2, 7])
print(f"Min={low}, Max={high}")

# ── 8. Lambda (anonymous function) ───────────────────────────
# JS:  const double = x => x * 2
double = lambda x: x * 2
square = lambda x: x ** 2

print(double(5))   # 10
print(square(4))   # 16

# lambda in sorted/filter/map
users = [
    {"name": "Arjun", "score": 85},
    {"name": "Priya", "score": 92},
    {"name": "Ravi",  "score": 78},
]
sorted_users = sorted(users, key=lambda u: u["score"], reverse=True)
print(sorted_users[0]["name"])   # Priya (highest score)

# ── 9. Nested Function / Closure ─────────────────────────────
# JS:  function multiplier(factor) { return x => x * factor }
def multiplier(factor: int):
    def multiply(x: int) -> int:
        return x * factor
    return multiply

triple = multiplier(3)
print(triple(5))    # 15
print(triple(10))   # 30

# ── 10. Docstring ─────────────────────────────────────────────
def calculate_tax(income: float, rate: float = 0.3) -> float:
    """
    Calculate tax on income.

    Args:
        income: Gross income amount
        rate: Tax rate (default 30%)

    Returns:
        Tax amount
    """
    return income * rate

print(calculate_tax(100000))         # 30000.0
print(calculate_tax(100000, 0.2))    # 20000.0
print(calculate_tax.__doc__)         # prints docstring
