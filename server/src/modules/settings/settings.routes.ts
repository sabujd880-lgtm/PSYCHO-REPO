// server/src/modules/settings/settings.routes.ts
// Settings Express Router
import { settingsController } from './settings.controller.ts';
import { validate } from '../../middleware/validate.ts';
import { updateSettingsSchema } from './settings.schema.ts';

export function registerSettingsRoutes(router: any) {
  router.get('/', (req: any, res: any, next: any) => settingsController.getSettings(req, res, next));
  router.put(
    '/',
    validate({ body: updateSettingsSchema }),
    (req: any, res: any, next: any) => settingsController.updateSettings(req, res, next)
  );
  return router;
}

