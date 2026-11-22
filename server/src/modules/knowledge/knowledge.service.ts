// server/src/modules/knowledge/knowledge.service.ts
// Business Logic for Knowledge Base Module
import { getDbClient } from '../../services/prisma.ts';
import { ApiError } from '../../utils/apiError.ts';

export interface ListKnowledgeParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export class KnowledgeService {
  private prisma = getDbClient();

  async listArticles(params: ListKnowledgeParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Category filter by ID or Code
    if (params.categoryId) {
      where.categoryId = params.categoryId;
    } else if (params.category) {
      const cat = await this.prisma.resourceCategory.findUnique({
        where: { code: params.category.toUpperCase() }
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    // Search query
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { title: { contains: s } },
        { definition: { contains: s } },
        { explanation: { contains: s } }
      ];
    }

    const sortField = params.sortBy || 'createdAt';
    const sortDir = (params.sortOrder || 'desc').toLowerCase();
    const orderBy = { [sortField]: sortDir };

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { category: true }
      }),
      this.prisma.knowledgeArticle.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  async getArticle(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug) || idOrSlug.startsWith('ka-');
    const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

    const article = await this.prisma.knowledgeArticle.findUnique({
      where,
      include: { category: true }
    });

    if (!article) {
      throw ApiError.notFound(`Knowledge article '${idOrSlug}' not found`);
    }

    return article;
  }

  async createArticle(data: any) {
    // Generate slug from title if not provided
    let slug = data.slug;
    if (!slug) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // Check slug uniqueness
    const existing = await this.prisma.knowledgeArticle.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Verify category exists if provided
    if (data.categoryId) {
      const category = await this.prisma.resourceCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        throw ApiError.badRequest(`Category ID '${data.categoryId}' does not exist`);
      }
    }

    const created = await this.prisma.knowledgeArticle.create({
      data: {
        ...data,
        slug
      },
      include: { category: true }
    });

    return created;
  }

  async updateArticle(id: string, data: any) {
    const existing = await this.prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound(`Knowledge article with id '${id}' not found`);
    }

    // If slug is being updated, ensure uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await this.prisma.knowledgeArticle.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        throw ApiError.badRequest(`Slug '${data.slug}' is already in use`);
      }
    }

    // If categoryId is being updated
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await this.prisma.resourceCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        throw ApiError.badRequest(`Category ID '${data.categoryId}' does not exist`);
      }
    }

    const updated = await this.prisma.knowledgeArticle.update({
      where: { id },
      data,
      include: { category: true }
    });

    return updated;
  }

  async deleteArticle(id: string) {
    const existing = await this.prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound(`Knowledge article with id '${id}' not found`);
    }

    await this.prisma.knowledgeArticle.delete({ where: { id } });
    return { deleted: true, id };
  }

  async listCategories() {
    return this.prisma.resourceCategory.findMany({
      orderBy: { order: 'asc' }
    });
  }

  async listRelations() {
    return this.prisma.topicRelation.findMany();
  }

  async getArticleCitations(idOrSlug: string) {
    const article = await this.getArticle(idOrSlug);
    return article.citations || {
      apa: article.citation_apa,
      bibtex: article.citation_bibtex,
      mla: article.citation_mla,
      chicago: article.citation_chicago,
      vancouver: article.citation_vancouver,
      ris: article.citation_ris
    };
  }
}

export const knowledgeService = new KnowledgeService();

