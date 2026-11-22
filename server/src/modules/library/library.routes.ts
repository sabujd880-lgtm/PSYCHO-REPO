// server/src/modules/library/library.routes.ts
// Digital Library & Academic Resource Catalog Express Router
import { libraryController } from './library.controller.ts';
import { validate } from '../../middleware/validate.ts';
import { createResourceSchema, updateResourceSchema, createBookmarkSchema } from './library.schema.ts';

export function registerLibraryRoutes(router: any) {
  // 1. Categories
  router.get('/categories', (req: any, res: any, next: any) => libraryController.getCategories(req, res, next));

  // 2. Resources Catalog
  router.get('/resources', (req: any, res: any, next: any) => libraryController.getResources(req, res, next));
  router.post(
    '/resources',
    validate({ body: createResourceSchema }),
    (req: any, res: any, next: any) => libraryController.createResource(req, res, next)
  );

  // 3. Resource Citations (Must precede /resources/:id if needed, but works with parameter)
  router.get('/resources/:id/citation', (req: any, res: any, next: any) => libraryController.getCitation(req, res, next));

  // 4. Single Resource
  router.get('/resources/:id', (req: any, res: any, next: any) => libraryController.getResource(req, res, next));
  router.put(
    '/resources/:id',
    validate({ body: updateResourceSchema }),
    (req: any, res: any, next: any) => libraryController.updateResource(req, res, next)
  );
  router.delete('/resources/:id', (req: any, res: any, next: any) => libraryController.deleteResource(req, res, next));

  // 5. Bookmarks
  router.get('/bookmarks', (req: any, res: any, next: any) => libraryController.getBookmarks(req, res, next));
  router.post(
    '/bookmarks',
    validate({ body: createBookmarkSchema }),
    (req: any, res: any, next: any) => libraryController.createBookmark(req, res, next)
  );
  router.delete('/bookmarks/:id', (req: any, res: any, next: any) => libraryController.deleteBookmark(req, res, next));

  return router;
}

