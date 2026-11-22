// server/src/modules/clinical/clinical.routes.ts
// Clinical Reference Centre placeholder foundation routes
import { successResponse } from '../../utils/apiResponse.ts';

export function registerClinicalRoutes(router: any) {
  router.get('/topics', (_req: any, res: any) => {
    res.status(200).json(
      successResponse(
        [],
        'Clinical Psychology Reference foundation initialized. Comprehensive protocols and documentation templates scheduled for Phase 4.'
      )
    );
  });
  return router;
}

