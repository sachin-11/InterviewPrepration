# 📅 Week 1 & 2: Day-by-Day Foundation Reset Plan
**Topics**: Arrays, Strings, HashMap, HashSet, Sliding Window, Two Pointers  
**Daily Time Commitment**: 3-4 hours  
**Total Problems**: 15 LeetCode + Theory + Node.js Practice

---

## 🗓️ WEEK 1 OVERVIEW

```
Day 1 → Array Basics + HashMap Theory
Day 2 → HashMap Problems (Two Sum, Group Anagrams)
Day 3 → HashSet + Prefix Sum Problems
Day 4 → Sliding Window — Fixed Size
Day 5 → Sliding Window — Variable Size
Day 6 → Revision + 2 Mixed Problems
Day 7 → REST DAY (review karo, notes banao)
```

---

## 📆 DAY 1 — Array Fundamentals + HashMap Theory
**Daily Time**: ~3 hours

### 🎯 Aaj Ka Goal:
Array ki core operations samajhna aur HashMap kya hota hai ye deeply samajhna.

---

### 📖 Theory (1 hour):

#### 1. Array — Core Concepts:
```
- Array ek contiguous memory block hota hai
- Access: O(1) — index se direct access
- Search: O(n) — unsorted mein
- Insert/Delete at end: O(1)
- Insert/Delete at middle: O(n) — elements shift hote hain
```

#### 2. HashMap — Internally Kaise Kaam Karta Hai:
```
HashMap = Array of Buckets + Hash Function

Step 1: key ko hash function mein daalo → index milta hai
        hashCode("name") → 42 → bucket[42]

Step 2: Us bucket mein key-value pair store hota hai

Collision kya hota hai?
  Jab do alag keys ka same bucket index aaye:
  → Chaining (Linked List) ya Open Addressing se handle hota hai

Average Case: O(1) get/put
Worst Case:   O(n) — agar saari keys ek hi bucket mein jayein
```

#### 3. Time Complexity Quick Reference (YAD KARO):
```
Operation    | Array  | HashMap | HashSet
-------------|--------|---------|--------
Access       | O(1)   | O(1)    | -
Search       | O(n)   | O(1)    | O(1)
Insert       | O(1)*  | O(1)    | O(1)
Delete       | O(n)   | O(1)    | O(1)
```

---

### 💻 Node.js Coding Practice (1 hour):

HashMap aur Array ke basic operations khud likhke dekho:

```javascript
// ========== HashMap Basic Operations ==========
const map = new Map();

// Add karna
map.set("name", "Sachin");
map.set("age", 7);

// Get karna
console.log(map.get("name")); // "Sachin"

// Check karna
console.log(map.has("age")); // true

// Delete karna
map.delete("age");

// Iterate karna
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// ========== Common Pattern: Frequency Count ==========
function frequencyCount(arr) {
  const freq = new Map();
  
  for (const num of arr) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }
  
  return freq;
}

// Example: [1, 2, 2, 3, 3, 3]
// Result: Map { 1 → 1, 2 → 2, 3 → 3 }
console.log(frequencyCount([1, 2, 2, 3, 3, 3]));
```

---

### 🧩 LeetCode Problem — Day 1:
**Problem 1: Contains Duplicate** (🟢 Easy)  
Link: https://leetcode.com/problems/contains-duplicate/

#### Approach:
```javascript
// Naive Approach: O(n²) — DO NOT use in interview
// Optimal Approach: HashMap/HashSet — O(n)

var containsDuplicate = function(nums) {
  const seen = new Set();
  
  for (const num of nums) {
    if (seen.has(num)) return true; // Duplicate mila!
    seen.add(num);
  }
  
  return false;
};

// Test karo:
console.log(containsDuplicate([1, 2, 3, 1])); // true
console.log(containsDuplicate([1, 2, 3, 4])); // false
```

