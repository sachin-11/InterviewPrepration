# Day 4 — Async Patterns

JavaScript async ka evolution: Callbacks → Promises → async/await
Teeno patterns samajhna zaroori hai — interviews mein sab pooche jaate hain.

---

## 1. Evolution of Async Patterns

```
2009: Node.js launch → Callbacks
2015: ES6 → Promises
2017: ES8 → async/await

Har pattern pichle ki problems solve karta hai.
Production code mein teeno milte hain — samajhna zaroori hai.
```

---

## 2. Callbacks

### Basic Callback:
```javascript
// Convention: callback(error, result)
// Error-first callback pattern (Node.js standard)

function readFile(path, callback) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) return callback(err);
    callback(null, data);
  });
}

// Usage
readFile('file.txt', (err, data) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  console.log('Data:', data);
});
```

### Callback Hell (Pyramid of Doom):
```javascript
// Real-world scenario: User login flow
// 1. Find user
// 2. Verify password
// 3. Get user profile
// 4. Get user permissions
// 5. Log the login

getUser(userId, (err, user) => {
  if (err) return handleError(err);

  verifyPassword(user, password, (err, isValid) => {
    if (err) return handleError(err);

    if (!isValid) return handleError(new Error('Invalid password'));

    getUserProfile(user.id, (err, profile) => {
      if (err) return handleError(err);

      getPermissions(user.id, (err, permissions) => {
        if (err) return handleError(err);

        logLogin(user.id, (err) => {
          if (err) return handleError(err);

          // Finally done! But look at this indentation...
          res.json({ user, profile, permissions });
        });
      });
    });
  });
});

// Problems:
// 1. Deep nesting (pyramid shape)
// 2. Error handling repetitive
// 3. Hard to read
// 4. Hard to debug
// 5. Hard to test
```

### Callback Hell Fix (Named Functions):
```javascript
// Flatten with named functions
function onLogin(err, user) {
  if (err) return handleError(err);
  verifyPassword(user, password, onVerify.bind(null, user));
}

function onVerify(user, err, isValid) {
  if (err) return handleError(err);
  if (!isValid) return handleError(new Error('Invalid'));
  getUserProfile(user.id, onProfile.bind(null, user));
}

// Still messy — Promises are better
```

---

## 3. Promises

### Promise Basics:
```javascript
// Promise = "I promise to give you a value later"
// States: pending → fulfilled OR rejected

const promise = new Promise((resolve, reject) => {
  // Async operation
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve("Data loaded!");    // fulfilled
    } else {
      reject(new Error("Failed")); // rejected
    }
  }, 1000);
});

// Consume
promise
  .then(data => console.log(data))   // fulfilled
  .catch(err => console.error(err)); // rejected
```

### Promise Chaining:
```javascript
// Same login flow with Promises — much cleaner!
getUser(userId)
  .then(user => verifyPassword(user, password))
  .then(user => getUserProfile(user.id))
  .then(profile => getPermissions(profile.userId))
  .then(permissions => logLogin(permissions.userId))
  .then(result => res.json(result))
  .catch(err => handleError(err)); // ONE catch for all errors!

// Benefits:
// 1. Flat structure (no pyramid)
// 2. Single error handler
// 3. Easy to read
// 4. Chainable
```

### Promise Error Handling:
```javascript
// .catch() catches any error in the chain
fetchUser(id)
  .then(user => {
    if (!user) throw new Error('User not found'); // Throw in .then
    return fetchProfile(user.id);
  })
  .then(profile => processProfile(profile))
  .catch(err => {
    // Catches: fetchUser error, throw, fetchProfile error, processProfile error
    console.error('Something went wrong:', err.message);
  })
  .finally(() => {
    // Always runs (cleanup)
    db.close();
  });
```

### Creating Promisified Functions:
```javascript
// Callback-based function ko Promise mein convert karo
const fs = require('fs');

// Manual promisify
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Node.js built-in promisify
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// Or use fs.promises directly
const { readFile } = require('fs').promises;

// Usage
readFile('file.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

## 4. async/await

### Basic async/await:
```javascript
// async/await = Syntactic sugar over Promises
// Makes async code look synchronous

