// server/src/modules/library/library.schema.ts
// Validation schemas for Digital Library & Academic Resource Catalog
import { z } from '../../utils/validator.ts';

export const createResourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  authorNames: z.string().optional(),
  author_names: z.string().optional(),
  publicationYear: z.number().optional(),
  publication_year: z.number().optional(),
  publisher: z.string().optional(),
  journal: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  referenceUrl: z.string().optional(),
  reference_url: z.string().optional(),
  abstract: z.string().optional(),
  publicationType: z.string().optional(),
  publication_type: z.string().optional(),
  isVerified: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  subject: z.string().optional(),
  copyrightStatus: z.string().optional(),
  copyright_status: z.string().optional(),
  categoryId: z.string().optional(),
  category_id: z.string().optional()
});

export const updateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  authorNames: z.string().optional(),
  author_names: z.string().optional(),
  publicationYear: z.number().optional(),
  publication_year: z.number().optional(),
  publisher: z.string().optional(),
  journal: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  referenceUrl: z.string().optional(),
  reference_url: z.string().optional(),
  abstract: z.string().optional(),
  publicationType: z.string().optional(),
  publication_type: z.string().optional(),
  isVerified: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  subject: z.string().optional(),
  copyrightStatus: z.string().optional(),
  copyright_status: z.string().optional(),
  categoryId: z.string().optional(),
  category_id: z.string().optional()
});

export const createBookmarkSchema = z.object({
  itemType: z.string().optional(),
  item_type: z.string().optional(),
  itemId: z.string().optional(),
  item_id: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional()
});