**Interview mein kya bolna hai:**
> "Main ek HashSet use karunga. Har element ko scan karte waqt check karunga ki ye pehle se set mein hai ya nahi. Agar hai toh duplicate return true, nahi hai toh set mein add karo. Time complexity O(n), Space O(n)."

---

### 📝 Day 1 End-of-Day Checklist:
```
□ HashMap internally kaise kaam karta hai — samajh aaya?
□ O(1) vs O(n) difference — clear hai?
□ Contains Duplicate — khud likha aur submit kiya?
□ Notes banaye (notebook ya digital)?
```

---
---

## 📆 DAY 2 — HashMap Deep Problems
**Daily Time**: ~3.5 hours

### 🎯 Aaj Ka Goal:
HashMap ko real problems mein use karna — Two Sum aur Group Anagrams.

---

### 📖 Theory (30 min):

#### Key Insight — "HashMap se Complement Dhundho" Pattern:
```
Bohot saare array problems mein ye pattern kaam karta hai:

Problem: "X dhundho"
Solution: "X ka complement pehle se store karo HashMap mein"

Example Two Sum:
  Target = 9, Current element = 4
  Complement = 9 - 4 = 5
  "Kya 5 pehle aaya tha?" → HashMap mein check karo!
```

---

### 💻 LeetCode Problems — Day 2:

**Problem 2: Two Sum** (🟢 Easy)  
Link: https://leetcode.com/problems/two-sum/

```javascript
var twoSum = function(nums, target) {
  const map = new Map(); // num → index
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i]; // Dono indices return karo
    }
    
    map.set(nums[i], i); // Current num aur uska index store karo
  }
  
  return []; // Solution guaranteed hoga
};

// Test:
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));      // [1, 2]
```

**Interview explanation:**
> "Ek HashMap banaunga jahan num → index store karunga. Har element ke liye complement = target - current nikaalunga. Agar complement map mein hai, solution mila. Nahi hai toh current ko map mein daalo. O(n) time, O(n) space."

---

**Problem 3: Group Anagrams** (🟡 Medium)  
Link: https://leetcode.com/problems/group-anagrams/

#### Key Insight:
> Anagrams ko sort karo → same sorted string milegi. Ye sorted string HashMap ki **key** banega!

```javascript
var groupAnagrams = function(strs) {
  const map = new Map(); // sorted_str → [original strings]
  
  for (const str of strs) {
    // "eat" → sort → "aet" (key)
    // "tea" → sort → "aet" (same key! same group)
    const key = str.split('').sort().join('');
    
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(str);
  }
  
  return Array.from(map.values());
};

// Test:
console.log(groupAnagrams(["eat","tea","tan","ate","nat","bat"]));
// [["eat","tea","ate"],["tan","nat"],["bat"]]
```

**Time Complexity Analysis:**
```
n = strings ki count
k = ek string ki max length

Sorting each string: O(k log k)
Total: O(n * k log k)
Space: O(n * k)
```

---

### 📝 Day 2 End-of-Day Checklist:
```
□ "Complement pattern" samajh aaya?
□ Two Sum — bina dekhe khud likha?
□ Group Anagrams — sorted key trick clear hai?
□ Dono problems submit karke accepted aaya?
```

---
---

## 📆 DAY 3 — HashSet + Prefix Sum
**Daily Time**: ~3.5 hours

### 🎯 Aaj Ka Goal:
HashSet ka use aur Prefix Sum technique samajhna.

---

### 📖 Theory (45 min):

#### 1. Prefix Sum Kya Hota Hai:
```
Array: [1, 2, 3, 4, 5]
Prefix: [1, 3, 6, 10, 15]  ← har index tak ka total sum

Kisi bhi range [l, r] ka sum = prefix[r] - prefix[l-1]

Example: range [1, 3] ka sum = prefix[3] - prefix[0]
                              = 10 - 1 = 9  ✅
```

#### 2. HashSet vs HashMap:
```
HashSet → Sirf keys store karta hai (no values)
         Kab use karo: "exists or not?" check karna ho

HashMap → Key-Value pairs store karta hai  
         Kab use karo: "key ke sath kuch information" store karni ho
```

