// server/src/modules/knowledge/knowledge.schema.ts
// Zod schemas for Knowledge Base module

// Minimalist, robust Zod-compatible validation structure
export class SimpleSchema<T> {
  private validators: Array<(val: any) => { valid: boolean; error?: string; transformed?: any }> = [];

  constructor(validators: Array<(val: any) => { valid: boolean; error?: string; transformed?: any }> = []) {
    this.validators = validators;
  }

  safeParse(input: any): { success: boolean; data?: T; error?: { errors: Array<{ path: string[]; message: string }> } } {
    let current = input;
    const errors: Array<{ path: string[]; message: string }> = [];

    for (const v of this.validators) {
      const res = v(current);
      if (!res.valid) {
        errors.push({ path: ['field'], message: res.error || 'Invalid value' });
      } else if (res.transformed !== undefined) {
        current = res.transformed;
      }
    }

    if (errors.length > 0) {
      return { success: false, error: { errors } };
    }
    return { success: true, data: current as T };
  }
}

// Zod-like factory
export const z = {
  string: () => ({
    min: (minLen: number, msg?: string) => ({
      safeParse: (val: any) => {
        if (typeof val !== 'string' || val.trim().length < minLen) {
          return { success: false, error: { errors: [{ path: ['field'], message: msg || `Must be at least ${minLen} characters` }] } };
        }
        return { success: true, data: val.trim() };
      },
      optional: () => ({
        safeParse: (val: any) => {
          if (val === undefined || val === null || val === '') return { success: true, data: undefined };
          if (typeof val !== 'string' || val.trim().length < minLen) {
            return { success: false, error: { errors: [{ path: ['field'], message: msg || `Must be at least ${minLen} characters` }] } };
          }
          return { success: true, data: val.trim() };
        }
      })
    }),
    optional: () => ({
      safeParse: (val: any) => {
        if (val === undefined || val === null) return { success: true, data: undefined };
        if (typeof val !== 'string') return { success: false, error: { errors: [{ path: ['field'], message: 'Must be a string' }] } };
        return { success: true, data: val.trim() };
      }
    }),
    safeParse: (val: any) => {
      if (typeof val !== 'string') return { success: false, error: { errors: [{ path: ['field'], message: 'Must be a string' }] } };
      return { success: true, data: val.trim() };
    }
  }),

  array: (_itemType: any) => ({
    optional: () => ({
      safeParse: (val: any) => {
        if (val === undefined || val === null) return { success: true, data: [] };
        if (Array.isArray(val)) return { success: true, data: val };
        if (typeof val === 'string') return { success: true, data: [val] };
        return { success: false, error: { errors: [{ path: ['field'], message: 'Must be an array of strings' }] } };
      }
    }),
    safeParse: (val: any) => {
      if (!Array.isArray(val)) return { success: false, error: { errors: [{ path: ['field'], message: 'Must be an array' }] } };
      return { success: true, data: val };
    }
  }),

  object: (shape: Record<string, any> = {}) => ({
    optional: () => ({
      safeParse: (input: any) => {
        if (input === undefined || input === null) return { success: true, data: undefined };
        if (typeof input !== 'object') {
          return { success: false, error: { errors: [{ path: ['root'], message: 'Expected JSON object' }] } };
        }
        return { success: true, data: input };
      }
    }),
    safeParse: (input: any) => {
      if (!input || typeof input !== 'object') {
        return { success: false, error: { errors: [{ path: ['root'], message: 'Expected JSON object' }] } };
      }

      const validated: Record<string, any> = {};
      const errors: Array<{ path: string[]; message: string }> = [];

      for (const key in shape) {
        const schema = shape[key];
        const val = input[key];
        const res = schema.safeParse(val);
        if (!res.success) {
          res.error.errors.forEach((e: any) => {
            errors.push({ path: [key, ...e.path.filter((p: string) => p !== 'field')], message: e.message });
          });
        } else if (res.data !== undefined) {
          validated[key] = res.data;
        }
      }

      if (errors.length > 0) {
        return { success: false, error: { errors } };
      }
      return { success: true, data: { ...input, ...validated } };
    }
  })
};

// 1. Create Article Schema
export const createKnowledgeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().optional(),
  definition: z.string().min(10, 'Definition must be at least 10 characters'),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
  keyConcepts: z.array(z.string()).optional(),
  theories: z.string().optional(),
  applications: z.string().optional(),
  limitations: z.string().optional(),
  categoryId: z.string().optional(),
  authorReferences: z.string().optional(),
  sourceReferences: z.string().optional(),
  doi: z.string().optional(),
  publicationInfo: z.string().optional()
});

// 2. Update Article Schema
export const updateKnowledgeSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().optional(),
  definition: z.string().min(10).optional(),
  explanation: z.string().min(10).optional(),
  keyConcepts: z.array(z.string()).optional(),
  theories: z.string().optional(),
  applications: z.string().optional(),
  limitations: z.string().optional(),
  categoryId: z.string().optional(),
  authorReferences: z.string().optional(),
  sourceReferences: z.string().optional(),
  doi: z.string().optional(),
  publicationInfo: z.string().optional()
});
