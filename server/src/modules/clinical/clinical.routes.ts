// server/src/modules/clinical/clinical.routes.ts
// Clinical Reference Centre Routes
import { successResponse } from '../../utils/apiResponse.ts';
import { getDbClient } from '../../services/prisma.ts';

export function registerClinicalRoutes(router: any) {
  // 1. Clinical Protocols & Topics
  router.get('/topics', async (req: any, res: any) => {
    const db = getDbClient();
    const domain = req.query?.domain;
    const where: any = {};
    if (domain) {
      where.domain = domain;
    }
    const topics = await db.clinicalTopic.findMany({ where });
    res.status(200).json(
      successResponse(topics, 'Clinical reference topics retrieved')
    );
  });

  // 2. Specific Topic by ID
  router.get('/topics/:id', async (req: any, res: any) => {
    const db = getDbClient();
    const id = req.params?.id;
    const topic = await db.clinicalTopic.findUnique({ where: { id } });

    if (!topic) {
      res.status(404).json({ success: false, message: 'Clinical topic not found' });
      return;
    }

    res.status(200).json(
      successResponse(topic, 'Clinical topic details retrieved')
    );
  });

  // 3. Clinical Templates
  router.get('/templates', async (_req: any, res: any) => {
    const db = getDbClient();
    const templates = await db.clinicalTemplate.findMany();
    res.status(200).json(
      successResponse(templates, 'Standardized clinical templates retrieved')
    );
  });

  return router;
}
