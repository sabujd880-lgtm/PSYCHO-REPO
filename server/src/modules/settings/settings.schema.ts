// server/src/modules/settings/settings.schema.ts
// Zod schemas for Application Settings module
import { z } from '../knowledge/knowledge.schema.ts';

export const updateSettingsSchema = z.object({
  preferredCitationStyle: z.string().optional(),
  preferredAiProvider: z.string().optional(),
  defaultExamConfig: z.object({}).optional(),
  documentStorageConfig: z.object({}).optional(),
  applicationPreferences: z.object({}).optional()
});

