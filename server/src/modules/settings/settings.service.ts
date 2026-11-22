// server/src/modules/settings/settings.service.ts
// Business Logic for Application Settings
import { getDbClient } from '../../services/prisma.ts';

export class SettingsService {
  private prisma = getDbClient();

  async getSettings() {
    let settings = await this.prisma.applicationSetting.findFirst();
    if (!settings) {
      settings = await this.prisma.applicationSetting.create({
        data: {
          preferredCitationStyle: 'APA 7th',
          preferredAiProvider: 'none',
          defaultExamConfig: {
            targetExam: 'UGC NET Psychology',
            defaultQuestionCount: 25,
            defaultTimeMinutes: 60
          },
          documentStorageConfig: {
            storageType: 'local',
            uploadDir: 'data/uploads',
            maxFileSizeMb: 50
          },
          applicationPreferences: {
            theme: 'light',
            autoSaveNotes: true
          }
        }
      });
    }

    // Ensure no secrets or sensitive internal properties are exposed
    return {
      id: settings.id,
      preferredCitationStyle: settings.preferredCitationStyle,
      preferredAiProvider: settings.preferredAiProvider,
      defaultExamConfig: settings.defaultExamConfig,
      documentStorageConfig: settings.documentStorageConfig,
      applicationPreferences: settings.applicationPreferences,
      updatedAt: settings.updatedAt
    };
  }

  async updateSettings(data: any) {
    const existing = await this.getSettings();
    const updated = await this.prisma.applicationSetting.update({
      where: { id: existing.id },
      data
    });

    return {
      id: updated.id,
      preferredCitationStyle: updated.preferredCitationStyle,
      preferredAiProvider: updated.preferredAiProvider,
      defaultExamConfig: updated.defaultExamConfig,
      documentStorageConfig: updated.documentStorageConfig,
      applicationPreferences: updated.applicationPreferences,
      updatedAt: updated.updatedAt
    };
  }
}

export const settingsService = new SettingsService();

