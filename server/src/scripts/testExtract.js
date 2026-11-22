// server/src/scripts/testExtract.js
import path from 'node:path';
import { extractDocument } from '../modules/documents/extraction/extractor.ts';

const testFile = 'C:/Users/sabuj/Downloads/psy book doc/Valuing Questionnaire (VQ).pdf';
console.log('Testing extraction on:', testFile);

try {
  const result = extractDocument(testFile, 'Valuing Questionnaire (VQ).pdf', 'application/pdf');
  console.log('Extraction success!');
  console.log('Total pages:', result.totalPages);
  console.log('Method:', result.extractionMethod);
  console.log('OCR applied:', result.ocrApplied);
  console.log('Sample text (first 300 chars):');
  console.log(result.pages[0]?.text.slice(0, 300));
} catch (err) {
  console.error('Extraction failed:', err);
}

