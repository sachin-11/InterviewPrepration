# React.js | Next.js | Node.js | Python — Senior Developer Interview Q&A
> **Target:** 5-8+ years experience | Product-based companies (FAANG, Zepto, Razorpay, Swiggy, etc.)
> **Format:** Hinglish — Question + Depth Answer + Follow-up trap

---

## TABLE OF CONTENTS
1. [React.js — Advanced](#reactjs--advanced)
2. [Next.js — Advanced](#nextjs--advanced)
3. [Node.js — Advanced](#nodejs--advanced)
4. [Python — Advanced](#python--advanced)
5. [Cross-Tech System Design Questions](#cross-tech-system-design)

---

---

# REACT.JS — BASICS

---

## B1. Core Concepts

**QB1. React kya hai aur vanilla JavaScript se kaise alag hai?**

**Answer:**
- React ek **UI library** hai (framework nahi) — sirf View layer handle karta hai
- **Component-based:** UI ko reusable, independent pieces mein tod deta hai
- **Declarative:** "Kya dikhana hai" define karo, "Kaise update karna hai" React handle karta hai
- **Virtual DOM:** Direct DOM manipulation nahi karta — pehle virtual DOM mein change karta hai, phir minimal real DOM updates

```jsx
// Vanilla JS — imperative (kaise karna hai)
const el = document.getElementById('count');
el.innerText = count + 1;

// React — declarative (kya dikhana hai)
const [count, setCount] = useState(0);
return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
```

---

**QB2. JSX kya hai? Browser directly JSX kaise run karta hai?**

**Answer:**
- JSX = **JavaScript XML** — HTML-like syntax jo JavaScript mein likha jata hai
- Browser JSX directly nahi samajhta — **Babel** ise `React.createElement()` calls mein transpile karta hai

```jsx
// JSX
const element = <h1 className="title">Hello</h1>;

// Babel transpile karta hai ↓
const element = React.createElement('h1', { className: 'title' }, 'Hello');
```

**Rules:**
- Single root element hona chahiye (ya `<>...</>` Fragment use karo)
- `class` nahi, `className` likhte hain
- Self-closing tags required: `<img />`, `<input />`
- JS expressions `{}` mein: `<h1>{user.name}</h1>`

---

**QB3. Component kya hota hai? Class vs Functional component ka difference?**

**Answer:**

| | Class Component | Functional Component |
|---|---|---|
| **Syntax** | `class App extends React.Component` | `function App()` |
| **State** | `this.state` | `useState` hook |
| **Lifecycle** | `componentDidMount` etc. | `useEffect` hook |
| **Performance** | Thoda heavy | Lighter, faster |
| **Modern use** | Legacy code mein milta hai | **2024 mein yahi use karo** |

```jsx
// Functional Component (modern)
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Usage
<Greeting name="Sachin" />
```

---

**QB4. Props kya hain? Props aur State mein kya fark hai?**

**Answer:**

| | Props | State |
|---|---|---|
| **Source** | Parent se aata hai | Component ka apna data |
| **Mutable?** | Nahi (read-only) | Haan (`setState`/`useState`) |
| **Control** | Parent control karta hai | Component khud control karta hai |
| **Re-render** | Parent re-render pe update | `setState` call pe update |

```jsx
// Props — parent se data receive karo
function UserCard({ name, age, isAdmin }) {
  return (
    <div>
      <h2>{name} ({age})</h2>
      {isAdmin && <span>Admin</span>}
    </div>
  );
}

// State — component ka khud ka data
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

**QB5. useState hook kaise kaam karta hai? Common mistakes kya hain?**

**Answer:**
```jsx
const [value, setValue] = useState(initialValue);
```

**Common mistakes:**

```jsx
// ❌ Wrong — state directly mutate karna
const [user, setUser] = useState({ name: 'Sachin', age: 25 });
user.age = 26; // React detect nahi karega change!

// ✅ Correct — new object return karo
setUser(prev => ({ ...prev, age: 26 }));

// ❌ Wrong — stale state use karna
setCount(count + 1);
setCount(count + 1); // dono ek hi count reference karte hain!

// ✅ Correct — functional update
setCount(prev => prev + 1);
setCount(prev => prev + 1); // ab sahi 2 se badhega
```

---

**QB6. useEffect hook kya karta hai? Cleanup function kab zarurat padti hai?**

**Answer:**
```jsx
useEffect(() => {
  // Side effects yahan: API call, subscription, timer, DOM manipulation

  return () => {
    // Cleanup: component unmount hone se pehle run hota hai
  };
}, [dependencies]); // dependency array
```

**Dependency array behavior:**

```jsx
useEffect(() => { /* run every render */ });           // no array
useEffect(() => { /* run once on mount */ }, []);      // empty array
useEffect(() => { /* run when count changes */ }, [count]); // specific dep

// Cleanup example — timer
useEffect(() => {
  const timer = setInterval(() => setTime(new Date()), 1000);
  return () => clearInterval(timer); // cleanup on unmount
}, []);
```

---

**QB7. Conditional Rendering ke patterns kya hain React mein?**

**Answer:**
```jsx
// 1. if/else (outside JSX)
function Alert({ type, message }) {
  if (!message) return null;
  
  return <div className={`alert-${type}`}>{message}</div>;
}

// 2. Ternary operator
<div>
  {isLoggedIn ? <Dashboard /> : <Login />}
</div>

// 3. Short-circuit (&&) — true hone pe hi render karo
<div>
  {isAdmin && <AdminPanel />}
  {errors.length > 0 && <ErrorList errors={errors} />}
</div>

// 4. Optional chaining
<span>{user?.profile?.avatar ?? 'No avatar'}</span>
```

---

**QB8. Lists render karte waqt `key` prop kyun zaroori hai?**

**Answer:**
- React ko sibling elements ko uniquely identify karne ke liye key chahiye
- Key se React efficiently decide karta hai kya add/remove/reorder karna hai

```jsx
// ❌ Wrong — index as key (reorder/delete pe bugs)
{items.map((item, index) => <li key={index}>{item.name}</li>)}

// ✅ Correct — unique stable ID
{items.map(item => <li key={item.id}>{item.name}</li>)}

// ❌ Wrong — key missing (console warning)
{items.map(item => <li>{item.name}</li>)}
```

---

**QB9. Event handling React mein kaise hota hai? Synthetic Events kya hain?**

**Answer:**
- React native DOM events wrap karta hai **SyntheticEvent** mein — cross-browser consistency ke liye
- camelCase event names: `onClick`, `onChange`, `onSubmit`, `onKeyDown`

```jsx
function Form() {
  const handleSubmit = (e) => {
    e.preventDefault(); // default form submission rok
    console.log(e.target.value);
  };

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Trap:** `onClick={() => handleClick(id)}` vs `onClick={handleClick}` — arrow function se har render pe naya function banta hai.

---

**QB10. Controlled vs Uncontrolled Components kya hain?**

**Answer:**

| | Controlled | Uncontrolled |
|---|---|---|
| **Data** | React state mein | DOM mein (ref) |
| **Access** | `value` + `onChange` | `useRef` |
| **Validation** | Real-time possible | Submit ke waqt |
| **Use when** | Form validation, instant feedback | Simple forms, file input |

```jsx
// Controlled — React state drives input value
function ControlledInput() {
  const [value, setValue] = useState('');
  return (
    <input 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
  );
}

// Uncontrolled — DOM drives value
function UncontrolledInput() {
  const inputRef = useRef(null);
  const handleSubmit = () => console.log(inputRef.current.value);
  return <input ref={inputRef} />;
}
```

---

**QB11. useRef kab use karte hain?**

**Answer:**
- DOM element directly access karna ho
- Value store karni ho jo re-render trigger na kare (instance variable jaise)

```jsx
function VideoPlayer() {
  const videoRef = useRef(null);
  
  // DOM access — play/pause
  const play = () => videoRef.current.play();
  
  return <video ref={videoRef} src="/video.mp4" />;
}

// Re-render na karne wala counter (timer ID store karna)
function Timer() {
  const timerRef = useRef(null);
  
  const start = () => {
    timerRef.current = setInterval(() => {}, 1000);
  };
  
  const stop = () => clearInterval(timerRef.current);
}
```

---

**QB12. Component Lifecycle — hooks se kaise map hota hai?**

**Answer:**

| Lifecycle Method | Hook Equivalent |
|---|---|
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate` | `useEffect(() => {}, [dep])` |
| `componentWillUnmount` | `useEffect(() => { return () => cleanup }, [])` |
| `shouldComponentUpdate` | `React.memo` / `useMemo` |
| `getDerivedStateFromProps` | Render time mein state calculate karo |

---

**QB13. React mein data parent se child aur child se parent kaise flow karta hai?**

**Answer:**
- **Parent → Child:** Props se (unidirectional data flow)
- **Child → Parent:** Callback function props se (lifting state up)

```jsx
// Parent
function Parent() {
  const [childData, setChildData] = useState('');
  
  return (
    <div>
      <Child onDataChange={setChildData} />  {/* callback pass */}
      <p>Child ne bheja: {childData}</p>
    </div>
  );
}

// Child — callback call karke parent ko data bhejta hai
function Child({ onDataChange }) {
  return (
    <input onChange={(e) => onDataChange(e.target.value)} />
  );
}
```

---

**QB14. React.memo, useMemo, useCallback — teen alag cheezein hain, kaise?**

**Answer:**

| | Kya cache karta hai | Use case |
|---|---|---|
| `React.memo` | **Component** (re-render rok) | Props same ho toh child re-render mat karo |
| `useMemo` | **Computed value** | Expensive calculation cache karo |
| `useCallback` | **Function reference** | Callback prop stable rakho (memo ke saath) |

```jsx
// React.memo — component memoize
const ExpensiveChild = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// useMemo — value memoize
const sortedList = useMemo(
  () => bigArray.sort((a, b) => a.price - b.price),
  [bigArray] // sirf bigArray change hone pe recalculate
);

// useCallback — function memoize (React.memo ke saath use)
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

---

**QB15. Context API se global state kaise manage karte hain?**

**Answer:**
```jsx
// 1. Context create karo
const ThemeContext = createContext('light');

// 2. Provider se wrap karo
function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Router />
    </ThemeContext.Provider>
  );
}

// 3. Kisi bhi child mein consume karo
function Header() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <header className={theme}>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle
      </button>
    </header>
  );
}
```

**Limitation:** Context value change hone pe **sab** consumers re-render hote hain — isliye high-frequency state ke liye Zustand/Redux better hai.

---

**QB16. Error Boundaries kya hain? Kaise implement karte hain?**

**Answer:**
- JavaScript errors ko child component tree mein catch karta hai
- Crash hone ki jagah fallback UI dikhata hai
- **Sirf Class components** Error Boundary ban sakte hain (hooks se nahi)

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo); // Sentry etc.
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong. Please refresh.</h2>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <UserDashboard />
</ErrorBoundary>
```

---

**QB17. React mein forms handle karne ka best pattern kya hai?**

**Answer:**
```jsx
// Simple form with controlled inputs
function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.includes('@')) errs.email = 'Valid email required';
    if (formData.password.length < 6) errs.password = 'Min 6 characters';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    // submit logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={formData.email} onChange={handleChange} />
      {errors.email && <span className="error">{errors.email}</span>}
      <input name="password" type="password" value={formData.password} onChange={handleChange} />
      {errors.password && <span className="error">{errors.password}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

**Production mein:** React Hook Form ya Formik use karo — validation, performance, less boilerplate.

---

---

# REACT.JS — ADVANCED

---

## 1. Architecture & Internals

**Q1. React Fiber kya hai? Purana Stack Reconciler kyun fail hota tha?**

**Answer:**
- Purana reconciler **synchronous** tha — ek baar DOM update shuru hua toh main thread block hoti thi, UI freeze hoti thi.
- **React Fiber** (React 16+) ek incremental, priority-based reconciler hai.
- Rendering work ko **chote units (fibers)** me tod deta hai, inhe pause/resume/abort kar sakta hai.
- **2 Phases:**
  - *Render Phase* (async, interruptible): Virtual DOM diff calculate karta hai
  - *Commit Phase* (sync, uninterruptible): Actual DOM update karta hai
- **Time Slicing:** High-priority tasks (user input) ko low-priority tasks (big list render) se pehle execute karta hai.

**Follow-up:** `startTransition` aur `useDeferredValue` mein kya fark hai?
- `startTransition` — state update ko explicitly non-urgent mark karo
- `useDeferredValue` — existing value ko defer karo bina state change ke (jaise slow child ko stale value do)

---

**Q2. Virtual DOM reconciliation ka exact algorithm kya hai? O(n³) se O(n) kaise hua?**

**Answer:**
- Naive tree diff = O(n³) — har node ko dusre sab se compare karo
- React ne **3 heuristics** assume karke O(n) banaya:
  1. **Different type = different tree** — `<div>` ke jagah `<span>` aaya toh poora subtree destroy/rebuild
  2. **Keys** — list items ke liye keys se React same element ko identify karta hai across renders
  3. **Same level only** — sibling level pe compare hota hai, cross-level move expensive maana jata hai

**Trap:** Key as index use karne ki problem kya hai?
- Agar list me reorder/delete hoga toh key aur element match nahi karega → unnecessary DOM mutations, state bugs, animation issues.

---

**Q3. React 18 ke Concurrent Features practically kab use karoge?**

**Answer:**

| Feature | Use Case |
|---------|----------|
| `useTransition` | Search/filter jo slow hai — input responsive rakho, results defer karo |
| `useDeferredValue` | Slow child component jo props se render hota hai |
| `Suspense` + lazy loading | Code splitting, data fetching (React Query + Suspense) |
| `useId` | SSR-compatible unique IDs (hydration mismatch avoid) |

```jsx
// useTransition example
const [isPending, startTransition] = useTransition();

const handleSearch = (val) => {
  setInputValue(val); // urgent — immediate update
  startTransition(() => {
    setFilteredList(bigArray.filter(...)); // non-urgent
  });
};
```

---

## 2. State Management

**Q4. Context API vs Redux vs Zustand — senior developer kaise decide karta hai?**

**Answer:**

| | Context API | Redux Toolkit | Zustand |
|---|---|---|---|
| **Best for** | Theme, Auth (low-frequency) | Large teams, complex flows | Medium apps, minimal boilerplate |
| **Re-render problem** | Har consumer re-renders | Selective (mapState) | Selective (selector-based) |
| **DevTools** | Basic | Excellent | Good |
| **Boilerplate** | Low | Medium | Very Low |

**Senior answer:** Modern stack = **TanStack Query** (server state) + **Zustand** (client UI state). Redux sirf tab jab team size bada ho ya existing codebase Redux pe ho.

---

**Q5. React Query / TanStack Query kya solve karta hai jo Redux nahi karta?**

**Answer:**
- Server state aur client state **fundamentally alag** hain
- Redux me API data manage karne me: loading state, error state, caching, refetch, stale data — sab manually likhna padta tha
- **TanStack Query automatically handle karta hai:**
  - Background refetching (stale-while-revalidate)
  - Cache invalidation (`queryClient.invalidateQueries`)
  - Deduplication (same query ek hi baar fire)
  - Pagination, infinite scroll (built-in)
  - Optimistic updates

**Trap:** Optimistic update rollback kaise karo?
```js
useMutation({
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(['todos']);
    const prev = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], old => [...old, newTodo]);
    return { prev }; // context for rollback
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.prev); // rollback
  },
});
```

---

## 3. Performance

**Q6. Large list rendering optimize kaise karo? (10,000+ items)**

**Answer:**
1. **Virtualization** — `react-window` ya `TanStack Virtual` use karo: sirf visible rows render karo
2. **Pagination / Infinite Scroll** — data hi kam load karo
3. **useMemo** — filter/sort computation cache karo
4. **React.memo + useCallback** — child re-renders rok
5. **Web Workers** — heavy computation main thread se hatao

```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} itemCount={10000} itemSize={35}>
  {({ index, style }) => <div style={style}>Item {index}</div>}
</FixedSizeList>
```

---

**Q7. Code splitting aur lazy loading ke saath Suspense ka pattern kya hai?**

**Answer:**
```jsx
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```
- Route-level code splitting best practice hai
- Bundle analyzer se large chunks identify karo (`source-map-explorer` / `webpack-bundle-analyzer`)
- Preloading: hover pe import trigger karo for instant feel

---

## 4. Custom Hooks & Patterns

**Q8. Custom hook likhne ke real-world rules kya hain?**

**Answer:**
- `use` prefix required (Rules of Hooks enforce karne ke liye)
- Single responsibility — ek hook ek kaam
- Return values `{data, isLoading, error}` pattern follow karo

**Senior-level example — useDebounce:**
```js
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // cleanup
  }, [value, delay]);
  return debouncedValue;
}
```

**Q9. React mein memory leak kab aate hain aur kaise prevent karein?**

**Answer:**
- Async operation complete hone se pehle component unmount ho jaye → state update on unmounted component
- **Fix:** AbortController ya cleanup function

```js
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(e => { if (e.name !== 'AbortError') console.error(e) });
  
  return () => controller.abort(); // cleanup on unmount
}, []);
```

---

---

# NEXT.JS — ADVANCED

---

## 1. Rendering Strategies

**Q10. Next.js ke 4 rendering strategies kab use karte hain? Trade-offs batao.**

**Answer:**

| Strategy | When | Trade-off |
|----------|------|-----------|
| **SSG** (Static Generation) | Blog, docs, marketing pages | Build time slow, real-time data nahi |
| **SSR** (Server-Side Rendering) | Dashboard with user-specific data | Per-request server load, slower TTFB |
| **ISR** (Incremental Static Regen) | E-commerce product pages | Slightly stale data possible |
| **CSR** (Client-Side Rendering) | Admin panels, user dashboards behind auth | Bad SEO, slower initial load |

**ISR example:**
```js
export async function getStaticProps() {
  const data = await fetchProducts();
  return {
    props: { data },
    revalidate: 60, // rebuild every 60 seconds
  };
}
```

---

**Q11. Next.js 13/14 App Router vs Pages Router — kya fark hai?**

**Answer:**

| | Pages Router | App Router |
|---|---|---|
| **File location** | `/pages` | `/app` |
| **Default** | Client Components | Server Components |
| **Data fetching** | `getServerSideProps`, `getStaticProps` | Direct `async/await` in component |
| **Layouts** | `_app.js` based | Nested `layout.tsx` |
| **Streaming** | Limited | Native (Suspense) |

**App Router data fetching:**
```tsx
// Server Component — no useState, no useEffect needed
async function ProductPage({ params }) {
  const product = await fetch(`/api/products/${params.id}`, {
    next: { revalidate: 3600 } // ISR-like caching
  });
  return <ProductDetail product={await product.json()} />;
}
```

---

**Q12. Server Components aur Client Components ki boundary kaha decide karte hain?**

**Answer:**
- **Server Component** (default): DB queries, file system, auth checks, heavy computation, no browser APIs
- **Client Component** (`'use client'`): useState, useEffect, event handlers, browser APIs, animations

**Pattern — "Push client components to leaves":**
```
Page (Server)
  └── ProductList (Server — fetches data)
        └── ProductCard (Server)
              └── AddToCartButton (Client — onClick needed)
```

**Trap:** Server Component se Client Component ko directly props me functions pass nahi kar sakte (functions are not serializable). Solution: Event handlers client me hi define karo.

---

**Q13. Next.js mein Route Handlers (API Routes) ke saath middleware kaise implement karte hain?**

**Answer:**
```ts
// middleware.ts (root level)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```
- Middleware Edge Runtime pe chalta hai — bohot fast, globally distributed
- Auth, A/B testing, localization, rate limiting ke liye ideal

---

**Q14. Next.js Image Optimization kaise kaam karta hai?**

**Answer:**
- `<Image>` component automatically:
  - **Format conversion:** WebP/AVIF serve karta hai (agar browser support ho)
  - **Lazy loading:** viewport mein aane par load
  - **Size optimization:** device ke hisaab se resize
  - **CLS prevention:** `width`/`height` required (layout shift rokta hai)
  - **Blur placeholder:** `placeholder="blur"` se smooth loading

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // LCP image — eager load
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

**Q15. Next.js caching layers explain karo (Next.js 14 mein).**

**Answer:**
Next.js has 4 cache layers:
1. **Request Memoization** — Same request ek render me ek baar (automatic)
2. **Data Cache** — `fetch` responses disk pe cache (opt-out: `cache: 'no-store'`)
3. **Full Route Cache** — Static routes build time pe cache
4. **Router Cache** — Browser-side navigation cache (prefetched pages)

**Revalidation strategies:**
```ts
// Time-based
fetch('/api/data', { next: { revalidate: 3600 } });

// On-demand (from Server Action)
import { revalidatePath, revalidateTag } from 'next/cache';
revalidatePath('/products');
revalidateTag('product-list');
```

---

---

# NODE.JS — ADVANCED

---

## 1. Event Loop & Internals

**Q16. Node.js Event Loop ke phases explain karo aur `setImmediate` vs `setTimeout(fn, 0)` ka difference batao.**

**Answer:**
Event Loop phases (order):
1. **timers** — `setTimeout`, `setInterval` callbacks
2. **pending callbacks** — I/O errors
3. **idle, prepare** — internal
4. **poll** — I/O callbacks (main phase — yahan wait karta hai)
5. **check** — `setImmediate` callbacks
6. **close callbacks** — socket.destroy() etc.

**Microtask queue** (between each phase): `process.nextTick` > `Promise.then`

```js
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));

// Output:
// nextTick
// promise
// setTimeout (or setImmediate — depends on I/O context)
// setImmediate (or setTimeout)
```

**Key:** I/O callback ke andar `setImmediate` hamesha `setTimeout` se pehle aata hai.

---

**Q17. Node.js single-threaded hai phir bhi CPU-intensive tasks kaise handle karte hain?**

**Answer:**
- Node.js **I/O non-blocking** hai (libuv thread pool = 4 threads by default)
- CPU-bound work event loop block karta hai → bad practice

**Solutions:**
1. **Worker Threads** (`worker_threads` module) — true parallelism for CPU tasks
2. **Child Processes** (`child_process.fork`) — separate process spawn
3. **Cluster Module** — multiple Node instances (multi-core utilization)

```js
// Worker Threads example
const { Worker } = require('worker_threads');

app.get('/heavy', (req, res) => {
  const worker = new Worker('./heavy-task.js', {
    workerData: { input: req.query.n }
  });
  worker.on('message', result => res.json({ result }));
});
```

---

**Q18. Node.js mein memory leak debug kaise karte hain production mein?**

**Answer:**
**Common causes:**
- Event listeners not removed (`.removeListener` / `.off`)
- Closures holding large references
- Global variable accumulation
- Unclosed streams/DB connections

**Debug steps:**
1. `process.memoryUsage()` — RSS, heapUsed monitor karo
2. `--inspect` flag + Chrome DevTools → Heap Snapshot lao
3. `clinic.js` (Node Clinic) — visual profiling
4. `heapdump` npm package — production heap dump

```js
// Detect: log memory every 30s
setInterval(() => {
  const { heapUsed, heapTotal } = process.memoryUsage();
  console.log(`Heap: ${Math.round(heapUsed/1024/1024)}MB / ${Math.round(heapTotal/1024/1024)}MB`);
}, 30000);
```

---

**Q19. Express.js mein error handling ka proper pattern kya hai?**

**Answer:**
```js
// Async wrapper — unhandled promise rejection avoid karo
const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

// Route
app.get('/user/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));

// Central error handler (4 arguments = error middleware)
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

---

**Q20. Node.js mein Rate Limiting implement karne ke different approaches?**

**Answer:**
1. **In-memory** (`express-rate-limit`) — single server, simple
2. **Redis-based** (`rate-limiter-flexible`) — distributed, multi-server
3. **API Gateway level** (Kong, AWS API GW) — infrastructure level

```js
// Redis-based (production-ready)
const { RateLimiterRedis } = require('rate-limiter-flexible');
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100,        // requests
  duration: 60,       // per 60 seconds
  blockDuration: 120, // block for 2 min if exceeded
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ message: 'Too many requests' });
  }
});
```

---

**Q21. JWT authentication ka secure implementation kya hai? Common mistakes?**

**Answer:**

**Common mistakes:**
- Secret key weak/hardcoded hai
- `localStorage` mein store karna (XSS vulnerable)
- Token expiry nahi set karna
- Refresh token rotation nahi karna
- Algorithm `none` attack protect nahi karna

**Secure implementation:**
```js
// Access token — short-lived (15 min)
const accessToken = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Refresh token — long-lived, httpOnly cookie
const refreshToken = jwt.sign(
  { userId: user.id },
  process.env.REFRESH_SECRET,
  { expiresIn: '7d' }
);

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,   // XSS prevent
  secure: true,     // HTTPS only
  sameSite: 'strict', // CSRF prevent
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

