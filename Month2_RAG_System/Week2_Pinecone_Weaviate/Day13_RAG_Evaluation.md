# Day 13 — RAG Evaluation

RAG banane ke baad evaluate karna zaroori hai —
kya retrieval sahi hai? Kya answers accurate hain?

---

## 1. Why Evaluate?

```
Problem:
  RAG banaya → "Looks good!" → Deploy kiya
  Users complain: "Wrong answers!", "Hallucinations!"

Solution: Systematic evaluation before deployment

Evaluate karo:
  1. Retrieval quality — Sahi docs mil rahe hain?
  2. Answer relevance — Question ka answer hai?
  3. Faithfulness — Answer context se hai ya hallucinated?
  4. Context precision — Retrieved docs relevant hain?
```

---

## 2. Evaluation Metrics

```
Metric              Kya measure karta hai         Range
──────────────────  ────────────────────────────  ──────
Retrieval Recall    Relevant docs mein se kitne   0-1
                    retrieve hue?
Retrieval Precision Retrieved docs mein se kitne  0-1
                    actually relevant hain?
Answer Relevance    Answer question ka jawab deta  0-1
                    hai?
Faithfulness        Answer context se grounded     0-1
                    hai? (no hallucination)
Context Relevance   Retrieved context question     0-1
                    ke liye relevant hai?
```

---

## 3. Test Dataset Banao

```javascript
// Ground truth test cases
const testCases = [
  {
    question:        "How does Node.js handle concurrent requests?",
    expectedAnswer:  "event loop",           // Key term expected in answer
    relevantDocs:    ["event loop", "async"], // Docs jo retrieve hone chahiye
    category:        "nodejs"
  },
  {
    question:        "What is Redis used for?",
    expectedAnswer:  "caching",
    relevantDocs:    ["Redis", "cache"],
    category:        "database"
  },
  {
    question:        "How to secure an API?",
    expectedAnswer:  "JWT",
    relevantDocs:    ["JWT", "authentication", "rate limiting"],
    category:        "security"
  },
  {
    question:        "What is async/await?",
    expectedAnswer:  "promises",
    relevantDocs:    ["async", "await", "promises"],
    category:        "nodejs"
  },
  {
    question:        "How to improve Node.js performance?",
    expectedAnswer:  "worker threads",
    relevantDocs:    ["worker", "clustering", "streams"],
    category:        "performance"
  }
];
```

---

## 4. Retrieval Evaluation

```javascript
// Retrieval Recall: Relevant docs mein se kitne mile?
function retrievalRecall(retrieved, relevant) {
  if (relevant.length === 0) return 1;

  const hits = retrieved.filter(doc =>
    relevant.some(r => doc.text.toLowerCase().includes(r.toLowerCase()))
  );

  return hits.length / relevant.length;
}

// Retrieval Precision: Retrieved docs mein se kitne relevant?
function retrievalPrecision(retrieved, relevant) {
  if (retrieved.length === 0) return 0;

  const hits = retrieved.filter(doc =>
    relevant.some(r => doc.text.toLowerCase().includes(r.toLowerCase()))
  );

  return hits.length / retrieved.length;
}

// F1 Score: Precision + Recall balance
function f1Score(precision, recall) {
  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
}

// Test
async function evaluateRetrieval(testCases) {
  let totalRecall = 0, totalPrecision = 0;

  for (const tc of testCases) {
    const docs      = await retrieve(tc.question, 3);
    const recall    = retrievalRecall(docs, tc.relevantDocs);
    const precision = retrievalPrecision(docs, tc.relevantDocs);
    const f1        = f1Score(precision, recall);

    console.log(`Q: "${tc.question.slice(0, 40)}..."`);
    console.log(`  Recall: ${recall.toFixed(2)} | Precision: ${precision.toFixed(2)} | F1: ${f1.toFixed(2)}`);

    totalRecall    += recall;
    totalPrecision += precision;
  }

  const avgRecall    = totalRecall    / testCases.length;
  const avgPrecision = totalPrecision / testCases.length;

  console.log(`\nAverage Recall:    ${avgRecall.toFixed(2)}`);
  console.log(`Average Precision: ${avgPrecision.toFixed(2)}`);
  console.log(`Average F1:        ${f1Score(avgPrecision, avgRecall).toFixed(2)}`);
}
```

---

## 5. Answer Relevance Check

```javascript
// LLM se check karwao — answer relevant hai?
async function checkAnswerRelevance(question, answer) {
  const prompt = `Rate if this answer is relevant to the question.
Question: "${question}"
Answer: "${answer}"

