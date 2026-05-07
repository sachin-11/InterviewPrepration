# ─────────────────────────────────────────────────────────────
# 03_file_io.py — File Handling (JSON + Text)
# ─────────────────────────────────────────────────────────────

import json
from pathlib import Path

# Path(__file__) = current file ka path
# .parent        = current folder
# .parent.parent = project root
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"


# ── 1. Write JSON ─────────────────────────────────────────────
def write_json(filename: str, data: dict | list) -> None:
    path = DATA_DIR / filename
    path.parent.mkdir(parents=True, exist_ok=True)  # mkdir -p
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✅ Written: {path}")


# ── 2. Read JSON ──────────────────────────────────────────────
def read_json(filename: str) -> dict | list:
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ── 3. Append to Log File ─────────────────────────────────────
def append_log(filename: str, message: str) -> None:
    path = DATA_DIR / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(message + "\n")


# ── 4. Read Text Lines ────────────────────────────────────────
def read_lines(filename: str) -> list[str]:
    path = DATA_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        # strip whitespace + skip empty lines
        return [line.strip() for line in f if line.strip()]


# ── 5. Check File Exists ──────────────────────────────────────
def file_exists(filename: str) -> bool:
    return (DATA_DIR / filename).exists()


# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":

    # Write
    users = [
        {"id": 1, "name": "Arjun", "role": "admin"},
        {"id": 2, "name": "Priya", "role": "user"},
    ]
    write_json("users.json", users)

    # Read back
    loaded = read_json("users.json")
    print("Loaded:", loaded)

    # Append logs
    append_log("app.log", "[INFO] Server started")
    append_log("app.log", "[INFO] User Arjun logged in")

    # Read log lines
    if file_exists("app.log"):
        lines = read_lines("app.log")
        print("Logs:")
        for line in lines:
            print(f"  {line}")