---

**Q22. Node.js mein DB connection pooling kyun important hai aur kaise configure karte hain?**

**Answer:**
- Har request pe naya DB connection = slow (TCP handshake + auth overhead)
- Connection pool = pre-established connections ready hain

```js
// PostgreSQL with pg (node-postgres)
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  max: 20,          // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Usage — auto returns connection to pool
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
```

**Rule of thumb:** Pool size = (core count * 2) + effective_spindle_count

---

---

# PYTHON — ADVANCED

---

## 1. Language Internals

**Q23. Python GIL (Global Interpreter Lock) kya hai? Iska practical impact kya hai?**

**Answer:**
- GIL ek mutex hai jo ensure karta hai ki ek waqt mein sirf ek thread Python bytecode execute kare
- **CPython** (default Python) mein hai; PyPy, Jython mein nahi

**Impact:**
- **CPU-bound tasks:** Multiple threads parallel nahi chalta → `multiprocessing` use karo
- **I/O-bound tasks:** GIL release hota hai during I/O wait → `threading` / `asyncio` kaam karta hai

```python
# CPU-bound — use multiprocessing
from multiprocessing import Pool

def heavy_task(n):
    return sum(i * i for i in range(n))

with Pool(processes=4) as pool:
    results = pool.map(heavy_task, [10**6, 10**6, 10**6, 10**6])

# I/O-bound — use asyncio
import asyncio
import aiohttp

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)
```