async function loginUser(userId, password) {
  const user        = await getUser(userId);
  const isValid     = await verifyPassword(user, password);

  if (!isValid) throw new Error('Invalid password');

  const profile     = await getUserProfile(user.id);
  const permissions = await getPermissions(user.id);
  await logLogin(user.id);

  return { user, profile, permissions };
}

// Usage
loginUser(123, 'pass123')
  .then(result => res.json(result))
  .catch(err => handleError(err));

// Or with await:
try {
  const result = await loginUser(123, 'pass123');
  res.json(result);
} catch (err) {
  handleError(err);
}
```

### Error Handling with try/catch:
```javascript
async function fetchData(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (err) {
    // Network error, HTTP error, JSON parse error — sab catch hoga
    console.error('fetchData failed:', err.message);
    throw err; // Re-throw if caller should handle
  }
}
```

### Common async/await Mistakes:
```javascript
// MISTAKE 1: Forgetting await
async function bad() {
  const data = fetchData(); // Missing await!
  console.log(data);        // Promise object, not data!
}

// MISTAKE 2: Sequential when parallel possible
async function slow() {
  const user    = await getUser(id);     // 100ms
  const profile = await getProfile(id); // 100ms
  // Total: 200ms — but these are independent!
}

// BETTER: Parallel
async function fast() {
  const [user, profile] = await Promise.all([
    getUser(id),     // Both start simultaneously
    getProfile(id)   // 100ms total!
  ]);
}

// MISTAKE 3: await in loop (sequential)
async function slowLoop(ids) {
  const results = [];
  for (const id of ids) {
    results.push(await fetchUser(id)); // One by one!
  }
  return results;
}

// BETTER: Parallel
async function fastLoop(ids) {
  return Promise.all(ids.map(id => fetchUser(id))); // All at once!
}
```

---

## 5. Promise.all — Parallel Execution

```javascript
// Sab promises ek saath start karo
// Sab complete hone pe result milta hai
// Ek bhi fail → Sab fail (fast fail)

const [user, posts, comments] = await Promise.all([
  fetchUser(userId),      // 100ms
  fetchPosts(userId),     // 150ms
  fetchComments(userId)   // 80ms
]);
// Total: 150ms (slowest one) instead of 330ms (sequential)

// Error handling
try {
  const results = await Promise.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3)
  ]);
} catch (err) {
  // Ek bhi fail → catch mein aa jaata hai
  // Other promises still running but results ignored
  console.error('One failed:', err.message);
}
```

---

## 6. Promise.race — First One Wins

```javascript
// Jo pehle resolve/reject kare, wahi result
// Timeout implement karne ke liye useful!

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Usage
try {
  const data = await withTimeout(fetchData(url), 5000);
  console.log(data);
} catch (err) {
  if (err.message.includes('Timeout')) {
    console.error('Request timed out!');
  }
}

// Another use: Fastest server
const data = await Promise.race([
  fetchFromServer1(query),
  fetchFromServer2(query),
  fetchFromServer3(query)
]);
// Jo pehle respond kare, wahi use karo
```

---

## 7. Promise.allSettled — All Results (No Fast Fail)

```javascript
// Sab promises wait karo — success ya failure dono
// Ek fail hone pe bhi baaki ka wait karo

const results = await Promise.allSettled([
  fetchUser(1),    // Success
  fetchUser(999),  // Fails (not found)
  fetchUser(2),    // Success
]);

results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    console.log(`User ${i}: ${result.value.name}`);
  } else {
    console.log(`User ${i} failed: ${result.reason.message}`);
  }
});

// Output:
// User 0: John
// User 1 failed: User not found
// User 2: Jane

// Use case: Batch operations where partial success is okay
// Send 100 emails — some may fail, log failures, continue
```

---

## 8. Promise.any — First Success

```javascript
// Jo pehle SUCCESSFULLY resolve kare
// Sab fail hone pe AggregateError

// Use case: Multiple fallback sources
const data = await Promise.any([
  fetchFromPrimaryDB(query),
  fetchFromReplicaDB(query),
  fetchFromCache(query)
]);
// Jo pehle succeed kare, wahi use karo

