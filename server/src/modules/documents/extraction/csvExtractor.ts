// server/src/modules/documents/extraction/csvExtractor.ts
// Format-specific CSV/TSV parser with row/column structure and virtual pagination
import type { ExtractedPage, ExtractionResult } from './types.ts';

export function extractCsv(buffer: Buffer): ExtractionResult {
  const content = buffer.toString('utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const pages: ExtractedPage[] = [];

  const pageSize = 40; // 40 rows per virtual page
  const header = lines.length > 0 ? lines[0] : 'Column Data';

  for (let i = 0; i < lines.length; i += pageSize) {
    const chunkLines = lines.slice(i, i + pageSize);
    const pageNum = Math.floor(i / pageSize) + 1;
    pages.push({
      pageNumber: pageNum,
      heading: `Data Rows ${i + 1} - ${Math.min(i + pageSize, lines.length)} (Header: ${header.slice(0, 40)})`,
      text: chunkLines.join('\n'),
      extractionMethod: 'CSV_TEXT'
    });
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      heading: 'CSV Dataset',
      text: content || '[Empty CSV]',
      extractionMethod: 'CSV_TEXT'
    });
  }

  return {
    pages,
    totalPages: pages.length,
    extractionMethod: 'CSV_TEXT',
    ocrApplied: false,
    fileType: 'CSV'
  };
}

