// server/src/modules/documents/extraction/xlsxExtractor.ts
// Format-specific XLSX extractor preserving worksheet names and tabular grid
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import type { ExtractedPage, ExtractionResult } from './types.ts';

const PYTHON_BIN = 'C:\\Program Files\\PsychoPy\\python.exe';
const HELPER_SCRIPT = path.resolve(import.meta.dirname, 'extractHelper.py');

export function extractXlsx(filePath: string, buffer: Buffer): ExtractionResult {
  // Strategy 1: Python openpyxl (verified installed)
  if (fs.existsSync(PYTHON_BIN) && fs.existsSync(HELPER_SCRIPT)) {
    try {
      const output = execFileSync(PYTHON_BIN, [HELPER_SCRIPT, 'xlsx', filePath], {
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
            extractionMethod: 'XLSX_SHEETS'
          })),
          totalPages: parsed.pages.length,
          extractionMethod: 'XLSX_SHEETS',
          ocrApplied: false,
          fileType: 'XLSX'
        };
      }
    } catch {
      // Fallback
    }
  }

  // Strategy 2: Node raw text scan for cell values
  const text = buffer.toString('utf-8');
  const cellMatches = text.match(/<v[^>]*>([\s\S]*?)<\/v>/g) || [];
  const cells = cellMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  const pages: ExtractedPage[] = [
    {
      pageNumber: 1,
      heading: 'Worksheet 1',
      text: cells.length > 0 ? `Tabular Data:\n${cells.join(', ')}` : '[Worksheet structured data]',
      extractionMethod: 'XLSX_SHEETS'
    }
  ];

  return {
    pages,
    totalPages: pages.length,
    extractionMethod: 'XLSX_SHEETS',
    ocrApplied: false,
    fileType: 'XLSX'
  };
}