---

**Q24. Python mein `__slots__` kya karta hai aur kab use karna chahiye?**

**Answer:**
- Normally Python objects `__dict__` use karte hain (flexible, lekin memory-heavy)
- `__slots__` define karne se attributes fixed ho jaate hain → ~40% memory savings

```python
# Normal class — har instance ka __dict__ hota hai
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# With __slots__ — no __dict__, faster attribute access
class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

**Use when:** Millions of small objects create ho rahe ho (e.g., game entities, financial ticks).

---

**Q25. Python Generators aur `yield` — memory-efficient kaise hain?**

**Answer:**
```python
# List — sab kuch ek sath memory mein
def get_squares_list(n):
    return [i*i for i in range(n)]  # 1M items = ~8MB

# Generator — ek ek item on demand
def get_squares_gen(n):
    for i in range(n):
        yield i*i  # memory = single item

# Generator expression
squares = (i*i for i in range(1_000_000))  # lazy evaluation
```

**Real use case — large file processing:**
```python
def read_large_file(filepath):
    with open(filepath) as f:
        for line in f:
            yield line.strip()  # ek ek line process, poora file memory mein nahi

for line in read_large_file('huge_log.txt'):
    process(line)
```

---

**Q26. Python Decorators ka advanced use — class decorators aur functools.wraps kyun zaroori hai?**

**Answer:**
```python
import functools
import time

