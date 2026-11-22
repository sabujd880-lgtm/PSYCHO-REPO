// server/src/modules/library/library.service.ts
// Business Logic for Digital Library & Academic Resource Catalog
import { getDbClient } from '../../services/prisma.ts';
import { ApiError } from '../../utils/apiError.ts';
import { CitationEngine } from '../../services/citationEngine.ts';

export interface ListResourcesParams {
  categoryId?: string;
  category_id?: string;
  publicationType?: string;
  publication_type?: string;
  verified?: string | number | boolean;
  isVerified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'publication_year' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class LibraryService {
  private prisma = getDbClient();

  async listCategories() {
    return this.prisma.resourceCategory.findMany({
      orderBy: { order: 'asc' }
    });
  }

  async listResources(params: ListResourcesParams = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};

    const cat = params.categoryId || params.category_id;
    if (cat) {
      where.categoryId = cat;
    }

    const pubType = params.publicationType || params.publication_type;
    if (pubType) {
      where.publicationType = pubType;
    }

    if (params.verified !== undefined && params.verified !== '') {
      where.isVerified = params.verified === '1' || params.verified === 1 || params.verified === true || params.verified === 'true';
    } else if (params.isVerified !== undefined) {
      where.isVerified = params.isVerified;
    }

    if (params.search && params.search.trim()) {
      where.search = params.search.trim();
    }

    const sortField = params.sortBy || 'createdAt';
    const sortDir = (params.sortOrder || 'desc').toLowerCase();
    const orderBy = { [sortField]: sortDir };

    const [resources, total] = await Promise.all([
      this.prisma.reference.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.reference.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      resources,
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

  async getResource(id: string) {
    const resource = await this.prisma.reference.findUnique({ where: { id } });
    if (!resource) {
      throw ApiError.notFound(`Resource with id '${id}' not found`);
    }
    return resource;
  }

  async createResource(data: any) {
    const resource = await this.prisma.reference.create({ data });
    return resource;
  }

  async updateResource(id: string, data: any) {
    const existing = await this.getResource(id);
    const updated = await this.prisma.reference.update({
      where: { id: existing.id },
      data
    });
    return updated;
  }

  async deleteResource(id: string) {
    const existing = await this.getResource(id);
    await this.prisma.reference.delete({ where: { id: existing.id } });
    return { deleted: true, id };
  }

  async getResourceCitation(id: string) {
    const resource = await this.getResource(id);
    return resource.citations || CitationEngine.generateFormattedCitations(resource);
  }

  async listBookmarks() {
    return this.prisma.bookmark.findMany();
  }

  async createBookmark(data: any) {
    const bookmark = await this.prisma.bookmark.create({ data });
    return bookmark;
  }

  async deleteBookmark(id: string) {
    const existing = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound(`Bookmark with id '${id}' not found`);
    }
    await this.prisma.bookmark.delete({ where: { id } });
    return { deleted: true, id };
  }
}

export const libraryService = new LibraryService();