---

### 💻 LeetCode Problems — Day 3:

**Problem 4: Longest Consecutive Sequence** (🟡 Medium)  
Link: https://leetcode.com/problems/longest-consecutive-sequence/

```javascript
// Key Insight: Sequence ki start wo number hoti hai
// jiska (num - 1) Set mein NA ho!

var longestConsecutive = function(nums) {
  const numSet = new Set(nums); // O(1) lookup ke liye
  let maxLen = 0;
  
  for (const num of numSet) {
    // Ye number ek sequence ki START hai?
    if (!numSet.has(num - 1)) {
      let currentNum = num;
      let currentLen = 1;
      
      // Sequence aage kitni barhti hai?
      while (numSet.has(currentNum + 1)) {
        currentNum++;
        currentLen++;
      }
      
      maxLen = Math.max(maxLen, currentLen);

  }
  
  return maxLen;
};
}

// Test:
console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // 4 → [1,2,3,4]
console.log(longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])); // 9
```

---

**Problem 5: Product of Array Except Self** (🟡 Medium)  
Link: https://leetcode.com/problems/product-of-array-except-self/

```javascript
// Key Insight: Division use mat karo!
// Left products * Right products = Answer

var productExceptSelf = function(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);
  
  // Left pass: result[i] = nums[0] * nums[1] * ... * nums[i-1]
  let leftProduct = 1;
  for (let i = 0; i < n; i++) {
    result[i] = leftProduct;
    leftProduct *= nums[i];
  }
  
  // Right pass: result[i] *= nums[i+1] * ... * nums[n-1]
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= rightProduct;
    rightProduct *= nums[i];
  }
  
  return result;
};

// Test:
console.log(productExceptSelf([1, 2, 3, 4])); // [24, 12, 8, 6]
```

---

### 📝 Day 3 End-of-Day Checklist:
```
□ Prefix Sum concept — clear hai?
□ Longest Consecutive — "start dhundho" trick samajh aaya?
□ Product Except Self — Left*Right approach bina division?
□ Dono problems submit karke accepted aaya?
```

---
---

## 📆 DAY 4 — Sliding Window (Fixed Size)
**Daily Time**: ~3.5 hours

### 🎯 Aaj Ka Goal:
Fixed-size sliding window pattern master karna.

---

### 📖 Theory (45 min):

#### Sliding Window Kya Hota Hai:
```
Naive approach (O(n²)):          Sliding Window (O(n)):
  Har subarray check karo           Window ko slide karo!
  [1,2,3], [2,3,4], [3,4,5]...     
                                    Left       Right
  ❌ SLOW!                           ↓           ↓
                                    [1, 2, 3, 4, 5]
                                     Window = size 3
                                    
                                    Step 1: [1,2,3] → sum = 6
                                    Step 2: -1, +4 → [2,3,4] → sum = 9
                                    Step 3: -2, +5 → [3,4,5] → sum = 12
```

#### Fixed Window Template:
```javascript
function fixedSlidingWindow(arr, k) {
  let windowSum = 0;
  let maxSum = -Infinity;
  
  // Step 1: Pehla window banao (size k)
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  maxSum = windowSum;
  
  // Step 2: Window slide karo
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i];        // Naya element add karo (right)
    windowSum -= arr[i - k];   // Pehla element hatao (left)
    maxSum = Math.max(maxSum, windowSum);
  }
  
  return maxSum;
}
```

---

### 💻 LeetCode Problems — Day 4:

**Problem 6: Top K Frequent Elements** (🟡 Medium)  
Link: https://leetcode.com/problems/top-k-frequent-elements/