def timer(func):
    @functools.wraps(func)  # preserves __name__, __doc__ of original
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} took {end-start:.4f}s")
        return result
    return wrapper

# Decorator with arguments
def retry(max_attempts=3, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(2 ** attempt)  # exponential backoff
        return wrapper
    return decorator

@retry(max_attempts=3, exceptions=(ConnectionError,))
def fetch_data(url):
    ...
```

---

**Q27. FastAPI vs Flask vs Django — senior developer kaise choose karta hai?**

**Answer:**

| | Django | Flask | FastAPI |
|---|---|---|---|
| **Type** | Full-featured (batteries included) | Micro framework | Async, high performance |
| **Best for** | Admin panels, CMS, rapid CRUD | Small APIs, prototyping | ML APIs, high-throughput services |
| **ORM** | Built-in (Django ORM) | SQLAlchemy (external) | SQLAlchemy / Tortoise ORM |
| **Performance** | Moderate | Moderate | Excellent (ASGI) |
| **Auto docs** | No (drf-yasg) | No (flasgger) | Yes (Swagger + ReDoc built-in) |
| **Validation** | Forms/Serializers | Manual / Marshmallow | Pydantic (built-in) |

**Senior recommendation:**
- **New ML/AI API:** FastAPI (async, Pydantic validation, auto docs)
- **SaaS with admin panel:** Django + Django REST Framework
- **Microservice (simple):** FastAPI ya Flask

---

**Q28. Python mein async/await (asyncio) ka real example — aur threading se kab better hai?**

**Answer:**
```python
import asyncio
import aiofiles
import aiohttp

# 1000 URLs concurrently fetch — threading se zyada efficient
async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        return await asyncio.gather(*tasks, return_exceptions=True)

async def fetch_one(session, url):
    async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as r:
        return await r.json()

# Run
results = asyncio.run(fetch_all(urls))
```

**asyncio vs threading:**
- asyncio = cooperative multitasking, single thread, low overhead
- threading = OS-level threads, context switch overhead, GIL issues for CPU
- **I/O bound:** asyncio > threading (less memory, more concurrent)
- **CPU bound:** multiprocessing > both

---

**Q29. Python type hints aur Pydantic se production code kaise better hota hai?**

**Answer:**
```python
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., regex=r'^[\w.-]+@[\w.-]+\.\w+$')
    age: int = Field(..., ge=18, le=120)
    tags: List[str] = []

    @validator('email')
    def email_lowercase(cls, v):
        return v.lower()

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        orm_mode = True  # SQLAlchemy model se convert

