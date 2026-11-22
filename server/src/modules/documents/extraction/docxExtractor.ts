// server/src/modules/documents/extraction/docxExtractor.ts
// Format-specific DOCX extractor with headings, paragraphs, and tables
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import zlib from 'node:zlib';
import type { ExtractedPage, ExtractionResult } from './types.ts';

const PYTHON_BIN = 'C:\\Program Files\\PsychoPy\\python.exe';
const HELPER_SCRIPT = path.resolve(import.meta.dirname, 'extractHelper.py');

export function extractDocx(filePath: string, buffer: Buffer): ExtractionResult {
  // Strategy 1: Use Python helper for structured XML & tables
  if (fs.existsSync(PYTHON_BIN) && fs.existsSync(HELPER_SCRIPT)) {
    try {
      const output = execFileSync(PYTHON_BIN, [HELPER_SCRIPT, 'docx', filePath], {
        encoding: 'utf-8',
        timeout: 10000
      });
      const parsed = JSON.parse(output);
      if (parsed.pages && parsed.pages.length > 0) {
        return {
          pages: parsed.pages.map((p: any) => ({
            pageNumber: p.pageNumber,
            heading: p.heading,
            text: p.text,
            extractionMethod: 'DOCX_XML'
          })),
          totalPages: parsed.pages.length,
          extractionMethod: 'DOCX_XML',
          ocrApplied: false,
          fileType: 'DOCX'
        };
      }
    } catch {
      // Fallback to pure Node extraction
    }
  }

  // Strategy 2: Pure Node extraction from zip buffer
  const binary = buffer.toString('binary');
  const xmlMarker = 'word/document.xml';
  const markerIdx = binary.indexOf(xmlMarker);
  let xmlText = '';

  if (markerIdx !== -1) {
    const rawData = buffer.subarray(markerIdx + xmlMarker.length + 20);
    try {
      xmlText = zlib.inflateRawSync(rawData).toString('utf-8');
    } catch {
      try {
        xmlText = zlib.inflateSync(rawData).toString('utf-8');
      } catch {
        xmlText = buffer.toString('utf-8', markerIdx);
      }
    }
  } else {
    xmlText = buffer.toString('utf-8');
  }

  // Extract <w:t> tags
  const textMatches = xmlText.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
  let fullText = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim();
  if (!fullText) {
    fullText = xmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const words = fullText.split(/\s+/).filter(Boolean);
  const wordsPerPage = 350;
  const pages: ExtractedPage[] = [];

  if (words.length <= wordsPerPage) {
    pages.push({
      pageNumber: 1,
      heading: words.slice(0, 8).join(' ') || 'DOCX Document',
      text: fullText || '[Empty DOCX document]',
      extractionMethod: 'DOCX_STREAM'
    });
  } else {
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const slice = words.slice(i, i + wordsPerPage).join(' ');
      pages.push({
        pageNumber: Math.floor(i / wordsPerPage) + 1,
        heading: words.slice(i, i + 8).join(' '),
        text: slice,
        extractionMethod: 'DOCX_STREAM'
      });
    }
  }

  return {
    pages,
    totalPages: pages.length,
    extractionMethod: 'DOCX_STREAM',
    ocrApplied: false,
    fileType: 'DOCX'
  };
}

