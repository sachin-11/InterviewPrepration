# ─────────────────────────────────────────────────────────────
# 01_functions.py — Python Functions (Node.js dev ke liye)
# ─────────────────────────────────────────────────────────────

# ── 1. Basic Function ─────────────────────────────────────────
# JS:  function greet(name) { return `Hello ${name}` }
def greet(name):
    return f"Hello {name}"

print(greet("Arjun"))  # Hello Arjun


# ── 2. Type Hints (production mein hamesha use karo) ──────────
# JS:  function add(a: number, b: number): number
def add(a: int, b: int) -> int:
    return a + b

print(add(3, 5))  # 8


# ── 3. Default Arguments ──────────────────────────────────────
# JS:  function createUser(name, role = "user")
def create_user(name: str, role: str = "user") -> dict:
    return {"name": name, "role": role}

print(create_user("Arjun"))           # {'name': 'Arjun', 'role': 'user'}
print(create_user("Priya", "admin"))  # {'name': 'Priya', 'role': 'admin'}


# ── 4. *args — Variable Positional Arguments ──────────────────
# JS:  function sumAll(...numbers)
def sum_all(*numbers: int) -> int:
    return sum(numbers)

print(sum_all(1, 2, 3, 4, 5))  # 15


# ── 5. **kwargs — Variable Keyword Arguments ──────────────────
# JS:  function buildQuery({ page, limit, sort } = {})
def build_query(**kwargs) -> dict:
    return {
        "page":  kwargs.get("page", 1),
        "limit": kwargs.get("limit", 10),
        "sort":  kwargs.get("sort", "asc"),
    }

print(build_query(page=2, limit=20))  # {'page': 2, 'limit': 20, 'sort': 'asc'}


# ── 6. Lambda (Arrow Function) ────────────────────────────────
# JS:  const double = x => x * 2
double = lambda x: x * 2
square = lambda x: x ** 2

print(double(5))  # 10
print(square(4))  # 16


# ── 7. First-Class Functions ──────────────────────────────────
# JS:  function apply(fn, val) { return fn(val) }
def apply(func, value):
    return func(value)

print(apply(double, 7))   # 14
print(apply(square, 3))   # 9


# ── 8. Returning Multiple Values ─────────────────────────────
# JS mein ye nahi hota directly — Python ka superpower
def get_min_max(numbers: list[int]) -> tuple[int, int]:
    return min(numbers), max(numbers)

low, high = get_min_max([3, 1, 9, 2, 7])
print(f"Min: {low}, Max: {high}")  # Min: 1, Max: 9


# ── 9. Nested Functions (Closure) ────────────────────────────
# JS:  function multiplier(factor) { return x => x * factor }
def multiplier(factor: int):
    def multiply(x: int) -> int:
        return x * factor
    return multiply

triple = multiplier(3)
print(triple(5))   # 15
print(triple(10))  # 30
