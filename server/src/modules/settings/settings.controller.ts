// server/src/modules/settings/settings.controller.ts
// Settings HTTP Handlers
import { settingsService } from './settings.service.ts';
import { successResponse } from '../../utils/apiResponse.ts';

export class SettingsController {
  async getSettings(_req: any, res: any, next: (err: any) => void) {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json(successResponse(settings, 'Application settings retrieved'));
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: any, res: any, next: (err: any) => void) {
    try {
      const updated = await settingsService.updateSettings(req.body);
      res.status(200).json(successResponse(updated, 'Application settings updated successfully'));
    } catch (err) {
      next(err);
    }
  }
}

export const settingsController = new SettingsController();

