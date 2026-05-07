# Day 6 — EventEmitter

Node.js ka Observer Pattern — events emit karo, listeners sun'te hain.
HTTP server, streams, sab EventEmitter pe based hain.

---

## 1. EventEmitter Kya Hai?

```
Observer Pattern = Publisher-Subscriber pattern

Publisher (EventEmitter): Events emit karta hai
Subscriber (Listener):    Events sun'ta hai aur react karta hai

Real-world analogy:
  YouTube channel = EventEmitter
  Subscribers     = Listeners
  New video upload = Event emit
  Notification     = Listener execute
```

### Node.js mein built-in use:
```javascript
// HTTP server EventEmitter use karta hai
const server = http.createServer();
server.on('request', (req, res) => { ... });  // Listener
server.on('error',   (err) => { ... });        // Listener

// Streams bhi EventEmitter hain
const stream = fs.createReadStream('file.txt');
stream.on('data',  (chunk) => { ... });
stream.on('end',   () => { ... });
stream.on('error', (err) => { ... });
```

---

## 2. Basic EventEmitter

```javascript
import { EventEmitter } from 'events';

const emitter = new EventEmitter();

// Listener register karo
emitter.on('greet', (name) => {
  console.log(`Hello, ${name}!`);
});

// Event emit karo
emitter.emit('greet', 'Rahul');  // Hello, Rahul!
emitter.emit('greet', 'Priya'); // Hello, Priya!
```

---

## 3. EventEmitter Methods

```javascript
const emitter = new EventEmitter();

// on() — Listener add karo (multiple times fire hoga)
emitter.on('data', (val) => console.log('on:', val));

// once() — Sirf ek baar fire hoga
emitter.once('connect', () => console.log('Connected!'));

// emit() — Event trigger karo
emitter.emit('data', 42);    // on: 42
emitter.emit('data', 100);   // on: 100
emitter.emit('connect');     // Connected!
emitter.emit('connect');     // Nothing (once already fired)

// removeListener() — Specific listener remove karo
function handler(val) { console.log('handler:', val); }
emitter.on('event', handler);
emitter.emit('event', 1);           // handler: 1
emitter.removeListener('event', handler);
emitter.emit('event', 2);           // Nothing

// off() — removeListener ka alias
emitter.off('event', handler);

// removeAllListeners() — Sab listeners remove karo
emitter.removeAllListeners('data');
emitter.removeAllListeners(); // Sab events ke sab listeners

// listenerCount() — Kitne listeners hain?
emitter.on('test', () => {});
emitter.on('test', () => {});
console.log(emitter.listenerCount('test')); // 2

// eventNames() — Kaunse events registered hain?
console.log(emitter.eventNames()); // ['test']
```

---

## 4. Custom EventEmitter Class

```javascript
import { EventEmitter } from 'events';

class Database extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.data      = new Map();
  }

  connect(url) {
    // Simulate async connection
    setTimeout(() => {
      this.connected = true;
      this.emit('connect', { url, timestamp: new Date() });
    }, 100);
  }

  set(key, value) {
    if (!this.connected) {
      this.emit('error', new Error('Not connected'));
      return;
    }
    this.data.set(key, value);
    this.emit('write', { key, value });
  }

  get(key) {
    const value = this.data.get(key);
    this.emit('read', { key, value, found: value !== undefined });
    return value;
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect');
  }
}

// Usage
const db = new Database();

db.on('connect',    (info) => console.log('Connected to:', info.url));
db.on('write',      (info) => console.log('Written:', info.key, '=', info.value));
db.on('read',       (info) => console.log('Read:', info.key, '→', info.value));
db.on('disconnect', ()     => console.log('Disconnected'));
db.on('error',      (err)  => console.error('Error:', err.message));

db.connect('mongodb://localhost:27017');

setTimeout(() => {
  db.set('name', 'Rahul');
  db.set('age', 25);
  db.get('name');
  db.disconnect();
}, 200);
```

---

## 5. Error Events — Special Case

```javascript
// 'error' event special hai — agar listener nahi hai toh crash!
const emitter = new EventEmitter();

// DANGEROUS — no error listener
emitter.emit('error', new Error('Something went wrong'));
// UnhandledError: Something went wrong → CRASH!

// SAFE — always add error listener
emitter.on('error', (err) => {
  console.error('Handled error:', err.message);
});
emitter.emit('error', new Error('Something went wrong'));
// Handled error: Something went wrong → No crash
```