Return JSON: { "relevant": true/false, "score": 0-10, "reason": "brief reason" }`;

  const res = await groq.chat.completions.create({
    model:           "llama-3.3-70b-versatile",
    messages:        [{ role: "user", content: prompt }],
    max_tokens:      100,
    temperature:     0,
    response_format: { type: "json_object" }
  });

  return JSON.parse(res.choices[0].message.content);
}

// Simple keyword check (faster, no API call)
function keywordRelevance(answer, expectedKeywords) {
  const answerLower = answer.toLowerCase();
  const hits = expectedKeywords.filter(kw =>
    answerLower.includes(kw.toLowerCase())
  );
  return hits.length / expectedKeywords.length;
}
```

---

## 6. Faithfulness Check (Hallucination Detection)

```javascript
// Kya answer context se hai ya hallucinated?
async function checkFaithfulness(answer, context) {
  const prompt = `Is this answer faithful to the context? Does it contain information NOT in the context?

Context: "${context}"
Answer: "${answer}"

Return JSON: {
  "faithful": true/false,
  "score": 0-10,
  "hallucinated_parts": ["any parts not in context"],
  "reason": "brief explanation"
}`;

  const res = await groq.chat.completions.create({
    model:           "llama-3.3-70b-versatile",
    messages:        [{ role: "user", content: prompt }],
    max_tokens:      200,
    temperature:     0,
    response_format: { type: "json_object" }
  });

  return JSON.parse(res.choices[0].message.content);
}
```

---

## 7. Complete Evaluation Suite

```javascript
async function evaluateRAG(testCases) {
  const results = [];

  for (const tc of testCases) {
    // Run RAG
    const ragResult = await rag(tc.question);

    // Metrics
    const recall    = retrievalRecall(ragResult.sources, tc.relevantDocs);
    const precision = retrievalPrecision(ragResult.sources, tc.relevantDocs);
    const kwScore   = keywordRelevance(ragResult.answer, [tc.expectedAnswer]);

    results.push({
      question:  tc.question,
      answer:    ragResult.answer,
      recall,
      precision,
      kwScore,
      sources:   ragResult.sources.length
    });
  }

  // Summary
  const avg = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;

  console.log("\n=== RAG Evaluation Summary ===");
  console.log(`Avg Recall:    ${avg(results.map(r => r.recall)).toFixed(2)}`);
  console.log(`Avg Precision: ${avg(results.map(r => r.precision)).toFixed(2)}`);
  console.log(`Avg KW Score:  ${avg(results.map(r => r.kwScore)).toFixed(2)}`);

  return results;
}
```

---

## 8. Common RAG Failures

```
Failure 1: Wrong docs retrieved
  Cause:    Chunk size too large, embedding model weak
  Fix:      Smaller chunks, better model, metadata filter

Failure 2: Answer not in context
  Cause:    topK too small, threshold too high
  Fix:      Increase topK, lower threshold

Failure 3: Hallucination
  Cause:    LLM adds info not in context
  Fix:      Stricter prompt ("ONLY use context")
            Lower temperature (0.1-0.3)

Failure 4: Irrelevant answer
  Cause:    Context not relevant to question
  Fix:      Better chunking, MMR retrieval

Failure 5: Truncated context
  Cause:    Too many chunks → context window overflow
  Fix:      Limit topK, summarize context
```

---

## 9. Quick Summary

```
Evaluation metrics:
  Recall:    Relevant docs mein se kitne mile (0-1)
  Precision: Retrieved docs mein se kitne relevant (0-1)
  F1:        Recall + Precision balance
  KW Score:  Expected keywords in answer
  Faithful:  Answer context se grounded hai?

Good RAG scores:
  Recall:    > 0.7
  Precision: > 0.6
  KW Score:  > 0.5
  Faithful:  > 0.8

Improvement tips:
  Low recall    → Increase topK, lower threshold
  Low precision → Better chunking, metadata filter
  Hallucination → Stricter prompt, lower temperature
```

---

## 10. Practice Tasks

### Task 1: Retrieval Evaluation
```javascript
// 5 test cases banao
// retrievalRecall + retrievalPrecision calculate karo
// Average scores print karo
```

### Task 2: Answer Quality
```javascript
// keywordRelevance() implement karo
// 5 questions ke answers evaluate karo
// Score < 0.5 wale questions identify karo
```

### Task 3: Hallucination Test
```javascript
// Out-of-context questions test karo:
// "What is the best pizza recipe?"
// "Who won the cricket world cup?"
// "What is the weather today?"
// Kya RAG "I don't know" kehta hai?
```

---

Kal Day 14 — Week 2 Revision + Tech FAQ Bot project.
