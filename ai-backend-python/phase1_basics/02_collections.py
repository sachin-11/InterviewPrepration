# ─────────────────────────────────────────────────────────────
# 02_collections.py — List, Dict, Set + Comprehensions
# ─────────────────────────────────────────────────────────────

# ── Sample Data ───────────────────────────────────────────────
users = [
    {"id": 1, "name": "Arjun",  "role": "admin",  "score": 85, "active": True},
    {"id": 2, "name": "Priya",  "role": "user",   "score": 92, "active": False},
    {"id": 3, "name": "Ravi",   "role": "user",   "score": 78, "active": True},
    {"id": 4, "name": "Sneha",  "role": "admin",  "score": 95, "active": True},
    {"id": 5, "name": "Karan",  "role": "user",   "score": 60, "active": False},
]


# ── 1. List Comprehension ─────────────────────────────────────
# JS:  users.map(u => u.name)
names = [u["name"] for u in users]
print("Names:", names)


# ── 2. Filter with Comprehension ─────────────────────────────
# JS:  users.filter(u => u.active)
active_users = [u for u in users if u["active"]]
print("Active:", [u["name"] for u in active_users])


# ── 3. Map + Filter Combined ──────────────────────────────────
# JS:  users.filter(u => u.active).map(u => u.name)
active_names = [u["name"] for u in users if u["active"]]
print("Active names:", active_names)


# ── 4. Dict Comprehension ─────────────────────────────────────
# JS:  Object.fromEntries(users.map(u => [u.name, u.score]))
score_map = {u["name"]: u["score"] for u in users}
print("Score map:", score_map)


# ── 5. Nested Dict Access (Safe) ─────────────────────────────
# JS:  user?.address?.city ?? "unknown"
profile = {"user": {"address": {"city": "Mumbai"}}}
city = profile.get("user", {}).get("address", {}).get("city", "unknown")
print("City:", city)


# ── 6. Merging Dicts ─────────────────────────────────────────
# JS:  { ...defaults, ...overrides }
defaults  = {"role": "user", "active": True, "score": 0}
overrides = {"role": "admin", "name": "Arjun"}
merged = {**defaults, **overrides}
print("Merged:", merged)


# ── 7. Sorting ────────────────────────────────────────────────
# JS:  users.sort((a, b) => b.score - a.score)
sorted_users = sorted(users, key=lambda u: u["score"], reverse=True)
print("Top scorer:", sorted_users[0]["name"])


# ── 8. Set — Unique Values ────────────────────────────────────
# JS:  [...new Set(users.map(u => u.role))]
roles = {u["role"] for u in users}
print("Unique roles:", roles)  # {'admin', 'user'}


# ── 9. List Operations ────────────────────────────────────────
nums = [3, 1, 4, 1, 5, 9, 2, 6]

print("Sum:",    sum(nums))
print("Max:",    max(nums))
print("Min:",    min(nums))
print("Sorted:", sorted(nums))
print("Unique:", list(set(nums)))


# ── 10. Enumerate (index + value) ────────────────────────────
# JS:  users.forEach((u, i) => ...)
for i, user in enumerate(users):
    print(f"  [{i}] {user['name']}")


# ── 11. Zip (combine two lists) ───────────────────────────────
# JS:  names.map((name, i) => ({ name, score: scores[i] }))
names_list  = ["Arjun", "Priya", "Ravi"]
scores_list = [85, 92, 78]

combined = [{"name": n, "score": s} for n, s in zip(names_list, scores_list)]
print("Combined:", combined)


# ── 12. any() / all() ─────────────────────────────────────────
# JS:  users.some(u => u.active)   → any()
# JS:  users.every(u => u.active)  → all()
print("Any active?", any(u["active"] for u in users))
print("All active?", all(u["active"] for u in users))
