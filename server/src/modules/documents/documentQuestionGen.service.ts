// server/src/modules/documents/documentQuestionGen.service.ts
// Document Practice Question Generator (MCQ, True/False, Fill in Blanks, Short, Long, Case-based)
import { getDbClient } from '../../services/prisma.ts';
import { aiProvider, type GeneratedQuestion } from '../../services/aiProvider.ts';
import { ApiError } from '../../utils/apiError.ts';

const prisma = getDbClient();

export async function generateDocumentQuestions(
  documentId: string,
  questionType: string = 'mcq',
  count: number = 5
): Promise<{
  documentId: string;
  questionType: string;
  totalQuestions: number;
  questions: GeneratedQuestion[];
}> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { pages: true }
  });

  if (!doc) {
    throw new ApiError(404, `Document not found with ID ${documentId}`);
  }

  const questions = aiProvider.generateQuestions(doc, questionType, count);

  return {
    documentId,
    questionType,
    totalQuestions: questions.length,
    questions
  };
}