# FastAPI mein
@app.post('/users', response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    return db_user
```

---

**Q30. Python mein Design Patterns — real codebase mein kaunse most used hain?**

**Answer:**

**1. Singleton (DB connection, config):**
```python
class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.connection = create_engine(DATABASE_URL)
        return cls._instance
```

**2. Factory Pattern:**
```python
class NotificationFactory:
    @staticmethod
    def get_notifier(channel: str):
        notifiers = {
            'email': EmailNotifier,
            'sms': SMSNotifier,
            'push': PushNotifier,
        }
        return notifiers[channel]()
```

**3. Repository Pattern (popular in FastAPI/Django):**
```python
class UserRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create(self, user_data: dict) -> User:
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        return user
```

---

---

# CROSS-TECH SYSTEM DESIGN

---

**Q31. Full-stack mein authentication flow design karo — React + Next.js + Node.js backend.**

**Answer:**
```
Browser (React/Next.js)
  → POST /auth/login (credentials)
  → Node.js validates, returns { accessToken } + sets httpOnly refreshToken cookie
  → React stores accessToken in memory (React state / Zustand) — NOT localStorage
  → API calls: Authorization: Bearer <accessToken>
  → 401 aaya? → POST /auth/refresh (refreshToken cookie auto-sent)
  → New accessToken milta hai → retry original request
  → Logout: DELETE /auth/logout → server refreshToken invalidate karo
```

**Next.js App Router mein:** NextAuth.js / Auth.js use karo — yeh poora flow handle karta hai

---

**Q32. React frontend se Python FastAPI backend ka efficient communication pattern?**

**Answer:**
```
React → TanStack Query → FastAPI
  - TanStack Query handles: caching, retries, background refetch
  - FastAPI handles: Pydantic validation, async DB queries
  - WebSocket (real-time): FastAPI WebSocket + React's useWebSocket hook
  - File upload: multipart/form-data → FastAPI UploadFile
```

**CORS setup FastAPI:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourapp.com"],
    allow_credentials=True,  # cookies ke liye
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

**Q33. Monorepo mein React + Next.js + Node.js manage karne ka approach?**

**Answer:**
```
my-monorepo/
├── apps/
│   ├── web/          (Next.js)
│   ├── api/          (Node.js / Express / Fastify)
│   └── admin/        (React SPA)
├── packages/
│   ├── ui/           (Shared React components)
│   ├── types/        (Shared TypeScript types)
│   └── config/       (ESLint, TS config)
├── package.json      (workspaces)
└── turbo.json        (TurboRepo pipeline)
```

**Tools:** TurboRepo (build caching), pnpm workspaces, shared ESLint + Prettier config

---

---

## QUICK REVISION — MOST ASKED CONCEPTS

### React
- [ ] Fiber reconciliation + phases
- [ ] useTransition + useDeferredValue
- [ ] useMemo vs useCallback (kab use, kab avoid)
- [ ] Custom hooks patterns
- [ ] Memory leaks + AbortController

### Next.js  
- [ ] SSG vs SSR vs ISR vs CSR
- [ ] App Router vs Pages Router
- [ ] Server vs Client Components boundary
- [ ] Middleware (Edge Runtime)
- [ ] 4 Cache layers + revalidation

### Node.js
- [ ] Event Loop phases + microtask queue
- [ ] Worker Threads vs Cluster
- [ ] JWT secure pattern (httpOnly cookie)
- [ ] Rate limiting (Redis-based)
- [ ] Connection pooling

### Python
- [ ] GIL impact + solutions (multiprocessing/asyncio)
- [ ] generators vs lists (memory)
- [ ] asyncio + aiohttp pattern
- [ ] Pydantic validation
- [ ] Decorators with functools.wraps
- [ ] Design patterns (Singleton, Factory, Repository)

---

> **Interview tip:** Har answer mein ek real production scenario ya past experience mention karo. "Humne ek project mein yeh problem face ki aur isse solve kiya" — yeh senior-level responses ki pehchaan hai.
