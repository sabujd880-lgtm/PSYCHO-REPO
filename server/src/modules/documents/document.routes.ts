// server/src/modules/documents/document.routes.ts
// Express route registrations for Document Intelligence engine
import { documentController } from './document.controller.ts';
import { validateBody, validateQuery } from '../../middleware/validate.ts';
import {
  uploadDocumentSchema,
  askDocumentSchema,
  askMultipleDocumentsSchema,
  summarizeDocumentSchema,
  generateQuestionsSchema,
  documentSearchSchema
} from './document.schema.ts';

export function registerDocumentRoutes(router: any) {
  // 1. Literal Routes (must come before /:id)
  router.post('/upload', validateBody(uploadDocumentSchema), (req: any, res: any, next: any) =>
    documentController.upload(req, res, next)
  );

  router.get('/search', validateQuery(documentSearchSchema), (req: any, res: any, next: any) =>
    documentController.search(req, res, next)
  );

  router.post('/ask-multiple', validateBody(askMultipleDocumentsSchema), (req: any, res: any, next: any) =>
    documentController.askMultiple(req, res, next)
  );

  // Alias for frontend compatibility: POST /api/documents/ask
  router.post('/ask', validateBody(askMultipleDocumentsSchema), (req: any, res: any, next: any) =>
    documentController.askMultiple(req, res, next)
  );

  router.get('/', (req: any, res: any, next: any) =>
    documentController.list(req, res, next)
  );

  // 2. Parameterized Routes (/:id)
  router.get('/:id/status', (req: any, res: any, next: any) =>
    documentController.getStatus(req, res, next)
  );

  router.get('/:id/pages', (req: any, res: any, next: any) =>
    documentController.getPages(req, res, next)
  );

  router.post('/:id/process', (req: any, res: any, next: any) =>
    documentController.process(req, res, next)
  );

  router.post('/:id/ask', validateBody(askDocumentSchema), (req: any, res: any, next: any) =>
    documentController.ask(req, res, next)
  );

  router.post('/:id/summarize', validateBody(summarizeDocumentSchema), (req: any, res: any, next: any) =>
    documentController.summarize(req, res, next)
  );

  router.post('/:id/questions', validateBody(generateQuestionsSchema), (req: any, res: any, next: any) =>
    documentController.generateQuestions(req, res, next)
  );

  router.get('/:id', (req: any, res: any, next: any) =>
    documentController.getById(req, res, next)
  );

  router.delete('/:id', (req: any, res: any, next: any) =>
    documentController.delete(req, res, next)
  );
}

