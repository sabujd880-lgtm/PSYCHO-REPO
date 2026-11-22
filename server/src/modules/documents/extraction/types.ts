// server/src/modules/documents/extraction/types.ts
// Common types for multi-format document extraction and OCR

export interface ExtractedPage {
  pageNumber: number;
  heading?: string;
  text: string;
  extractionMethod: string;
  ocrConfidence?: number;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  totalPages: number;
  extractionMethod: string;
  ocrApplied: boolean;
  fileType: string;
  error?: string;
}

export type SupportedFormat = 'PDF' | 'DOCX' | 'DOC' | 'TXT' | 'PPTX' | 'XLSX' | 'CSV' | 'IMAGE';

