// server/src/modules/library/library.controller.ts
// Digital Library HTTP Handlers
import { libraryService } from './library.service.ts';
import { successResponse } from '../../utils/apiResponse.ts';

export class LibraryController {
  async getCategories(_req: any, res: any, next: (err: any) => void) {
    try {
      const categories = await libraryService.listCategories();
      res.status(200).json(successResponse(categories, 'Resource categories retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async getResources(req: any, res: any, next: (err: any) => void) {
    try {
      const { category_id, categoryId, publication_type, publicationType, verified, isVerified, search, page, limit, sortBy, sortOrder } = req.query;
      const result = await libraryService.listResources({
        categoryId: (categoryId || category_id) as string,
        publicationType: (publicationType || publication_type) as string,
        verified: (verified !== undefined ? verified : isVerified) as any,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      });
      res.status(200).json(successResponse(result.resources, 'Resources retrieved successfully', result.pagination));
    } catch (err) {
      next(err);
    }
  }

  async getResource(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const resource = await libraryService.getResource(id);
      res.status(200).json(successResponse(resource, 'Resource details retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async createResource(req: any, res: any, next: (err: any) => void) {
    try {
      const created = await libraryService.createResource(req.body);
      res.status(201).json(successResponse(created, 'Resource created successfully'));
    } catch (err) {
      next(err);
    }
  }

  async updateResource(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const updated = await libraryService.updateResource(id, req.body);
      res.status(200).json(successResponse(updated, 'Resource updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  async deleteResource(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const result = await libraryService.deleteResource(id);
      res.status(200).json(successResponse(result, 'Resource deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  async getCitation(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const citation = await libraryService.getResourceCitation(id);
      res.status(200).json(successResponse(citation, 'Citation formats retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async getBookmarks(_req: any, res: any, next: (err: any) => void) {
    try {
      const bookmarks = await libraryService.listBookmarks();
      res.status(200).json(successResponse(bookmarks, 'Bookmarks retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async createBookmark(req: any, res: any, next: (err: any) => void) {
    try {
      const created = await libraryService.createBookmark(req.body);
      res.status(201).json(successResponse(created, 'Bookmark created successfully'));
    } catch (err) {
      next(err);
    }
  }

  async deleteBookmark(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const result = await libraryService.deleteBookmark(id);
      res.status(200).json(successResponse(result, 'Bookmark deleted successfully'));
    } catch (err) {
      next(err);
    }
  }
}

export const libraryController = new LibraryController();