```javascript
// Approach: HashMap + Bucket Sort (O(n) solution!)

var topKFrequent = function(nums, k) {
  // Step 1: Frequency count karo
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }
  
  // Step 2: Bucket sort — index = frequency
  // bucket[i] = list of numbers with frequency i
  const bucket = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, count] of freq) {
    bucket[count].push(num);
  }
  
  // Step 3: Highest frequency se top k nikalo
  const result = [];
  for (let i = bucket.length - 1; i >= 0 && result.length < k; i--) {
    result.push(...bucket[i]);
  }
  
  return result.slice(0, k);
};

// Test:
console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // [1, 2]
console.log(topKFrequent([1], 1));                 // [1]
```

---

**Problem 7: Valid Anagram** (🟢 Easy)  
Link: https://leetcode.com/problems/valid-anagram/

```javascript
var isAnagram = function(s, t) {
  if (s.length !== t.length) return false;
  
  const count = new Map();
  
  // s ke characters add karo
  for (const char of s) {
    count.set(char, (count.get(char) || 0) + 1);
  }
  
  // t ke characters ghatao
  for (const char of t) {
    if (!count.has(char) || count.get(char) === 0) return false;
    count.set(char, count.get(char) - 1);
  }
  
  return true;
};

// Test:
console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("rat", "car"));         // false
```

---

### 📝 Day 4 End-of-Day Checklist:
```
□ Fixed sliding window template — yaad hai?
□ Top K Frequent — Bucket Sort trick clear?
□ Valid Anagram — frequency counter approach?
□ Dono problems submit?
```

---
---

## 📆 DAY 5 — Sliding Window (Variable Size)
**Daily Time**: ~4 hours (sabse important din!)

### 🎯 Aaj Ka Goal:
Variable-size sliding window — ye pattern senior interviews mein most frequently aata hai!

---

### 📖 Theory (45 min):

#### Variable Window vs Fixed Window:
```
Fixed Window:  k given hota hai, window size same rehti hai
Variable Window: Condition di hoti hai, window badhao ya ghataao

Variable Window Template:
  left = 0
  right = 0 (ya for loop mein)
  
  Jab tak right < n:
    → right expand karo (add element)
    → Jab condition violate ho → left shrink karo (remove element)
    → Answer update karo
```

---

### 💻 LeetCode Problems — Day 5:

**Problem 8: Longest Substring Without Repeating Characters** (🟡 Medium)  
Link: https://leetcode.com/problems/longest-substring-without-repeating-characters/

```javascript
var lengthOfLongestSubstring = function(s) {
  const seen = new Map(); // char → last seen index
  let left = 0;
  let maxLen = 0;
  
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    
    // Agar char pehle aaya tha AND wo window ke andar hai
    if (seen.has(char) && seen.get(char) >= left) {
      left = seen.get(char) + 1; // Left ko jump karo
    }
    
    seen.set(char, right); // Current position update karo
    maxLen = Math.max(maxLen, right - left + 1);
  }
  
  return maxLen;
};

// Test:
console.log(lengthOfLongestSubstring("abcabcbb")); // 3 → "abc"
console.log(lengthOfLongestSubstring("bbbbb"));    // 1 → "b"
console.log(lengthOfLongestSubstring("pwwkew"));   // 3 → "wke"
```

---

**Problem 9: Longest Repeating Character Replacement** (🟡 Medium)  
Link: https://leetcode.com/problems/longest-repeating-character-replacement/

```javascript
// Key Insight: Window valid hai agar:
// (window_size - most_frequent_char_count) <= k

var characterReplacement = function(s, k) {
  const count = new Array(26).fill(0);
  let left = 0;
  let maxFreq = 0;
  let maxLen = 0;
  
  for (let right = 0; right < s.length; right++) {
    const idx = s.charCodeAt(right) - 65; // 'A' = 65
    count[idx]++;
    maxFreq = Math.max(maxFreq, count[idx]);
    
    // Window invalid? Left shrink karo
    while ((right - left + 1) - maxFreq > k) {
      count[s.charCodeAt(left) - 65]--;
      left++;
    }
    
    maxLen = Math.max(maxLen, right - left + 1);
  }
  
  return maxLen;
};

// Test:
console.log(characterReplacement("ABAB", 2)); // 4 → "AAAA" ya "BBBB"
console.log(characterReplacement("AABABBA", 1)); // 4
```

