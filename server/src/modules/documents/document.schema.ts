// server/src/modules/documents/document.schema.ts
// Zod-compatible schemas for Document Intelligence endpoints

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

  number: () => ({
    int: () => ({
      min: (minVal: number) => ({
        max: (maxVal: number) => ({
          optional: () => ({
            default: (def: number) => ({
              safeParse: (val: any) => {
                if (val === undefined || val === null) return { success: true, data: def };
                const num = Number(val);
                if (isNaN(num) || !Number.isInteger(num) || num < minVal || num > maxVal) {
                  return { success: false, error: { errors: [{ path: ['field'], message: `Must be an integer between ${minVal} and ${maxVal}` }] } };
                }
                return { success: true, data: num };
              }
            })
          })
        })
      })
    })
  }),

  coerce: {
    number: () => ({
      int: () => ({
        min: (minVal: number) => ({
          max: (maxVal: number) => ({
            optional: () => ({
              default: (def: number) => ({
                safeParse: (val: any) => {
                  if (val === undefined || val === null) return { success: true, data: def };
                  const num = Number(val);
                  if (isNaN(num) || num < minVal || num > maxVal) {
                    return { success: false, error: { errors: [{ path: ['field'], message: `Must be a number between ${minVal} and ${maxVal}` }] } };
                  }
                  return { success: true, data: Math.round(num) };
                }
              })
            })
          })
        })
      })
    })
  },

  enum: (allowedValues: string[]) => ({
    optional: () => ({
      default: (def: string) => ({
        safeParse: (val: any) => {
          if (val === undefined || val === null) return { success: true, data: def };
          if (!allowedValues.includes(val)) {
            return { success: false, error: { errors: [{ path: ['field'], message: `Must be one of: ${allowedValues.join(', ')}` }] } };
          }
          return { success: true, data: val };
        }
      })
    })
  }),

  array: (_type?: any) => ({
    optional: () => ({
      default: (def: any[] = []) => ({
        safeParse: (val: any) => {
          if (val === undefined || val === null) return { success: true, data: def };
          if (Array.isArray(val)) return { success: true, data: val };
          return { success: true, data: [val] };
        }
      })
    })
  }),

  object: (shape: Record<string, any> = {}) => ({
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

export const uploadDocumentSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().optional(),
  content: z.string().min(1, 'File content (base64 or text) is required')
});

export const askDocumentSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters long')
});

export const askMultipleDocumentsSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters long'),
  documentIds: z.array().optional().default([])
});

export const summarizeDocumentSchema = z.object({
  type: z.enum([
    'short',
    'detailed',
    'chapter_wise',
    'section_wise',
    'definitions',
    'theories',
    'psychologists',
    'findings',
    'exam_notes'
  ]).optional().default('detailed')
});

export const generateQuestionsSchema = z.object({
  type: z.enum([
    'mcq',
    'true_false',
    'fill_in_blanks',
    'short_answer',
    'long_essay',
    'case_based'
  ]).optional().default('mcq'),
  count: z.number().int().min(1).max(20).optional().default(5)
});

export const documentSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  documentId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
