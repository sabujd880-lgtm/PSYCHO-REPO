// server/src/modules/knowledge/knowledge.routes.ts
// Knowledge Base Express Router
import { knowledgeController } from './knowledge.controller.ts';
import { validate } from '../../middleware/validate.ts';
import { createKnowledgeSchema, updateKnowledgeSchema } from './knowledge.schema.ts';

export function registerKnowledgeRoutes(router: any) {
  // 1. Categories
  router.get('/categories', (req: any, res: any, next: any) => knowledgeController.getCategories(req, res, next));

  // 2. Topic Relationships Graph
  router.get('/relations', (req: any, res: any, next: any) => knowledgeController.getRelations(req, res, next));

  // 3. Articles List (both / and /articles)
  router.get('/articles', (req: any, res: any, next: any) => knowledgeController.getArticles(req, res, next));
  router.get('/', (req: any, res: any, next: any) => knowledgeController.getArticles(req, res, next));

  // 4. Create Article
  router.post(
    '/',
    validate({ body: createKnowledgeSchema }),
    (req: any, res: any, next: any) => knowledgeController.createArticle(req, res, next)
  );

  // 5. Article Citations
  router.get('/articles/:id/citation', (req: any, res: any, next: any) => knowledgeController.getCitations(req, res, next));
  router.get('/:id/citation', (req: any, res: any, next: any) => knowledgeController.getCitations(req, res, next));

  // 6. Get Article by ID or Slug (both /articles/:id and /:id)
  router.get('/articles/:id', (req: any, res: any, next: any) => knowledgeController.getArticle(req, res, next));
  router.get('/:id', (req: any, res: any, next: any) => knowledgeController.getArticle(req, res, next));

  // 7. Update Article
  router.put(
    '/:id',
    validate({ body: updateKnowledgeSchema }),
    (req: any, res: any, next: any) => knowledgeController.updateArticle(req, res, next)
  );

  // 8. Delete Article
  router.delete('/:id', (req: any, res: any, next: any) => knowledgeController.deleteArticle(req, res, next));

  return router;
}