---

**Problem 10 (HARD): Minimum Window Substring** (🔴 Hard)  
Link: https://leetcode.com/problems/minimum-window-substring/

```javascript
// Key Insight: need Map (t ke chars) aur window Map
// "formed" counter track karta hai kitne chars ki requirement poori

var minWindow = function(s, t) {
  if (t.length > s.length) return "";
  
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  
  let required = need.size; // Kitne unique chars chahiye
  let formed = 0;           // Kitne satisfy ho gaye
  
  const windowCount = new Map();
  let left = 0;
  let minLen = Infinity;
  let minLeft = 0;
  
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    windowCount.set(c, (windowCount.get(c) || 0) + 1);
    
    // Agar ye char ki requirement poori ho gayi
    if (need.has(c) && windowCount.get(c) === need.get(c)) {
      formed++;
    }
    
    // Saari requirements poori? → Window shrink karo
    while (formed === required) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        minLeft = left;
      }
      
      const leftChar = s[left];
      windowCount.set(leftChar, windowCount.get(leftChar) - 1);
      if (need.has(leftChar) && windowCount.get(leftChar) < need.get(leftChar)) {
        formed--;
      }
      left++;
    }
  }
  
  return minLen === Infinity ? "" : s.slice(minLeft, minLeft + minLen);
};

// Test:
console.log(minWindow("ADOBECODEBANC", "ABC")); // "BANC"
console.log(minWindow("a", "a"));               // "a"
```

---

### 📝 Day 5 End-of-Day Checklist:
```
□ Variable sliding window template — yaad hai?
□ Problem 8 (Longest Substring) — khud likha?
□ Problem 9 (Character Replacement) — window validity condition clear?
□ Problem 10 (Hard) — try kiya? (accept nahi hua toh theek hai, solution samjha?)
```

---
---

## 📆 DAY 6 — Revision + 2 Mixed Problems
**Daily Time**: ~3 hours

### 🎯 Aaj Ka Goal:
Week 1 ke saare concepts revise karna + 2 new problems solve karna.

---

### 📖 Morning Revision (30 min):

#### Week 1 Quick Recap:
```
Day 1: HashMap Internals, Contains Duplicate (HashSet)
Day 2: Complement Pattern (Two Sum), Sorting Key (Group Anagrams)
Day 3: HashSet Sequence (Consecutive), Left*Right (Product Except Self)
Day 4: Bucket Sort Frequency (Top K), Frequency Counter (Valid Anagram)
Day 5: Variable Window (Longest Substring, Min Window)
```

#### Pattern Recognition Quiz (khud test karo):
```
Q: Array mein 2 numbers ka sum = target dhundho?
A: _____________ (HashMap complement pattern)

Q: Duplicate element check karna hai?
A: _____________ (HashSet)

Q: Longest/shortest subarray/substring dhundho?
A: _____________ (Sliding Window)

Q: Elements ko group karna hai same category mein?
A: _____________ (HashMap with sorted/canonical key)
```

---

### 💻 LeetCode Problems — Day 6:

**Problem 11: Encode and Decode Strings** (🟡 Medium)  
Link: https://leetcode.com/problems/encode-and-decode-strings/

```javascript
// Tricky! Network pe strings bhejne ke liye encode/decode karo
// Approach: length#string format use karo

class Codec {
  encode(strs) {
    return strs.map(s => `${s.length}#${s}`).join('');
  }
  
  decode(s) {
    const result = [];
    let i = 0;
    
    while (i < s.length) {
      let j = i;
      while (s[j] !== '#') j++;              // '#' tak jao
      const len = parseInt(s.slice(i, j));   // Length nikalo
      result.push(s.slice(j + 1, j + 1 + len)); // String nikalo
      i = j + 1 + len;                       // Next string pe jao
    }
    
    return result;
  }
}

