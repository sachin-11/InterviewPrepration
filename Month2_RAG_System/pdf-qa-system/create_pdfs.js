// Create 3 sample PDFs for Day 17 practice
import PDFDocument from 'pdfkit';
import fs from 'fs';

function createPDF(filename, title, chapters) {
  const doc = new PDFDocument();
  const out = fs.createWriteStream(filename);
  doc.pipe(out);

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown(2);

  chapters.forEach((ch, i) => {
    if (i > 0) doc.addPage();
    doc.fontSize(14).text(ch.title, { underline: true });
    doc.moveDown();
    doc.fontSize(11).text(ch.content, { align: 'justify' });
    doc.moveDown();
    doc.fontSize(9).text(`Page ${i+1}`, { align: 'right' });
  });

  doc.end();
  return new Promise(r => out.on('finish', r));
}

// PDF 1: JavaScript Guide
await createPDF('./javascript-guide.pdf', 'JavaScript Complete Guide', [
  { title: 'Variables and Data Types',
    content: 'JavaScript has var, let, and const for variable declaration. let is block-scoped and preferred over var. const creates immutable bindings. Data types include string, number, boolean, null, undefined, symbol, and object. Use typeof operator to check data types at runtime.' },
  { title: 'Functions and Closures',
    content: 'Functions are first-class citizens in JavaScript. Arrow functions provide concise syntax with lexical this binding. Closures allow functions to access variables from their outer scope even after the outer function returns. Higher-order functions take or return other functions.' },
  { title: 'Promises and Async/Await',
    content: 'Promises represent eventual completion or failure of async operations. Chain .then() for success and .catch() for errors. async/await makes async code look synchronous. Promise.all runs multiple promises in parallel. Always handle promise rejections to avoid unhandled errors.' },
  { title: 'ES6+ Features',
    content: 'ES6 introduced destructuring, spread operator, template literals, and default parameters. Classes provide syntactic sugar over prototype-based inheritance. Modules use import/export for code organization. Optional chaining (?.) safely accesses nested properties.' },
  { title: 'Error Handling',
    content: 'Use try/catch/finally for synchronous error handling. Throw custom Error objects with meaningful messages. In async code, use try/catch with await or .catch() with promises. Create custom error classes extending Error for specific error types.' },
]);

// PDF 2: Database Guide
await createPDF('./database-guide.pdf', 'Database Design Guide', [
  { title: 'Relational Databases',
    content: 'Relational databases store data in tables with rows and columns. SQL is the standard language for querying relational data. Primary keys uniquely identify rows. Foreign keys create relationships between tables. ACID properties ensure data integrity in transactions.' },
  { title: 'NoSQL Databases',
    content: 'NoSQL databases offer flexible schemas for unstructured data. MongoDB stores documents as JSON-like objects. Redis is an in-memory key-value store for caching. Cassandra handles large-scale distributed data. Choose NoSQL when you need horizontal scaling or flexible schemas.' },
  { title: 'Indexing Strategies',
    content: 'Indexes speed up query performance by creating lookup structures. B-tree indexes work well for range queries. Hash indexes are fast for equality lookups. Composite indexes cover multiple columns. Too many indexes slow down write operations. Analyze query patterns before adding indexes.' },
  { title: 'Query Optimization',
    content: 'Use EXPLAIN to analyze query execution plans. Avoid SELECT * and fetch only needed columns. Use parameterized queries to prevent SQL injection. Connection pooling reduces overhead of creating new connections. Batch inserts are faster than individual row inserts.' },
  { title: 'Database Security',
    content: 'Never store plain text passwords in databases. Use bcrypt or Argon2 for password hashing. Implement row-level security for multi-tenant applications. Encrypt sensitive data at rest and in transit. Regular backups protect against data loss. Audit logs track database access.' },
]);

// PDF 3: API Design Guide
await createPDF('./api-guide.pdf', 'REST API Design Guide', [
  { title: 'REST Principles',
    content: 'REST APIs use HTTP methods: GET for reading, POST for creating, PUT for updating, DELETE for removing. Resources are identified by URLs. Stateless communication means each request contains all needed information. Use proper HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error.' },
  { title: 'Authentication',
    content: 'JWT tokens enable stateless authentication. Include the token in Authorization header as Bearer token. Refresh tokens allow getting new access tokens without re-login. OAuth 2.0 enables third-party authentication. Always use HTTPS to protect tokens in transit. Set appropriate token expiration times.' },
  { title: 'Rate Limiting',
    content: 'Rate limiting prevents API abuse and ensures fair usage. Implement per-user and per-IP limits. Return 429 Too Many Requests when limits are exceeded. Include rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. Use Redis for distributed rate limiting across multiple servers.' },
  { title: 'Error Handling',
    content: 'Return consistent error responses with error code and message. Use appropriate HTTP status codes for different error types. Include request ID in responses for debugging. Log errors with context for monitoring. Never expose internal error details to clients. Validate input and return 400 for invalid requests.' },
  { title: 'API Versioning',
    content: 'Version your API to avoid breaking changes. URL versioning: /api/v1/users is simple and visible. Header versioning keeps URLs clean. Semantic versioning communicates change impact. Maintain backward compatibility when possible. Deprecate old versions with clear timelines and migration guides.' },
]);

console.log('✓ Created: javascript-guide.pdf (5 pages)');
console.log('✓ Created: database-guide.pdf (5 pages)');
console.log('✓ Created: api-guide.pdf (5 pages)');
