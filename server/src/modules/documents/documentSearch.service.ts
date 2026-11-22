// server/src/modules/documents/documentSearch.service.ts
// Search engine for Document Intelligence: searches titles, pages, and chunks with snippets
import { getDbClient } from '../../services/prisma.ts';

const prisma = getDbClient();

export interface SearchResultItem {
  documentId: string;
  documentName: string;
  pageNumber: number;
  sectionHeading: string;
  snippet: string;
  matchScore: number;
}

export async function searchDocuments(
  query: string,
  documentId?: string,
  limit: number = 20
): Promise<{ query: string; results: SearchResultItem[]; total: number }> {
  if (!query || !query.trim()) {
    return { query: '', results: [], total: 0 };
  }

  const cleanQuery = query.toLowerCase().trim();
  const tokens = cleanQuery.split(/\s+/).filter(t => t.length > 2);

  // Retrieve chunks
  const chunkFilter: any = {};
  if (documentId) {
    chunkFilter.documentId = documentId;
  }

  const chunks = await prisma.documentChunk.findMany({
    where: chunkFilter,
    take: 300
  });

  // Get document names map
  const docIds = [...new Set(chunks.map((c: any) => c.documentId))];
  const docs = await prisma.document.findMany({
    where: { id: { in: docIds } }
  });
  const docMap = new Map<string, string>();
  docs.forEach((d: any) => {
    docMap.set(d.id, d.originalFilename);
  });

  // Score matches
  const matchedItems: SearchResultItem[] = [];

  for (const chunk of chunks) {
    const textLower = (chunk.chunkText || '').toLowerCase();
    const headingLower = (chunk.sectionHeading || '').toLowerCase();
    let score = 0;

    if (textLower.includes(cleanQuery)) {
      score += 40;
    }

    tokens.forEach(t => {
      const regex = new RegExp(`\\b${t}\\b`, 'gi');
      const textMatches = textLower.match(regex);
      if (textMatches) score += textMatches.length * 3;
      if (headingLower.includes(t)) score += 6;
    });

    if (score > 0) {
      // Create contextual snippet around the match
      const idx = textLower.indexOf(cleanQuery);
      let snippet = '';
      if (idx !== -1) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(chunk.chunkText.length, idx + cleanQuery.length + 80);
        snippet = (start > 0 ? '...' : '') + chunk.chunkText.slice(start, end).replace(/\n/g, ' ') + (end < chunk.chunkText.length ? '...' : '');
      } else {
        snippet = chunk.chunkText.slice(0, 160).replace(/\n/g, ' ') + '...';
      }

      const pageNum = Array.isArray(chunk.pageReferences) && chunk.pageReferences.length > 0
        ? chunk.pageReferences[0]
        : 1;

      matchedItems.push({
        documentId: chunk.documentId,
        documentName: docMap.get(chunk.documentId) || 'Document',
        pageNumber: pageNum,
        sectionHeading: chunk.sectionHeading || `Page ${pageNum}`,
        snippet,
        matchScore: score
      });
    }
  }

  matchedItems.sort((a, b) => b.matchScore - a.matchScore);
  const results = matchedItems.slice(0, limit);

  return {
    query,
    results,
    total: results.length
  };
}

