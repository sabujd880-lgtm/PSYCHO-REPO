// server/src/modules/documents/documentQnA.service.ts
// Document Question & Answer service with single and multi-document grounded reasoning
import { getDbClient } from '../../services/prisma.ts';
import { aiProvider, type GroundedQnAResult } from '../../services/aiProvider.ts';
import { ApiError } from '../../utils/apiError.ts';

const prisma = getDbClient();

export async function askDocument(documentId: string, query: string): Promise<GroundedQnAResult> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { chunks: true }
  });

  if (!doc) {
    throw new ApiError(404, `Document not found with ID ${documentId}`);
  }

  const chunks = (doc.chunks || []).map((c: any) => ({
    ...c,
    documentName: doc.originalFilename,
    documentId: doc.id
  }));

  return aiProvider.answerGroundedQuestion(query, chunks);
}

export async function askMultipleDocuments(
  documentIds: string[],
  query: string
): Promise<GroundedQnAResult> {
  let chunks: any[] = [];

  if (documentIds && documentIds.length > 0) {
    // Stringify IDs safely
    const cleanIds = documentIds.map(id => String(id));
    const docs = await prisma.document.findMany({
      where: { id: { in: cleanIds } },
      include: { chunks: true }
    });

    if (docs.length === 0) {
      throw new ApiError(404, 'None of the requested documents were found');
    }

    docs.forEach((doc: any) => {
      (doc.chunks || []).forEach((c: any) => {
        chunks.push({
          ...c,
          documentName: doc.originalFilename,
          documentId: doc.id
        });
      });
    });
  } else {
    // If no specific documents provided, retrieve across all indexed documents
    const docs = await prisma.document.findMany({
      where: { processingStatus: 'COMPLETED' },
      include: { chunks: true },
      take: 20
    });

    docs.forEach((doc: any) => {
      (doc.chunks || []).forEach((c: any) => {
        chunks.push({
          ...c,
          documentName: doc.originalFilename,
          documentId: doc.id
        });
      });
    });
  }

  return aiProvider.answerGroundedQuestion(query, chunks);
}

