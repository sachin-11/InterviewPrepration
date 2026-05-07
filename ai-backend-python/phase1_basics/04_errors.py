# ─────────────────────────────────────────────────────────────
# 04_errors.py — Error Handling + Custom Exceptions
# ─────────────────────────────────────────────────────────────


# ── 1. Custom Exception Classes ───────────────────────────────
# Production mein hamesha custom errors banao — generic Exception mat use karo

class AppError(Exception):
    """Base error — sab custom errors isse inherit karenge"""
    def __init__(self, message: str, code: int = 500):
        self.message = message
        self.code = code
        super().__init__(message)

class NotFoundError(AppError):
    def __init__(self, resource: str):
        super().__init__(f"{resource} not found", code=404)

class ValidationError(AppError):
    def __init__(self, field: str, reason: str):
        super().__init__(f"'{field}' validation failed: {reason}", code=400)

class UnauthorizedError(AppError):
    def __init__(self):
        super().__init__("Unauthorized access", code=401)


# ── 2. Basic try/except/finally ───────────────────────────────
# JS:  try { } catch(e) { } finally { }
def divide(a: float, b: float) -> float:
    try:
        result = a / b
        return result
    except ZeroDivisionError:
        print("❌ Cannot divide by zero")
        return 0.0
    except TypeError as e:
        print(f"❌ Wrong type: {e}")
        return 0.0
    finally:
        print("✅ divide() completed")  # hamesha chalta hai

print(divide(10, 2))   # 5.0
print(divide(10, 0))   # 0.0


# ── 3. Raising Custom Errors ──────────────────────────────────
users_db = [
    {"id": 1, "name": "Arjun",  "role": "admin"},
    {"id": 2, "name": "Priya",  "role": "user"},
]

def get_user(user_id: int) -> dict:
    user = next((u for u in users_db if u["id"] == user_id), None)
    if not user:
        raise NotFoundError(f"User:{user_id}")
    return user

def create_user(name: str, role: str) -> dict:
    if not name or len(name) < 2:
        raise ValidationError("name", "must be at least 2 characters")
    if role not in ("admin", "user", "moderator"):
        raise ValidationError("role", f"'{role}' is not a valid role")
    return {"id": len(users_db) + 1, "name": name, "role": role}


# ── 4. Catching Custom Errors ─────────────────────────────────
def handle_request(user_id: int):
    try:
        user = get_user(user_id)
        print(f"✅ Found: {user}")
    except NotFoundError as e:
        print(f"[{e.code}] {e.message}")
    except AppError as e:
        print(f"[{e.code}] App error: {e.message}")
    except Exception as e:
        print(f"[500] Unexpected: {e}")

handle_request(1)   # ✅ Found
handle_request(99)  # [404] User:99 not found


# ── 5. Validation Example ─────────────────────────────────────
def safe_create(name: str, role: str):
    try:
        user = create_user(name, role)
        print(f"✅ Created: {user}")
    except ValidationError as e:
        print(f"[{e.code}] {e.message}")

safe_create("Arjun", "admin")    # ✅
safe_create("A", "admin")        # ❌ name too short
safe_create("Ravi", "superuser") # ❌ invalid role
