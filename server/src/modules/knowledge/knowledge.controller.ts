// server/src/modules/knowledge/knowledge.controller.ts
// Knowledge Base HTTP Handlers
import { knowledgeService } from './knowledge.service.ts';
import { successResponse } from '../../utils/apiResponse.ts';

export class KnowledgeController {
  async getArticles(req: any, res: any, next: (err: any) => void) {
    try {
      const { page, limit, search, category, categoryId, sortBy, sortOrder } = req.query;
      const result = await knowledgeService.listArticles({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        category: category as string,
        categoryId: categoryId as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      });

      res.status(200).json(successResponse(result.articles, 'Articles retrieved successfully', result.pagination));
    } catch (err) {
      next(err);
    }
  }

  async getArticle(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const article = await knowledgeService.getArticle(id);
      res.status(200).json(successResponse(article, 'Article details retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async createArticle(req: any, res: any, next: (err: any) => void) {
    try {
      const created = await knowledgeService.createArticle(req.body);
      res.status(201).json(successResponse(created, 'Knowledge article created successfully'));
    } catch (err) {
      next(err);
    }
  }

  async updateArticle(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const updated = await knowledgeService.updateArticle(id, req.body);
      res.status(200).json(successResponse(updated, 'Knowledge article updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  async deleteArticle(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const result = await knowledgeService.deleteArticle(id);
      res.status(200).json(successResponse(result, 'Knowledge article deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  async getCategories(_req: any, res: any, next: (err: any) => void) {
    try {
      const categories = await knowledgeService.listCategories();
      res.status(200).json(successResponse(categories, 'Resource categories retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async getRelations(_req: any, res: any, next: (err: any) => void) {
    try {
      const relations = await knowledgeService.listRelations();
      res.status(200).json(successResponse(relations, 'Topic relationship graph retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async getCitations(req: any, res: any, next: (err: any) => void) {
    try {
      const { id } = req.params;
      const citations = await knowledgeService.getArticleCitations(id);
      res.status(200).json(successResponse(citations, 'Article citations retrieved'));
    } catch (err) {
      next(err);
    }
  }
}

export const knowledgeController = new KnowledgeController();