// Test:
const codec = new Codec();
const encoded = codec.encode(["hello", "world"]);
console.log(encoded); // "5#hello5#world"
console.log(codec.decode(encoded)); // ["hello", "world"]
```

---

**Problem 12: Maximum Subarray (Kadane's Algorithm)** (🟡 Medium)  
Link: https://leetcode.com/problems/maximum-subarray/

```javascript
// Kadane's Algorithm — DP + Greedy hybrid
// Key Insight: Agar running sum negative ho jaye, reset karo!

var maxSubArray = function(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    // Agar currentSum negative hai, naya start karo
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  return maxSum;
};

// Test:
console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6 → [4,-1,2,1]
console.log(maxSubArray([1]));                               // 1
console.log(maxSubArray([5, 4, -1, 7, 8]));                 // 23
```

---

### 📝 Day 6 End-of-Day Checklist:
```
□ Week 1 ke saare patterns ek baar revise kiye?
□ Encode/Decode — length prefix trick clear?
□ Kadane's Algorithm — "reset when negative" logic?
□ Kitne problems total solve hue? (Target: 12-13 minimum)
```

---
---

## 📆 DAY 7 — REST + NOTES DAY
**Daily Time**: 1-2 hours only

### 🎯 Aaj Ka Goal:
Mental break + organized notes banana.

### Activities:
```
✅ Week 1 ke saare problems ek baar NeetCode pe dekho (video solutions)
✅ Personal "Pattern Cheat Sheet" banao
✅ Koi 1-2 problems jo galat hue, unhe dobara karo bina dekhe
✅ KUCH AUR MAT PARO — rest lo! 🧘
```

### Apna Pattern Cheat Sheet Banao:
```
My Week 1 Patterns:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pattern: HashMap Complement
Problems: Two Sum
When to use: "Find 2 elements that add to X"
Template: complement = target - current; check in map

Pattern: HashSet Existence Check  
Problems: Contains Duplicate, Longest Consecutive
When to use: "Does X exist?" type questions
Template: if (set.has(x)) → found

Pattern: Fixed Sliding Window
Problems: Top K (indirectly)
Template: sum += arr[right]; sum -= arr[right-k]

Pattern: Variable Sliding Window
Problems: Longest Substring, Min Window
Template: expand right, shrink left when invalid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---
---

## 🗓️ WEEK 2 OVERVIEW

```
Day 8  → Two Pointer (Opposite Direction)
Day 9  → Two Pointer (Same Direction) + 3Sum
Day 10 → Container With Most Water + String Problems
Day 11 → Hard Problem Day (Trapping Rain Water)
Day 12 → Mixed Practice + Speed Coding
Day 13 → Mock Interview Simulation
Day 14 → Week 2 Revision + REST
```

---

## 📆 DAY 8 — Two Pointers (Opposite Direction)
**Daily Time**: ~3.5 hours

### 📖 Theory (30 min):

#### Two Pointer — Opposite Direction:
```
Array ke dono ends se pointers shuru hote hain:

left = 0, right = n-1

Condition ke hisaab se ek pointer ko move karo:
  - Sum too large → right--
  - Sum too small → left++
  - Found answer → return

Kab use hota hai?
  - Sorted array mein pair dhundna
  - Palindrome check
  - Merging sorted arrays
```

---

### 💻 LeetCode Problems — Day 8:

**Problem 13: Valid Palindrome** (🟢 Easy)  
Link: https://leetcode.com/problems/valid-palindrome/

```javascript
var isPalindrome = function(s) {
  // Sirf alphanumeric rakhna, lowercase karna
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let left = 0;
  let right = cleaned.length - 1;
  
  while (left < right) {
    if (cleaned[left] !== cleaned[right]) return false;
    left++;
    right--;
  }
  
  return true;
};

// Test:
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car"));                     // false
```

---

**Problem 14: Two Sum II — Input Array Is Sorted** (🟡 Medium)  
Link: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/