---

## 6. Memory Leaks

### Problem:
```javascript
const emitter = new EventEmitter();

// Loop mein listeners add karo
for (let i = 0; i < 20; i++) {
  emitter.on('data', () => console.log(i));
}

// Warning: MaxListenersExceededWarning
// Default max: 10 listeners per event
```

### Fix:
```javascript
// Option 1: Max listeners badhao
emitter.setMaxListeners(20);

// Option 2: Unlimited (careful!)
emitter.setMaxListeners(0);

// Option 3: once() use karo (auto-remove)
emitter.once('data', handler);

// Option 4: Listeners cleanup karo
function handler() { console.log('handled'); }
emitter.on('data', handler);
// ... use karo ...
emitter.off('data', handler); // Cleanup!
```

### Common Memory Leak Pattern:
```javascript
// BAD — har request pe new listener add hota hai
app.get('/api', (req, res) => {
  emitter.on('data', (data) => {  // ← Leak!
    res.json(data);
  });
});

// GOOD — once() use karo
app.get('/api', (req, res) => {
  emitter.once('data', (data) => {  // ← Auto-remove
    res.json(data);
  });
});
```

---

## 7. Async EventEmitter Pattern

```javascript
import { EventEmitter } from 'events';

class FileProcessor extends EventEmitter {
  async processFile(path) {
    this.emit('start', { path });

    try {
      const data = await fs.readFile(path, 'utf-8');
      this.emit('progress', { percent: 50 });

      const processed = data.toUpperCase();
      this.emit('progress', { percent: 100 });

      this.emit('done', { result: processed, lines: processed.split('\n').length });
    } catch (err) {
      this.emit('error', err);
    }
  }
}

const processor = new FileProcessor();

processor.on('start',    ({ path }) => console.log(`Processing: ${path}`));
processor.on('progress', ({ percent }) => console.log(`Progress: ${percent}%`));
processor.on('done',     ({ lines }) => console.log(`Done! ${lines} lines`));
processor.on('error',    (err) => console.error('Failed:', err.message));

await processor.processFile('./sample.txt');
```

---

## 8. EventEmitter vs Callbacks vs Promises

```
Callbacks:
  One-time response
  Simple async operations
  Error-first convention

Promises/async-await:
  One-time response
  Chainable
  Better error handling

EventEmitter:
  Multiple events over time
  Multiple listeners
  Ongoing streams of data
  Real-time updates

Use EventEmitter when:
  ✓ Multiple events possible (data, end, error)
  ✓ Multiple listeners needed
  ✓ Ongoing/streaming data
  ✓ Decoupled architecture

Use Promise when:
  ✓ Single result expected
  ✓ Simple async operation
```

---

## 9. Quick Summary

```
EventEmitter methods:
  on(event, fn)              → Listener add (persistent)
  once(event, fn)            → Listener add (one-time)
  emit(event, ...args)       → Event trigger
  off(event, fn)             → Listener remove
  removeAllListeners(event)  → All listeners remove
  listenerCount(event)       → Count listeners
  setMaxListeners(n)         → Max limit set

Rules:
  Always add 'error' listener (crash prevent)
  Use once() for one-time operations
  Cleanup listeners to prevent memory leaks
  Default max: 10 listeners per event
```

---

## 10. Practice Tasks (Aaj Karo)

### Task 1: Custom EventEmitter
```javascript
// OrderSystem class banao extending EventEmitter
// Events: 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled'
// Methods: placeOrder(), confirmOrder(), shipOrder(), deliverOrder()
// Test karo: Order lifecycle simulate karo
```

### Task 2: Memory Leak Test
```javascript
const emitter = new EventEmitter();

// 15 listeners add karo
for (let i = 0; i < 15; i++) {
  emitter.on('test', () => {});
}

// Warning aayega? Kaise fix karein?
console.log(emitter.listenerCount('test'));
```

### Task 3: Async File Processor
```javascript
// FileProcessor class banao
// Events: start, progress, done, error
// processFile() method implement karo
// Test karo with sample.txt
```

---

Kal Day 7 — Week 3 Revision + Quiz.
Event loop, async patterns, worker threads, EventEmitter sab cover karenge.
