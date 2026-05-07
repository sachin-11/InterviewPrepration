# Day 18 — PDF Q&A API

Express server banayenge — PDF upload karo aur questions poochho.

---

## 1. API Endpoints

```
POST /upload        → PDF upload + ingest karo
POST /ask           → Question poochho
GET  /pdfs          → Uploaded PDFs list
DELETE /pdfs/:name  → PDF delete karo
GET  /health        → Server status
```

---

## 2. Multer — File Upload

```javascript
import multer from 'multer';
import path from 'path';

// Upload folder
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Route mein use karo
app.post('/upload', upload.single('pdf'), handler);
```

---

## 3. POST /upload Response

```json
{
  "success": true,
  "pdfName": "javascript-guide",
  "pages": 5,
  "chunks": 12,
  "message": "PDF ingested successfully"
}
```

---

## 4. POST /ask Request/Response

```json
// Request
{
  "question": "What is async/await?",
  "pdfName": "javascript-guide",
  "topK": 3
}

// Response
{
  "answer": "async/await is syntactic sugar over Promises...",
  "sources": [
    { "text": "async/await makes async code...", "pageNum": 3, "score": 0.821 }
  ],
  "pdfName": "javascript-guide"
}
```

---

## 5. Postman Testing

```
POST http://localhost:3001/upload
  Body → form-data → Key: pdf, Type: File → Select PDF

POST http://localhost:3001/ask
  Body → raw → JSON:
  { "question": "What is async/await?", "pdfName": "javascript-guide" }

GET http://localhost:3001/pdfs

GET http://localhost:3001/health
```

---

Kal Day 19 mein UI banayenge — drag & drop upload + chat interface.
