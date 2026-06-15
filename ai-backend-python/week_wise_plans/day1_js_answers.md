# Day 1: Advanced JavaScript (Answers & Explanations)

Yeh file aapke Day 1 ke topics aur uske interview question ka detailed explanation hai. Isse padhkar aapko clear ho jayega ki interview mein kis level ki understanding dikhani hai.

---

## 1. Interview Question: The Output Order
**Question:** Agar hum ek hi file mein `setTimeout`, `Promise.resolve`, aur `console.log` likhein, toh output ka order kya hoga aur kyun?

```javascript
console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise");
});

console.log("End");
```

**Output Order:**
1. `"Start"`
2. `"End"`
3. `"Promise"`
4. `"Timeout"`

### **Kyun? (The "Under the Hood" Reason):**
JavaScript ka Event Loop 3 main jagaho par kaam karta hai: **Call Stack**, **Microtask Queue**, aur **Macrotask Queue (Task Queue)**.

1. **Call Stack (Synchronous Code - Highest Priority):** JS engine sabse pehle line-by-line code padhta hai aur synchronous code ko turant execute karta hai. Isliye `"Start"` aur `"End"` sabse pehle print hote hain.
2. **Microtask Queue (Promises - 2nd Priority):** Jaise hi Call Stack khali hota hai, Event Loop sabse pehle *Microtask Queue* ko check karta hai. Saare Promises (`.then`, `.catch`, `async/await`) aur `MutationObserver` yahan jate hain. Isliye `"Promise"` print hota hai.
3. **Macrotask Queue (Timers - Lowest Priority):** Jab Microtask Queue poori tarah khali ho jati hai, tab Event Loop *Macrotask Queue* mein dekhta hai. `setTimeout`, `setInterval`, aur DOM events yahan jate hain. Isliye 0 milliseconds hone ke bawajood `"Timeout"` sabse last mein print hota hai.

---

## 2. Execution Context aur Hoisting
**Concept:** JavaScript code run hone se pehle "Memory Creation Phase" mein jata hai. Iska matlab JS engine pehle code scan karta hai aur variables/functions ko memory allocate karta hai, *code run karne se pehle*. Isko hi **Hoisting** kehte hain.

* **`var`:** Memory allocate hoti hai aur by-default `undefined` set ho jata hai. Agar aap declare karne se pehle use karenge, toh error nahi aayega, `undefined` milega.
* **`let` aur `const`:** Memory allocate toh hoti hai, par yeh "Temporal Dead Zone" (TDZ) mein chale jate hain. Yani declare hone se pehle use karenge toh `ReferenceError` aayega.
* **Functions:** Pura ka pura function block memory mein chala jata hai. Isliye function ko uski line se pehle bhi call kiya ja sakta hai.

---

## 3. Closures (With Practical Example)
**Concept:** Closure ka seedha matlab hai ki ek andar wala (inner) function apne bahar wale (outer) function ke variables ko yaad rakhta hai, chahe outer function execute hokar khatam hi kyun na ho gaya ho.

**Senior Level Practical Use (Memoization):**
Interviews mein puchte hain ki ek function banao jo slow ho, par dusri baar same input dene par turant result de de (Cache/Memoize kar le). Yahan Closure kaam aata hai!

```javascript
function memoizedAddition() {
  let cache = {}; // Yeh variable closure ke through inner function yaad rakhega

  return function(num) {
    if (num in cache) {
      console.log("Fetching from cache...");
      return cache[num];
    } else {
      console.log("Calculating slow result...");
      let result = num + 10; // Assume this is a heavy calculation
      cache[num] = result;
      return result;
    }
  };
}

const add = memoizedAddition(); // Outer function chal gaya aur cache={} ban gaya

console.log(add(5)); // Output: Calculating slow result... 15
console.log(add(5)); // Output: Fetching from cache... 15 (Turant answer de diya!)
```
**Explanation:** Yahan `memoizedAddition` function ek outer function hai jo apna kaam karke khatam ho gaya. Par jo inner function usne return kiya (`add`), usko abhi bhi yaad hai ki `cache` naam ka ek object exist karta hai. Isi magic ko **Closure** kehte hain.
