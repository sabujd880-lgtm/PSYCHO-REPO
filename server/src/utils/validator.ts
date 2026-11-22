// server/src/utils/validator.ts
// Universal zero-dependency Zod-compatible validation engine

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
              return { success: true, data: num };
            }
          })
        })
      })
    }),
    optional: () => ({
      safeParse: (val: any) => {
        if (val === undefined || val === null || val === '') return { success: true, data: undefined };
        const num = Number(val);
        if (isNaN(num)) return { success: false, error: { errors: [{ path: ['field'], message: 'Must be a valid number' }] } };
        return { success: true, data: num };
      }
    }),
    safeParse: (val: any) => {
      const num = Number(val);
      if (isNaN(num)) return { success: false, error: { errors: [{ path: ['field'], message: 'Must be a valid number' }] } };
      return { success: true, data: num };
    }
  }),

  boolean: () => ({
    optional: () => ({
      safeParse: (val: any) => {
        if (val === undefined || val === null || val === '') return { success: true, data: undefined };
        return { success: true, data: Boolean(val) };
      }
    }),
    safeParse: (val: any) => {
      if (typeof val === 'boolean') return { success: true, data: val };
      if (val === 'true' || val === 1 || val === '1') return { success: true, data: true };
      if (val === 'false' || val === 0 || val === '0') return { success: true, data: false };
      return { success: false, error: { errors: [{ path: ['field'], message: 'Must be a boolean' }] } };
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

  enum: (allowedValues: string[]) => ({
    optional: () => ({
      safeParse: (val: any) => {
        if (val === undefined || val === null || val === '') return { success: true, data: undefined };
        if (!allowedValues.includes(val)) {
          return { success: false, error: { errors: [{ path: ['field'], message: `Invalid option. Allowed: ${allowedValues.join(', ')}` }] } };
        }
        return { success: true, data: val };
      }
    }),
    safeParse: (val: any) => {
      if (!allowedValues.includes(val)) {
        return { success: false, error: { errors: [{ path: ['field'], message: `Invalid option. Allowed: ${allowedValues.join(', ')}` }] } };
      }
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
        if (schema && typeof schema.safeParse === 'function') {
          const res = schema.safeParse(val);
          if (!res.success) {
            errors.push({ path: [key], message: res.error?.errors?.[0]?.message || 'Invalid value' });
          } else if (res.data !== undefined) {
            validated[key] = res.data;
          }
        }
      }

      // Preserve unshaped properties that were passed in
      for (const key in input) {
        if (!(key in shape)) {
          validated[key] = input[key];
        }
      }

      if (errors.length > 0) {
        return { success: false, error: { errors } };
      }
      return { success: true, data: validated };
    }
  })
};

