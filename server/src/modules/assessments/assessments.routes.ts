// server/src/modules/assessments/assessments.routes.ts
// Assessment Centre placeholder foundation routes
import { successResponse } from '../../utils/apiResponse.ts';

export function registerAssessmentRoutes(router: any) {
  router.get('/', (_req: any, res: any) => {
    res.status(200).json(
      successResponse(
        [],
        'Assessment Catalogue foundation initialized. Full psychometric data and comparisons scheduled for Phase 4.'
      )
    );
  });
  return router;
}

