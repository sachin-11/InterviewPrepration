# ─────────────────────────────────────────────────────────────
# 07_dicts.py — Dictionaries (= Objects in JS)
# ─────────────────────────────────────────────────────────────

# ── 1. Create ─────────────────────────────────────────────────
user = {
    "id": 1,
    "name": "Arjun",
    "age": 25,
    "role": "admin",
    "active": True,
}

# ── 2. Access ─────────────────────────────────────────────────
print(user["name"])             # Arjun
print(user.get("name"))         # Arjun
print(user.get("email"))        # None  (no KeyError)
print(user.get("email", "N/A")) # N/A   (default value)

# user["email"]  ← KeyError crash karta hai if key missing
# user.get("email", "N/A")  ← safe (use this always)

# ── 3. Add / Update ───────────────────────────────────────────
user["email"] = "arjun@example.com"   # add new key
user["age"] = 26                       # update existing
print(user)

# ── 4. Delete ─────────────────────────────────────────────────
del user["active"]                     # delete key
removed = user.pop("age", None)        # delete + return value (safe)
print(removed)   # 26
print(user)

# ── 5. Check Key Exists ───────────────────────────────────────
# JS:  "name" in user  or  user.hasOwnProperty("name")
print("name" in user)     # True
print("phone" in user)    # False

# ── 6. Loop Over Dict ─────────────────────────────────────────
for key in user:
    print(key)

for val in user.values():
    print(val)

for key, val in user.items():   # most common
    print(f"{key}: {val}")

# ── 7. Merge Dicts ────────────────────────────────────────────
# JS:  { ...defaults, ...overrides }
defaults  = {"role": "user", "active": True, "theme": "light"}
overrides = {"role": "admin", "name": "Arjun"}

merged = {**defaults, **overrides}
print(merged)
# {'role': 'admin', 'active': True, 'theme': 'light', 'name': 'Arjun'}

# Python 3.9+ — cleaner syntax
merged2 = defaults | overrides
print(merged2)

# ── 8. Dict Comprehension ─────────────────────────────────────
# JS:  Object.fromEntries(users.map(u => [u.name, u.score]))
users = [
    {"name": "Arjun", "score": 85},
    {"name": "Priya", "score": 92},
    {"name": "Ravi",  "score": 78},
]

score_map = {u["name"]: u["score"] for u in users}
print(score_map)   # {'Arjun': 85, 'Priya': 92, 'Ravi': 78}

# ── 9. Nested Dict ────────────────────────────────────────────
config = {
    "database": {
        "host": "localhost",
        "port": 5432,
        "credentials": {
            "user": "admin",
            "password": "secret"
        }
    }
}

# Safe nested access
db_host = config.get("database", {}).get("host", "unknown")
db_user = config.get("database", {}).get("credentials", {}).get("user")
print(db_host)   # localhost
print(db_user)   # admin

# ── 10. dict() constructor ────────────────────────────────────
person = dict(name="Arjun", age=25, city="Mumbai")
print(person)

# ── 11. Keys / Values / Items ─────────────────────────────────
d = {"a": 1, "b": 2, "c": 3}
print(list(d.keys()))    # ['a', 'b', 'c']
print(list(d.values()))  # [1, 2, 3]
print(list(d.items()))   # [('a', 1), ('b', 2), ('c', 3)]

# ── 12. setdefault ────────────────────────────────────────────
# Set value only if key doesn't exist
cache = {}
cache.setdefault("user:1", {"name": "Arjun"})
cache.setdefault("user:1", {"name": "Changed"})  # won't change
print(cache)   # {'user:1': {'name': 'Arjun'}}
