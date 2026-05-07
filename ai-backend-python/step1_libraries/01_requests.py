# ─────────────────────────────────────────────────────────────
# 01_requests.py — HTTP Calls (= Axios in Node.js)
# ─────────────────────────────────────────────────────────────
import requests

# ── 1. GET Request ────────────────────────────────────────────
# JS:  axios.get("https://...")
# JS:  fetch("https://...")

response = requests.get("https://jsonplaceholder.typicode.com/users/1")

print(response.status_code)        # 200
print(response.headers["Content-Type"])  # application/json
print(response.json())             # dict — same as res.json() in JS

# ── 2. Access Response Data ───────────────────────────────────
data = response.json()
print(data["name"])                # Leanne Graham
print(data["email"])               # Sincere@april.biz
print(data["address"]["city"])     # Gwenborough

# ── 3. GET with Query Params ──────────────────────────────────
# JS:  axios.get("/posts", { params: { userId: 1 } })
response = requests.get(
    "https://jsonplaceholder.typicode.com/posts",
    params={"userId": 1}           # ?userId=1 auto append hoga
)
posts = response.json()
print(f"Total posts: {len(posts)}")
print(f"First post: {posts[0]['title']}")

# ── 4. POST Request ───────────────────────────────────────────
# JS:  axios.post("/posts", { title: "...", body: "..." })
response = requests.post(
    "https://jsonplaceholder.typicode.com/posts",
    json={                         # json= automatically sets Content-Type
        "title": "My AI Post",
        "body": "Learning Python for AI",
        "userId": 1
    }
)
print(response.status_code)        # 201
print(response.json())             # created post with id

# ── 5. Headers (Auth token, etc.) ────────────────────────────
# JS:  axios.get("/data", { headers: { Authorization: "Bearer ..." } })
response = requests.get(
    "https://jsonplaceholder.typicode.com/posts/1",
    headers={
        "Authorization": "Bearer my-token-123",
        "Accept": "application/json"
    }
)
print(response.status_code)

# ── 6. Error Handling ─────────────────────────────────────────
# JS:  try { await axios.get(...) } catch(e) { ... }
try:
    response = requests.get(
        "https://jsonplaceholder.typicode.com/users/999",
        timeout=5                  # 5 second timeout
    )
    response.raise_for_status()    # 4xx/5xx pe exception throw karta hai
    print(response.json())

except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
except requests.exceptions.Timeout:
    print("Request timed out")
except requests.exceptions.ConnectionError:
    print("Connection failed")

# ── 7. Session (Reuse connection — production mein use karo) ──
# JS:  axios.create({ baseURL: "...", headers: {...} })
session = requests.Session()
session.headers.update({
    "Authorization": "Bearer my-token",
    "Content-Type": "application/json"
})

r1 = session.get("https://jsonplaceholder.typicode.com/posts/1")
r2 = session.get("https://jsonplaceholder.typicode.com/posts/2")
print(r1.json()["title"])
print(r2.json()["title"])
session.close()
