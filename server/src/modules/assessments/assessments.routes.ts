// server/src/modules/assessments/assessments.routes.ts
// Diagnostic & Psychological Assessment Centre Routes
import { successResponse } from '../../utils/apiResponse.ts';
import { getDbClient } from '../../services/prisma.ts';

export function registerAssessmentRoutes(router: any) {
  // 1. Categories
  router.get('/categories', async (_req: any, res: any) => {
    const db = getDbClient();
    const categories = await db.resourceCategory.findMany();
    // Return structured list
    res.status(200).json(
      successResponse(categories, 'Assessment categories retrieved')
    );
  });

  // 2. Catalogue
  router.get('/catalogue', async (req: any, res: any) => {
    const db = getDbClient();
    const categoryId = req.query?.category_id;
    const where: any = {};
    if (categoryId) {
      where.category_id = categoryId;
    }
    const items = await db.assessmentInstrument.findMany({ where });
    res.status(200).json(
      successResponse(items, 'Assessment catalogue retrieved')
    );
  });

  // 3. Side-by-side comparison
  router.get('/compare', async (req: any, res: any) => {
    const db = getDbClient();
    const codesStr = (req.query?.codes || '').toString();
    const codes = codesStr.split(',').map((c: string) => c.trim()).filter(Boolean);

    let instruments: any[] = [];
    if (codes.length > 0) {
      instruments = await db.assessmentInstrument.findMany({
        where: { code: { in: codes } }
      });
    }

    res.status(200).json(
      successResponse({ instruments }, 'Psychometric comparison matrix generated')
    );
  });

  // 4. Single Instrument Details
  router.get('/:id', async (req: any, res: any) => {
    const db = getDbClient();
    const id = req.params?.id;
    const item = (await db.assessmentInstrument.findUnique({ where: { id } })) ||
                 (await db.assessmentInstrument.findUnique({ where: { code: id } }));

    if (!item) {
      res.status(404).json({ success: false, message: 'Assessment instrument not found' });
      return;
    }

    res.status(200).json(
      successResponse(item, 'Assessment instrument details retrieved')
    );
  });

  // 5. Default root
  router.get('/', async (req: any, res: any) => {
    const db = getDbClient();
    const items = await db.assessmentInstrument.findMany({});
    res.status(200).json(
      successResponse(items, 'Assessment Catalogue retrieved')
    );
  });

  return router;
}
