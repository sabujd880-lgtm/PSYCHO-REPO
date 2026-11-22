// server/src/modules/documents/chunking/chunker.ts
// Intelligent document chunker preserving paragraphs, sentence boundaries, and page references
import type { ExtractedPage } from '../extraction/types.ts';

export interface ChunkResult {
  pageReferences: number[];
  chunkText: string;
  sectionHeading: string;
  chunkIndex: number;
  tokenCount: number;
}

export interface ChunkerOptions {
  wordsPerChunk?: number;
  wordOverlap?: number;
}

export function chunkDocumentPages(
  pages: ExtractedPage[],
  options: ChunkerOptions = {}
): ChunkResult[] {
  const wordsPerChunk = options.wordsPerChunk || 350;
  const wordOverlap = options.wordOverlap || 50;

  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const pageNum = page.pageNumber;
    const heading = page.heading || `Page ${pageNum}`;
    const text = page.text.trim();

    if (!text) continue;

    // Split text into paragraphs first
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    let currentChunkWords: string[] = [];
    let currentParagraphs: string[] = [];

    const flushChunk = () => {
      if (currentChunkWords.length === 0) return;

      const chunkText = currentParagraphs.join('\n\n').trim();
      const tokenCount = Math.round(currentChunkWords.length * 1.33);

      chunks.push({
        pageReferences: [pageNum],
        chunkText,
        sectionHeading: heading,
        chunkIndex: chunkIndex++,
        tokenCount
      });

      // Keep overlap words from the end of the current chunk
      if (wordOverlap > 0 && currentChunkWords.length > wordOverlap) {
        const overlapSlice = currentChunkWords.slice(-wordOverlap);
        currentChunkWords = [...overlapSlice];
        currentParagraphs = [overlapSlice.join(' ')];
      } else {
        currentChunkWords = [];
        currentParagraphs = [];
      }
    };

    for (const para of paragraphs) {
      const paraWords = para.split(/\s+/).filter(Boolean);

      // If single paragraph is larger than target chunk size, split by sentences
      if (paraWords.length > wordsPerChunk) {
        // Flush any accumulated content
        if (currentChunkWords.length > 0) {
          flushChunk();
        }

        // Sentence splitting
        const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [para];
        let sentenceWords: string[] = [];
        let sentenceText: string[] = [];

        for (const sent of sentences) {
          const sWords = sent.trim().split(/\s+/).filter(Boolean);
          if (sentenceWords.length + sWords.length > wordsPerChunk && sentenceWords.length > 0) {
            const chunkStr = sentenceText.join(' ').trim();
            chunks.push({
              pageReferences: [pageNum],
              chunkText: chunkStr,
              sectionHeading: heading,
              chunkIndex: chunkIndex++,
              tokenCount: Math.round(sentenceWords.length * 1.33)
            });

            const overlap = sentenceWords.slice(-wordOverlap);
            sentenceWords = [...overlap, ...sWords];
            sentenceText = [overlap.join(' '), sent.trim()];
          } else {
            sentenceWords.push(...sWords);
            sentenceText.push(sent.trim());
          }
        }

        if (sentenceWords.length > 0) {
          chunks.push({
            pageReferences: [pageNum],
            chunkText: sentenceText.join(' ').trim(),
            sectionHeading: heading,
            chunkIndex: chunkIndex++,
            tokenCount: Math.round(sentenceWords.length * 1.33)
          });
        }
      } else if (currentChunkWords.length + paraWords.length > wordsPerChunk) {
        flushChunk();
        currentChunkWords.push(...paraWords);
        currentParagraphs.push(para);
      } else {
        currentChunkWords.push(...paraWords);
        currentParagraphs.push(para);
      }
    }

    if (currentChunkWords.length > 0) {
      flushChunk();
    }
  }

  // Fallback: If document was entirely blank or no chunks produced
  if (chunks.length === 0 && pages.length > 0) {
    chunks.push({
      pageReferences: [1],
      chunkText: pages[0].text || '[Document content]',
      sectionHeading: pages[0].heading || 'Overview',
      chunkIndex: 0,
      tokenCount: 20
    });
  }

  return chunks;
}

