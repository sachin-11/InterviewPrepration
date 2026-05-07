import runpy

files = [
    "python_basics/01_variables.py",
    "python_basics/02_strings.py",
    "python_basics/03_conditions.py",
    "python_basics/04_loops.py",
    "python_basics/05_functions.py",
    "python_basics/06_lists.py",
    "python_basics/07_dicts.py",
    "python_basics/08_classes.py",
    "python_basics/09_modules.py",
]

for f in files:
    print(f"\n{'='*55}")
    print(f"  {f}")
    print('='*55)
    runpy.run_path(f, run_name="__main__")