```javascript
var twoSum = function(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    
    if (sum === target) return [left + 1, right + 1]; // 1-indexed
    else if (sum < target) left++;  // Sum chota → left badhao
    else right--;                   // Sum bada → right ghataao
  }
  
  return [];
};

// Test:
console.log(twoSum([2, 7, 11, 15], 9));  // [1, 2]
console.log(twoSum([2, 3, 4], 6));       // [1, 3]
```

---

## 📆 DAY 9 — 3Sum + Two Pointer Advanced
**Daily Time**: ~4 hours

### 💻 LeetCode Problems — Day 9:

**Problem 15: 3Sum** (🟡 Medium — Most Asked!)  
Link: https://leetcode.com/problems/3sum/

```javascript
// Key Insight: Sort karo, phir for loop + two pointer

var threeSum = function(nums) {
  nums.sort((a, b) => a - b); // Pehle sort karo
  const result = [];
  
  for (let i = 0; i < nums.length - 2; i++) {
    // Duplicate skip karo
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    
    let left = i + 1;
    let right = nums.length - 1;
    
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        // Duplicates skip karo
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  
  return result;
};

// Test:
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [[-1,-1,2],[-1,0,1]]
console.log(threeSum([0, 0, 0]));              // [[0,0,0]]
```

---

## 📆 DAY 10 — Container With Most Water
**Daily Time**: ~3.5 hours

**Problem 16: Container With Most Water** (🟡 Medium)  
Link: https://leetcode.com/problems/container-with-most-water/

```javascript
// Key Insight: Choti height hi bottleneck hai!
// Choti height wala pointer move karo

var maxArea = function(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;
  
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    const water = width * h;
    
    maxWater = Math.max(maxWater, water);
    
    // Choti height wala pointer move karo
    if (height[left] < height[right]) left++;
    else right--;
  }
  
  return maxWater;
};

// Test:
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49
console.log(maxArea([1, 1]));                        // 1
```

---

## 📆 DAY 11 — Hard Problem Day (Trapping Rain Water)
**Daily Time**: ~4 hours

### 📖 Theory (30 min):

#### Trapping Rain Water — 3 Approaches:
```
Approach 1: Brute Force O(n²) — DON'T use
Approach 2: Precomputed max arrays O(n) time, O(n) space
Approach 3: Two Pointer O(n) time, O(1) space ← BEST!

Key Insight for Two Pointer:
  Water at position i = min(maxLeft, maxRight) - height[i]
  
  Agar maxLeft < maxRight:
    Left side ka answer confirm hai → process left
  Else:
    Right side ka answer confirm hai → process right
```

**Problem 17: Trapping Rain Water** (🔴 Hard)  
Link: https://leetcode.com/problems/trapping-rain-water/

```javascript
var trap = function(height) {
  let left = 0;
  let right = height.length - 1;
  let maxLeft = 0;
  let maxRight = 0;
  let totalWater = 0;
  
  while (left < right) {
    if (height[left] < height[right]) {
      // Left side process karo
      if (height[left] >= maxLeft) {
        maxLeft = height[left]; // New max mila
      } else {
        totalWater += maxLeft - height[left]; // Water trap hua!
      }
      left++;
    } else {
      // Right side process karo
      if (height[right] >= maxRight) {
        maxRight = height[right]; // New max mila
      } else {
        totalWater += maxRight - height[right]; // Water trap hua!
      }
      right--;
    }
  }
  
  return totalWater;
};

// Test:
console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6
console.log(trap([4, 2, 0, 3, 2, 5]));                     // 9
```

---

## 📆 DAY 12 — Speed Coding Practice
**Daily Time**: ~3 hours

### 🎯 Aaj Ka Goal:
Pehle se solve kiye problems ko bina dekhe timed practice karna.

