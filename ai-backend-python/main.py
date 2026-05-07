# ─────────────────────────────────────────────────────────────
# main.py — Phase 1 Runner
# Run: python main.py
# ─────────────────────────────────────────────────────────────

import runpy

def run(filepath: str):
    print("\n" + "=" * 50)
    print(f"  Running: {filepath}")
    print("=" * 50)
    runpy.run_path(filepath, run_name="__main__")

run("phase1_basics/01_functions.py")
run("phase1_basics/02_collections.py")
run("phase1_basics/03_file_io.py")
run("phase1_basics/04_errors.py")

def functions(num1, num2) :
  print(num1 + num2)

functions(10, 20)