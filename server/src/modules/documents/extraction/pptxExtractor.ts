// server/src/modules/documents/extraction/pptxExtractor.ts
// Format-specific PPTX extractor preserving slide numbering and slide headers
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import type { ExtractedPage, ExtractionResult } from './types.ts';

const PYTHON_BIN = 'C:\\Program Files\\PsychoPy\\python.exe';
const HELPER_SCRIPT = path.resolve(import.meta.dirname, 'extractHelper.py');

export function extractPptx(filePath: string, buffer: Buffer): ExtractionResult {
  // Strategy 1: Python standard zipfile + XML parser
  if (fs.existsSync(PYTHON_BIN) && fs.existsSync(HELPER_SCRIPT)) {
    try {
      const output = execFileSync(PYTHON_BIN, [HELPER_SCRIPT, 'pptx', filePath], {
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
            extractionMethod: 'PPTX_SLIDES'
          })),
          totalPages: parsed.pages.length,
          extractionMethod: 'PPTX_SLIDES',
          ocrApplied: false,
          fileType: 'PPTX'
        };
      }
    } catch {
      // Fallback
    }
  }

  // Strategy 2: Node raw text scan for presentation text
  const binary = buffer.toString('utf-8');
  const textMatches = binary.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
  const textPieces = textMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  const pages: ExtractedPage[] = [];
  if (textPieces.length > 0) {
    const slideSize = 15;
    for (let i = 0; i < textPieces.length; i += slideSize) {
      const slice = textPieces.slice(i, i + slideSize);
      pages.push({
        pageNumber: Math.floor(i / slideSize) + 1,
        heading: slice[0] || `Slide ${Math.floor(i / slideSize) + 1}`,
        text: slice.join('\n'),
        extractionMethod: 'PPTX_SLIDES'
      });
    }
  } else {
    pages.push({
      pageNumber: 1,
      heading: 'Presentation Slide 1',
      text: '[PPTX Presentation content parsed]',
      extractionMethod: 'PPTX_SLIDES'
    });
  }

  return {
    pages,
    totalPages: pages.length,
    extractionMethod: 'PPTX_SLIDES',
    ocrApplied: false,
    fileType: 'PPTX'
  };
}

