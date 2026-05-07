// Day 15 — PDF Parsing Practice
// pdf-parse v2+ exports PDFParse class (not a default pdfParse(buffer) function).
import { PDFParse } from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';

// ─── Basic parse ─────────────────────────────────────────
export async function parsePDF(pdfPath) {
  const buffer = await fs.readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    const text = textResult.text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    const info = infoResult.info;
    return {
      title:     info?.Title ?? path.basename(pdfPath, '.pdf'),
      author:    info?.Author ?? 'Unknown',
      pages:     textResult.total,
      text,
      wordCount: text.split(/\s+/).length,
      charCount: text.length
    };
  } finally {
    await parser.destroy();
  }
}

// ─── Test with a sample PDF ──────────────────────────────
// Koi bhi PDF file ka path yahan daalo
const PDF_PATH = process.argv[2] || './sample.pdf';

try {
  console.log(`Parsing: ${PDF_PATH}\n`);
  const result = await parsePDF(PDF_PATH);

  console.log("=== PDF Info ===");
  console.log(`Title:      ${result.title}`);
  console.log(`Author:     ${result.author}`);
  console.log(`Pages:      ${result.pages}`);
  console.log(`Words:      ${result.wordCount}`);
  console.log(`Characters: ${result.charCount}`);

  console.log("\n=== First 500 chars ===");
  console.log(result.text.slice(0, 500));

  console.log("\n=== Last 200 chars ===");
  console.log(result.text.slice(-200));

} catch (err) {
  if (err.code === 'ENOENT') {
    console.log("PDF file nahi mili. Usage: node day15_parse.js path/to/file.pdf");
    console.log("\nTest ke liye ek sample PDF download karo:");
    console.log("https://www.w3.org/WAI/WCAG21/wcag21.pdf");
  } else {
    console.error("Error:", err.message);
  }
}
