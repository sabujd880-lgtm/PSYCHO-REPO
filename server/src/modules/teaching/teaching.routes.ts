// server/src/modules/teaching/teaching.routes.ts
// Teaching Workspace placeholder foundation routes
import { successResponse } from '../../utils/apiResponse.ts';

export function registerTeachingRoutes(router: any) {
  router.get('/notes', (_req: any, res: any) => {
    res.status(200).json(
      successResponse(
        [],
        'Teaching Workspace foundation initialized. Lesson plans, lecture notes, classroom activities, and worksheet exports scheduled for Phase 6.'
      )
    );
  });
  return router;
}