try {
  const result = await Promise.any([
    failingOperation1(),
    failingOperation2(),
    successfulOperation()
  ]);
  console.log(result); // successfulOperation ka result
} catch (err) {
  // AggregateError: All promises were rejected
  console.error(err.errors); // Array of all errors
}
```

---

## 9. Comparison Table

```
Method              Behavior                    Use Case
──────────────────  ──────────────────────────  ──────────────────────────
Promise.all         All succeed or fast fail    Independent parallel tasks
Promise.race        First to settle (any)       Timeout, fastest server
Promise.allSettled  Wait for all, no fail       Batch ops, partial success
Promise.any         First to succeed            Fallback sources
```

---

## 10. Error Handling Patterns

### Pattern 1: Centralized Error Handler
```javascript
async function apiHandler(req, res) {
  try {
    const result = await processRequest(req);
    res.json(result);
  } catch (err) {
    // Centralized handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.name === 'NotFoundError') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Pattern 2: Result Tuple (Go-style)
```javascript
// Avoid try/catch everywhere
async function safeAsync(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

// Usage — clean!
const [err, user] = await safeAsync(fetchUser(id));
if (err) return res.status(404).json({ error: err.message });

const [err2, profile] = await safeAsync(fetchProfile(user.id));
if (err2) return res.status(500).json({ error: err2.message });
```

### Pattern 3: Express Async Wrapper
```javascript
// Express async errors automatically handle karo
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get('/user/:id', asyncHandler(async (req, res) => {
  const user = await fetchUser(req.params.id); // Error auto-caught!
  res.json(user);
}));

// Error middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

---

## 11. Quick Summary

```
Callbacks:
  + Simple, no dependencies
  - Callback hell, repetitive error handling

Promises:
  + Flat chaining, single .catch()
  + Composable (Promise.all, race, etc.)
  - Verbose for simple cases

async/await:
  + Reads like synchronous code
  + try/catch for errors
  + Best for complex flows
  - Need to remember await!

Promise combinators:
  Promise.all        → All parallel, fast fail
  Promise.race       → First to settle
  Promise.allSettled → All results, no fail
  Promise.any        → First success
```

---

## 12. Practice Tasks (Aaj Karo)

### Task 1: Callback to Promise
```javascript
// Ye callback-based function ko Promise mein convert karo:
function getUserCallback(id, callback) {
  setTimeout(() => {
    if (id > 0) callback(null, { id, name: "User " + id });
    else callback(new Error("Invalid ID"));
  }, 100);
}

// Convert to:
function getUserPromise(id) {
  // Your code here
}

// Test:
getUserPromise(1).then(console.log).catch(console.error);
getUserPromise(-1).then(console.log).catch(console.error);
```

### Task 2: Sequential vs Parallel
```javascript
// Measure time difference:
const delay = ms => new Promise(r => setTimeout(r, ms));

// Sequential (slow)
async function sequential() {
  const start = Date.now();
  await delay(100);
  await delay(100);
  await delay(100);
  console.log("Sequential:", Date.now() - start, "ms"); // ~300ms
}

// Parallel (fast)
async function parallel() {
  const start = Date.now();
  await Promise.all([delay(100), delay(100), delay(100)]);
  console.log("Parallel:", Date.now() - start, "ms"); // ~100ms
}

await sequential();
await parallel();
```

### Task 3: Promise.allSettled Use
```javascript
// 5 users fetch karo — kuch exist karte hain, kuch nahi
// Successful results print karo, failures log karo

const userIds = [1, 2, 999, 4, 888];

const results = await Promise.allSettled(
  userIds.map(id => fetchUser(id))
);

// Process results:
const successful = results.filter(r => r.status === 'fulfilled');
const failed     = results.filter(r => r.status === 'rejected');

console.log(`Success: ${successful.length}, Failed: ${failed.length}`);
```

### Task 4: Timeout Wrapper
```javascript
// withTimeout function implement karo:
function withTimeout(promise, ms) {
  // Your code here using Promise.race
}

// Test:
const slowOperation = new Promise(r => setTimeout(r, 5000, "done"));

try {
  const result = await withTimeout(slowOperation, 1000);
  console.log(result);
} catch (err) {
  console.log(err.message); // "Timeout after 1000ms"
}
```

---

Kal Day 5 mein Worker Threads dekhenge —
CPU-intensive tasks ko event loop block kiye bina handle karna.
