// server/src/modules/documents/extraction/extractor.ts
// Central multi-format document extraction and OCR dispatcher
import path from 'node:path';
import fs from 'node:fs';
import type { ExtractedPage, ExtractionResult, SupportedFormat } from './types.ts';
import { extractPdf } from './pdfExtractor.ts';
import { extractDocx } from './docxExtractor.ts';
import { extractPptx } from './pptxExtractor.ts';
import { extractXlsx } from './xlsxExtractor.ts';
import { extractCsv } from './csvExtractor.ts';
import { extractImage } from './imageOcr.ts';

export function detectFileType(filename: string, mimeType?: string): SupportedFormat {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf' || mimeType?.includes('pdf')) return 'PDF';
  if (ext === '.docx' || mimeType?.includes('wordprocessingml')) return 'DOCX';
  if (ext === '.doc' || mimeType?.includes('msword')) return 'DOC';
  if (ext === '.pptx' || ext === '.ppt' || mimeType?.includes('presentation')) return 'PPTX';
  if (ext === '.xlsx' || ext === '.xls' || mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return 'XLSX';
  if (ext === '.csv' || ext === '.tsv' || mimeType?.includes('csv')) return 'CSV';
  if (['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext) || mimeType?.startsWith('image/')) return 'IMAGE';
  return 'TXT';
}

export function extractDocument(filePath: string, originalFilename: string, mimeType?: string): ExtractionResult {
  const buffer = fs.readFileSync(filePath);
  const fileType = detectFileType(originalFilename, mimeType);

  try {
    switch (fileType) {
      case 'PDF':
        return extractPdf(buffer);

      case 'DOCX':
        return extractDocx(filePath, buffer);

      case 'DOC': {
        // Binary DOC or text fallback
        const str = buffer.toString('utf-8');
        const clean = str.replace(/[^\x20-\x7E\t\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = clean.split(' ').filter(Boolean);
        const pages: ExtractedPage[] = [];
        const wordsPerPage = 350;
        if (words.length <= wordsPerPage) {
          pages.push({
            pageNumber: 1,
            heading: 'DOC Document',
            text: clean || '[DOC document text extracted]',
            extractionMethod: 'DOC_LEGACY'
          });
        } else {
          for (let i = 0; i < words.length; i += wordsPerPage) {
            pages.push({
              pageNumber: Math.floor(i / wordsPerPage) + 1,
              heading: `Section ${Math.floor(i / wordsPerPage) + 1}`,
              text: words.slice(i, i + wordsPerPage).join(' '),
              extractionMethod: 'DOC_LEGACY'
            });
          }
        }
        return {
          pages,
          totalPages: pages.length,
          extractionMethod: 'DOC_LEGACY',
          ocrApplied: false,
          fileType: 'DOC'
        };
      }

      case 'PPTX':
        return extractPptx(filePath, buffer);

      case 'XLSX':
        return extractXlsx(filePath, buffer);

      case 'CSV':
        return extractCsv(buffer);

      case 'IMAGE':
        return extractImage(filePath, buffer, originalFilename);

      case 'TXT':
      default: {
        const text = buffer.toString('utf-8').trim();
        const words = text.split(/\s+/).filter(Boolean);
        const wordsPerPage = 400;
        const pages: ExtractedPage[] = [];
        if (words.length <= wordsPerPage) {
          pages.push({
            pageNumber: 1,
            heading: originalFilename,
            text: text || '[Empty text document]',
            extractionMethod: 'TEXT_NATIVE'
          });
        } else {
          for (let i = 0; i < words.length; i += wordsPerPage) {
            pages.push({
              pageNumber: Math.floor(i / wordsPerPage) + 1,
              heading: `${originalFilename} (Part ${Math.floor(i / wordsPerPage) + 1})`,
              text: words.slice(i, i + wordsPerPage).join(' '),
              extractionMethod: 'TEXT_NATIVE'
            });
          }
        }
        return {
          pages,
          totalPages: pages.length,
          extractionMethod: 'TEXT_NATIVE',
          ocrApplied: false,
          fileType: 'TXT'
        };
      }
    }
  } catch (err: any) {
    return {
      pages: [
        {
          pageNumber: 1,
          heading: 'Extraction Error Recovery',
          text: `[Document raw recovery: ${originalFilename}]\n${buffer.toString('utf-8', 0, 1000).replace(/[^\x20-\x7E\n]/g, ' ')}`,
          extractionMethod: 'FALLBACK'
        }
      ],
      totalPages: 1,
      extractionMethod: 'FALLBACK',
      ocrApplied: false,
      fileType,
      error: err.message
    };
  }
}

