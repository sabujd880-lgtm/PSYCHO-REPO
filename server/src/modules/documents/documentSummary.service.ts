// server/src/modules/documents/documentSummary.service.ts
// Document Summarization service supporting 9 specialized summary formats
import { getDbClient } from '../../services/prisma.ts';
import { aiProvider } from '../../services/aiProvider.ts';
import { ApiError } from '../../utils/apiError.ts';

const prisma = getDbClient();

export async function summarizeDocument(
  documentId: string,
  summaryType: string = 'detailed'
): Promise<{ documentId: string; summaryType: string; summary: string }> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { pages: true }
  });

  if (!doc) {
    throw new ApiError(404, `Document not found with ID ${documentId}`);
  }

  const summary = aiProvider.summarizeDocument(doc, summaryType);

  return {
    documentId,
    summaryType,
    summary
  };
}

