// server/src/modules/documents/document.controller.ts
// Express Controller for Document Intelligence & RAG engine
import { documentService } from './document.service.ts';
import { searchDocuments } from './documentSearch.service.ts';
import { askDocument, askMultipleDocuments } from './documentQnA.service.ts';
import { summarizeDocument } from './documentSummary.service.ts';
import { generateDocumentQuestions } from './documentQuestionGen.service.ts';
import { successResponse } from '../../utils/apiResponse.ts';
import { ApiError } from '../../utils/apiError.ts';

export class DocumentController {
  // POST /api/documents/upload
  async upload(req: any, res: any, next: any) {
    try {
      const { filename, content, mimeType } = req.body || {};
      if (!filename || !content) {
        throw new ApiError(400, 'filename and content (base64 or string) are required');
      }

      const doc = await documentService.uploadDocument(filename, content, mimeType);

      res.status(201).json(
        successResponse(
          {
            ...doc,
            documentId: doc.id,
            totalPages: doc.pageCount,
            filename: doc.originalFilename
          },
          'Document uploaded and processed successfully'
        )
      );
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents
  async list(req: any, res: any, next: any) {
    try {
      const docs = await documentService.listDocuments(req.query || {});
      res.status(200).json(successResponse(docs, 'Documents retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/:id
  async getById(req: any, res: any, next: any) {
    try {
      const doc = await documentService.getDocument(req.params.id, true, false);
      res.status(200).json(successResponse(doc, 'Document retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/:id/status
  async getStatus(req: any, res: any, next: any) {
    try {
      const status = await documentService.getDocumentStatus(req.params.id);
      res.status(200).json(successResponse(status, 'Document processing status retrieved'));
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/:id/pages
  async getPages(req: any, res: any, next: any) {
    try {
      const pages = await documentService.getDocumentPages(req.params.id);
      res.status(200).json(successResponse(pages, 'Document pages retrieved'));
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/process
  async process(req: any, res: any, next: any) {
    try {
      const doc = await documentService.processDocument(req.params.id);
      res.status(200).json(successResponse(doc, 'Document re-processed successfully'));
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/documents/:id
  async delete(req: any, res: any, next: any) {
    try {
      const result = await documentService.deleteDocument(req.params.id);
      res.status(200).json(successResponse(result, 'Document deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  // GET /api/documents/search
  async search(req: any, res: any, next: any) {
    try {
      const query = (req.query?.q || '').toString();
      const documentId = req.query?.documentId?.toString();
      const limit = req.query?.limit ? Number(req.query.limit) : 20;

      const results = await searchDocuments(query, documentId, limit);
      res.status(200).json(successResponse(results, 'Document search completed'));
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/ask
  async ask(req: any, res: any, next: any) {
    try {
      const { query } = req.body || {};
      if (!query) {
        throw new ApiError(400, 'query is required');
      }

      const answer = await askDocument(req.params.id, query);
      res.status(200).json(successResponse(answer, 'Grounded answer retrieved'));
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/ask-multiple (and alias POST /api/documents/ask)
  async askMultiple(req: any, res: any, next: any) {
    try {
      const { query, documentIds = [] } = req.body || {};
      if (!query) {
        throw new ApiError(400, 'query is required');
      }

      const answer = await askMultipleDocuments(documentIds, query);
      res.status(200).json(successResponse(answer, 'Multi-document grounded answer retrieved'));
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/summarize
  async summarize(req: any, res: any, next: any) {
    try {
      const type = req.body?.type || 'detailed';
      const summary = await summarizeDocument(req.params.id, type);
      res.status(200).json(successResponse(summary, 'Document summarized successfully'));
    } catch (err) {
      next(err);
    }
  }

  // POST /api/documents/:id/questions
  async generateQuestions(req: any, res: any, next: any) {
    try {
      const type = req.body?.type || 'mcq';
      const count = req.body?.count ? Number(req.body.count) : 5;
      const questions = await generateDocumentQuestions(req.params.id, type, count);
      res.status(200).json(successResponse(questions, 'Practice questions generated successfully'));
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();

