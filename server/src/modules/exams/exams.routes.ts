// server/src/modules/exams/exams.routes.ts
// PYQ & Exam Preparation placeholder foundation routes
import { successResponse } from '../../utils/apiResponse.ts';

export function registerExamRoutes(router: any) {
  router.get('/', (_req: any, res: any) => {
    res.status(200).json(
      successResponse(
        [],
        'Examination Preparation foundation initialized. PYQ bank, trend analytics, predictor engine, and mock tests scheduled for Phase 5.'
      )
    );
  });
  return router;
}

