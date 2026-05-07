# ─────────────────────────────────────────────────────────────
# 09_modules.py — Imports & Modules
# ─────────────────────────────────────────────────────────────

# ── 1. Import standard library ────────────────────────────────
import os           # OS operations
import sys          # system info
import json         # JSON parse/stringify
import math         # math functions
import random       # random numbers
from datetime import datetime, timedelta   # specific import

# ── 2. os — file system & env vars ───────────────────────────
# JS:  process.env.PORT
port = os.getenv("PORT", "8000")
print(f"Port: {port}")

# Current directory
print(os.getcwd())

# Check if file exists
print(os.path.exists("requirements.txt"))

# Join paths (= path.join in Node)
full_path = os.path.join("data", "users.json")
print(full_path)   # data/users.json  (or data\users.json on Windows)

# ── 3. pathlib — modern path handling (prefer this) ──────────
from pathlib import Path

base = Path(__file__).parent   # current file's folder
data_dir = base.parent / "data"

print(data_dir)
print(data_dir.exists())

# ── 4. json ───────────────────────────────────────────────────
# JS:  JSON.stringify / JSON.parse
data = {"name": "Arjun", "scores": [85, 92, 78]}

json_str = json.dumps(data, indent=2)   # dict → string
print(json_str)

parsed = json.loads(json_str)           # string → dict
print(parsed["name"])

# ── 5. math ───────────────────────────────────────────────────
print(math.sqrt(16))    # 4.0
print(math.ceil(4.2))   # 5
print(math.floor(4.9))  # 4
print(math.pi)          # 3.14159...
print(math.pow(2, 10))  # 1024.0

# ── 6. random ─────────────────────────────────────────────────
print(random.randint(1, 100))           # random int 1-100
print(random.choice(["a", "b", "c"]))  # random item
print(random.random())                  # float 0.0 to 1.0

items = [1, 2, 3, 4, 5]
random.shuffle(items)
print(items)

# ── 7. datetime ───────────────────────────────────────────────
now = datetime.now()
print(now)                              # 2024-01-15 10:30:00.123456
print(now.strftime("%Y-%m-%d"))         # 2024-01-15
print(now.strftime("%d/%m/%Y %H:%M"))   # 15/01/2024 10:30

# Add/subtract time
tomorrow = now + timedelta(days=1)
last_week = now - timedelta(weeks=1)
print(tomorrow.date())
print(last_week.date())

# ── 8. sys ────────────────────────────────────────────────────
print(sys.version)          # Python version
print(sys.platform)         # win32 / linux / darwin

# ── 9. __name__ == "__main__" ─────────────────────────────────
# JS:  if (require.main === module)
# This block runs ONLY when file is run directly
# NOT when imported by another file

if __name__ == "__main__":
    print("Running directly")
    print(f"Python {sys.version_info.major}.{sys.version_info.minor}")
