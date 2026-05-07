# ─────────────────────────────────────────────────────────────
# 02_strings.py — String Operations
# ─────────────────────────────────────────────────────────────

name  = "Arjun"
city  = "Mumbai"
email = "  Arjun@Gmail.Com  "

# ── 1. f-string (= template literal in JS) ───────────────────
# JS:  `Hello ${name}, from ${city}`
msg = f"Hello {name}, from {city}"
print(msg)

# Expression inside f-string
print(f"2 + 2 = {2 + 2}")
print(f"Name upper: {name.upper()}")

# ── 2. Common String Methods ──────────────────────────────────
print(email.strip())          # remove spaces → "Arjun@Gmail.Com"
print(email.strip().lower())  # → "arjun@gmail.com"
print(name.upper())           # → "ARJUN"
print(name.lower())           # → "arjun"
print(name.replace("A", "a")) # → "arjun"

# ── 3. Split & Join ───────────────────────────────────────────
# JS:  "a,b,c".split(",")   →  ["a","b","c"]
# JS:  ["a","b","c"].join(",")
csv_line = "Arjun,25,Mumbai,admin"
parts = csv_line.split(",")
print(parts)                  # ['Arjun', '25', 'Mumbai', 'admin']

joined = " | ".join(parts)
print(joined)                 # Arjun | 25 | Mumbai | admin

# ── 4. Check Contains ─────────────────────────────────────────
# JS:  str.includes("text")
sentence = "Python is great for AI"
print("AI" in sentence)       # True
print("Java" in sentence)     # False

# ── 5. Starts / Ends With ─────────────────────────────────────
url = "https://api.example.com"
print(url.startswith("https"))  # True
print(url.endswith(".com"))     # True

# ── 6. String Slicing ─────────────────────────────────────────
# JS:  str.slice(start, end)
text = "Hello World"
print(text[0:5])    # Hello     (index 0 to 4)
print(text[6:])     # World     (index 6 to end)
print(text[:5])     # Hello     (start to index 4)
print(text[-5:])    # World     (last 5 chars)
print(text[::-1])   # dlroW olleH  (reverse)

# ── 7. Length ─────────────────────────────────────────────────
print(len("Hello"))   # 5

# ── 8. Strip specific chars ───────────────────────────────────
path = "/api/users/"
print(path.strip("/"))   # api/users

# ── 9. Multi-line String ──────────────────────────────────────
prompt = """
You are a helpful assistant.
Answer in short and clear sentences.
"""
print(prompt.strip())

# ── 10. String Formatting (old style — you'll see in codebases) ──
print("Hello %s, age %d" % ("Arjun", 25))   # old style
print("Hello {}, age {}".format("Arjun", 25)) # .format style
print(f"Hello {'Arjun'}, age {25}")           # f-string (use this)
