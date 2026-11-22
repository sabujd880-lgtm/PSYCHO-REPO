// server/src/modules/documents/document.service.ts
// Document Intelligence core service: file storage, extraction, chunking, and database persistence
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { getDbClient } from '../../services/prisma.ts';
import { logger } from '../../services/logger.ts';
import { extractDocument, detectFileType } from './extraction/extractor.ts';
import { chunkDocumentPages } from './chunking/chunker.ts';
import { aiProvider } from '../../services/aiProvider.ts';
import { ApiError } from '../../utils/apiError.ts';

const prisma = getDbClient();
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class DocumentService {
  // 1. Upload and Ingest Document
  async uploadDocument(filename: string, content: string | Buffer, mimeType?: string) {
    if (!filename || !content) {
      throw new ApiError(400, 'Filename and file content are required');
    }

    // Decode content
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(content)) {
      fileBuffer = content;
    } else if (typeof content === 'string') {
      if (content.startsWith('data:')) {
        const base64Data = content.split(';base64,').pop() || '';
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        try {
          fileBuffer = Buffer.from(content, 'base64');
        } catch {
          fileBuffer = Buffer.from(content, 'utf-8');
        }
      }
    } else {
      throw new ApiError(400, 'Invalid file content format');
    }

    // Max file size: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      throw new ApiError(413, `File exceeds maximum allowed size of 50MB (size: ${(fileBuffer.length / (1024 * 1024)).toFixed(1)}MB)`);
    }

    // Generate safe storage key
    const fileId = crypto.randomUUID();
    const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${Date.now()}_${fileId}_${sanitizedName}`;
    const storagePath = path.join(UPLOADS_DIR, storageKey);

    // Save to disk
    fs.writeFileSync(storagePath, fileBuffer);

    const fileType = detectFileType(filename, mimeType);

    // Insert record with UPLOADED status
    const doc = await prisma.document.create({
      data: {
        id: fileId,
        originalFilename: filename,
        storageKey,
        mimeType: mimeType || 'application/octet-stream',
        fileSize: fileBuffer.length,
        fileType,
        pageCount: 1,
        processingStatus: 'UPLOADED',
        extractionMethod: 'NATIVE'
      }
    });

    logger.info(`Uploaded document saved: ${filename} (${fileType}, ${fileBuffer.length} bytes, id: ${fileId})`);

    // Process immediately or async
    const processedDoc = await this.processDocument(fileId);
    return processedDoc;
  }

  // 2. Process Document (Extraction, OCR, Chunking, Study Notes)
  async processDocument(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new ApiError(404, `Document not found with ID ${documentId}`);
    }

    const storagePath = path.join(UPLOADS_DIR, doc.storageKey);
    if (!fs.existsSync(storagePath)) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: 'FAILED',
          processingError: 'Stored file not found on disk'
        }
      });
      throw new ApiError(500, 'Underlying file missing from storage');
    }

    try {
      // Set to PROCESSING
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'PROCESSING' }
      });

      // Extract Pages
      const extraction = extractDocument(storagePath, doc.originalFilename, doc.mimeType);

      // Clean existing pages & chunks if re-processing
      await prisma.documentPage.deleteMany({ where: { documentId } });
      await prisma.documentChunk.deleteMany({ where: { documentId } });

      // Save Pages
      const pageRecords = extraction.pages.map(p => ({
        documentId,
        pageNumber: p.pageNumber,
        heading: p.heading || `Page ${p.pageNumber}`,
        extractedText: p.text,
        extractionMethod: p.extractionMethod || extraction.extractionMethod,
        ocrConfidence: p.ocrConfidence || (extraction.ocrApplied ? 0.90 : null)
      }));
      await prisma.documentPage.createMany({ data: pageRecords });

      // Generate Chunks
      const chunks = chunkDocumentPages(extraction.pages, { wordsPerChunk: 350, wordOverlap: 50 });
      const chunkRecords = chunks.map(c => ({
        documentId,
        pageReferences: c.pageReferences,
        chunkText: c.chunkText,
        sectionHeading: c.sectionHeading,
        chunkIndex: c.chunkIndex,
        tokenCount: c.tokenCount
      }));
      await prisma.documentChunk.createMany({ data: chunkRecords });

      // AI Analysis (Summary, Concepts, Study Notes)
      const fullText = extraction.pages.map(p => p.text).join('\n\n');
      const analysis = aiProvider.analyzeDocumentContent(doc.originalFilename, fullText, extraction.pages);

      // Update Document record to COMPLETED
      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: 'COMPLETED',
          pageCount: extraction.totalPages,
          extractionMethod: extraction.extractionMethod,
          ocrApplied: extraction.ocrApplied,
          summary: analysis.summary,
          keyConcepts: analysis.keyConcepts,
          extractedReferences: analysis.extractedReferences,
          studyNotes: analysis.studyNotes,
          processingError: null
        }
      });

      logger.info(`Processed document ${documentId}: ${extraction.totalPages} pages, ${chunks.length} chunks`);
      return await prisma.document.findUnique({
        where: { id: documentId },
        include: { pages: true, chunks: true }
      });
    } catch (err: any) {
      logger.error(`Error processing document ${documentId}: ${err.message}`);
      await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: 'FAILED',
          processingError: err.message
        }
      });
      throw new ApiError(500, `Failed to process document: ${err.message}`);
    }
  }

  // 3. List Documents
  async listDocuments(query: any = {}) {
    const where: any = {};
    if (query.status) where.processingStatus = query.status;
    if (query.fileType) where.fileType = query.fileType;

    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ? Number(query.limit) : 100
    });
    return docs;
  }

  // 4. Get Document Details
  async getDocument(id: string, includePages = true, includeChunks = false) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { pages: includePages, chunks: includeChunks }
    });
    if (!doc) {
      throw new ApiError(404, `Document not found with ID ${id}`);
    }
    return doc;
  }

  // 5. Get Document Status
  async getDocumentStatus(id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new ApiError(404, `Document not found with ID ${id}`);
    }
    return {
      id: doc.id,
      originalFilename: doc.originalFilename,
      processingStatus: doc.processingStatus,
      pageCount: doc.pageCount,
      fileType: doc.fileType,
      extractionMethod: doc.extractionMethod,
      ocrApplied: doc.ocrApplied,
      processingError: doc.processingError,
      updatedAt: doc.updatedAt
    };
  }

  // 6. Get Document Pages
  async getDocumentPages(id: string) {
    const pages = await prisma.documentPage.findMany({
      where: { documentId: id },
      orderBy: { pageNumber: 'asc' }
    });
    return pages;
  }

  // 7. Delete Document
  async deleteDocument(id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new ApiError(404, `Document not found with ID ${id}`);
    }

    // Remove file from disk
    const storagePath = path.join(UPLOADS_DIR, doc.storageKey);
    if (fs.existsSync(storagePath)) {
      try {
        fs.unlinkSync(storagePath);
      } catch (err: any) {
        logger.warn(`Could not delete storage file ${storagePath}: ${err.message}`);
      }
    }

    // Delete database records
    await prisma.document.delete({ where: { id } });
    logger.info(`Deleted document ${id} and associated pages/chunks`);
    return { id, deleted: true };
  }
}

export const documentService = new DocumentService();