```
Practice Schedule:
┌─────────────────────────────────────────┐
│ 10 min: Two Sum (Easy - warmup)         │
│ 20 min: Group Anagrams (Medium)         │
│ 25 min: Longest Substring (Medium)      │
│ 30 min: 3Sum (Medium)                   │
│ 15 min: Review + Optimize               │
└─────────────────────────────────────────┘

Timer lagao! Speed bahut important hai.
Easy: 10 min max
Medium: 20-25 min max
Hard: 35-45 min max
```

---

## 📆 DAY 13 — Mock Interview Simulation
**Daily Time**: ~2-3 hours

### 🎯 Aaj Ka Goal:
Real interview jaisi practice karna — bol bolke solve karo!

#### Mock Interview Rules:
```
1. Problem padho, 2-3 min soch ke approach batao (LOUD)
2. Brute force pehle batao, phir optimize karo
3. Code likhte waqt explain karte jao
4. Complexity analyze karo (time + space)
5. 2-3 test cases khud banao aur chalao
```

#### Interview Sentence Templates:
```
"Pehle naive approach sochta hoon..."
"Isme main HashMap use kar sakta hoon kyunki..."
"Time complexity O(n) hogi kyunki..."
"Edge cases: empty array, single element, all same..."
"Ye approach better hai kyunki..."
```

### Problems for Mock (select 2):
- Two Sum (10 min)
- Longest Substring Without Repeating (25 min)
- Container With Most Water (25 min)

---

## 📆 DAY 14 — Final Revision + REST
**Daily Time**: 1-2 hours

### Week 1-2 Complete Problem List:

| # | Problem | Level | Solved? | Pattern |
|---|---------|-------|---------|---------|
| 1 | Contains Duplicate | 🟢 Easy | □ | HashSet |
| 2 | Two Sum | 🟢 Easy | □ | HashMap Complement |
| 3 | Group Anagrams | 🟡 Medium | □ | HashMap + Sort Key |
| 4 | Longest Consecutive Sequence | 🟡 Medium | □ | HashSet |
| 5 | Product Except Self | 🟡 Medium | □ | Prefix/Suffix |
| 6 | Top K Frequent | 🟡 Medium | □ | Bucket Sort |
| 7 | Valid Anagram | 🟢 Easy | □ | Frequency Map |
| 8 | Longest Substring | 🟡 Medium | □ | Variable Window |
| 9 | Character Replacement | 🟡 Medium | □ | Variable Window |
| 10 | Minimum Window Substring | 🔴 Hard | □ | Variable Window |
| 11 | Encode/Decode Strings | 🟡 Medium | □ | String Design |
| 12 | Maximum Subarray | 🟡 Medium | □ | Kadane's |
| 13 | Valid Palindrome | 🟢 Easy | □ | Two Pointer |
| 14 | Two Sum II Sorted | 🟡 Medium | □ | Two Pointer |
| 15 | 3Sum | 🟡 Medium | □ | Two Pointer |
| 16 | Container With Most Water | 🟡 Medium | □ | Two Pointer |
| 17 | Trapping Rain Water | 🔴 Hard | □ | Two Pointer |

**Target: 15+ problems solved by Day 14**

---

## 📊 WEEK 1-2 SUMMARY TABLE

| Week | Days | Topics | Problems |
|------|------|--------|----------|
| Week 1 | Day 1-7 | HashMap, HashSet, Prefix Sum, Sliding Window | 10 problems |
| Week 2 | Day 8-14 | Two Pointers, Advanced Window, Speed Practice | 7 problems |

---

## 💡 PRO TIPS FOR WEEK 1-2

```
✅ DO:
   → Har problem ko loud thinking ke saath solve karo
   → Brute force pehle, phir optimize
   → Time complexity hamesha batao
   → Edge cases sochte rehna (empty, null, single element)

❌ DON'T:
   → Solution seedha copy mat karo — samjho pehle
   → Ek problem pe 1 hour se zyada mat rukon
   → Skip mat karo theory — patterns theory se aate hain
   → Week 3 ke topics Week 1-2 mein mat padhna
```

---
*Week 1-2 Plan | Senior Backend Developer Interview Prep | 2026*
