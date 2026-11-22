// server/src/services/citationEngine.ts
// Universal Academic Citation Generator (APA 7th, BibTeX, MLA 9th, Chicago 17th, Vancouver, RIS)

export interface CitationItem {
  id?: string;
  title: string;
  authors?: string | string[];
  authorNames?: string;
  author_names?: string;
  year?: number | string;
  publicationYear?: number | string;
  publication_year?: number | string;
  publisher?: string;
  journal?: string;
  volume?: string | number;
  issue?: string | number;
  pages?: string;
  doi?: string;
  url?: string;
  referenceUrl?: string;
  reference_url?: string;
  publicationType?: string;
  publication_type?: string;
}

export interface FormattedCitations {
  apa: string;
  bibtex: string;
  mla: string;
  chicago: string;
  vancouver: string;
  ris: string;
}

export class CitationEngine {
  /**
   * Parse authors into an array of "Last, First" or "Last, F." structures
   */
  static parseAuthors(rawAuthors?: string | string[]): string[] {
    if (!rawAuthors) return ['Anonymous'];
    if (Array.isArray(rawAuthors)) return rawAuthors.map(a => a.trim()).filter(Boolean);

    // If string is semicolon or "and" separated
    const parts = rawAuthors
      .split(/;\s*|\s+and\s+/i)
      .map(p => p.trim())
      .filter(Boolean);

    if (parts.length > 0) return parts;
    return [rawAuthors.trim()];
  }

  /**
   * Format authors for APA 7th (e.g., "Baddeley, A., & Hitch, G.")
   */
  static formatApaAuthors(authors: string[]): string {
    if (authors.length === 0) return 'Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]}, & ${authors[1]}`;
    if (authors.length <= 20) {
      const allExceptLast = authors.slice(0, -1).join(', ');
      return `${allExceptLast}, & ${authors[authors.length - 1]}`;
    }
    const first19 = authors.slice(0, 19).join(', ');
    return `${first19}, ... ${authors[authors.length - 1]}`;
  }

  /**
   * Format authors for MLA 9th (e.g., "Baddeley, Alan, and Graham Hitch.")
   */
  static formatMlaAuthors(authors: string[]): string {
    if (authors.length === 0) return 'Author.';
    if (authors.length === 1) return `${authors[0]}.`;
    if (authors.length === 2) return `${authors[0]}, and ${authors[1]}.`;
    return `${authors[0]}, et al.`;
  }

  /**
   * Format APA 7th Edition Citation
   */
  static toApa7(item: CitationItem): string {
    const rawAuthors = item.authorNames || item.author_names || item.authors;
    const authorsList = this.parseAuthors(rawAuthors);
    const authorStr = this.formatApaAuthors(authorsList);
    const yearStr = item.publicationYear || item.publication_year || item.year || 'n.d.';
    const title = item.title.trim().replace(/\.$/, '');
    const pubType = (item.publicationType || item.publication_type || '').toLowerCase();
    const doiStr = item.doi ? ` https://doi.org/${item.doi.replace(/^https?:\/\/doi\.org\//, '')}` : '';
    const urlStr = (!item.doi && (item.url || item.referenceUrl || item.reference_url)) 
      ? ` ${item.url || item.referenceUrl || item.reference_url}` 
      : '';

    if (pubType.includes('journal') || item.journal) {
      const journal = item.journal || 'Journal of Psychological Science';
      const vol = item.volume ? `, ${item.volume}` : '';
      const iss = item.issue ? `(${item.issue})` : '';
      const pgs = item.pages ? `, ${item.pages}` : '';
      return `${authorStr} (${yearStr}). ${title}. ${journal}${vol}${iss}${pgs}.${doiStr || urlStr}`;
    }

    if (pubType.includes('manual') || pubType.includes('guideline')) {
      const publisher = item.publisher || 'American Psychological Association';
      return `${authorStr} (${yearStr}). ${title}.${publisher ? ` ${publisher}.` : ''}${doiStr || urlStr}`;
    }

    // Default Book / Textbook
    const publisher = item.publisher || 'Academic Press';
    return `${authorStr} (${yearStr}). ${title}.${publisher ? ` ${publisher}.` : ''}${doiStr || urlStr}`;
  }

  /**
   * Format BibTeX Entry
   */
  static toBibtex(item: CitationItem): string {
    const rawAuthors = item.authorNames || item.author_names || item.authors;
    const authorsList = this.parseAuthors(rawAuthors);
    const authorStr = authorsList.join(' and ');
    const yearStr = item.publicationYear || item.publication_year || item.year || '2024';
    const cleanTitle = item.title.trim().replace(/[{}]/g, '');
    const firstAuthorLastName = (authorsList[0] || 'ref').split(/[\s,]+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const citeKey = `${firstAuthorLastName}${yearStr}${item.id ? `_${item.id.substring(0, 6)}` : ''}`;
    const pubType = (item.publicationType || item.publication_type || '').toLowerCase();

    if (pubType.includes('journal') || item.journal) {
      let bib = `@article{${citeKey},\n`;
      bib += `  author = {${authorStr}},\n`;
      bib += `  title = {${cleanTitle}},\n`;
      bib += `  journal = {${item.journal || 'Psychological Science'}},\n`;
      bib += `  year = {${yearStr}}`;
      if (item.volume) bib += `,\n  volume = {${item.volume}}`;
      if (item.issue) bib += `,\n  number = {${item.issue}}`;
      if (item.pages) bib += `,\n  pages = {${item.pages}}`;
      if (item.doi) bib += `,\n  doi = {${item.doi}}`;
      bib += '\n}';
      return bib;
    }

    // Book / Manual
    const entryType = pubType.includes('manual') ? 'manual' : 'book';
    let bib = `@${entryType}{${citeKey},\n`;
    bib += `  author = {${authorStr}},\n`;
    bib += `  title = {${cleanTitle}},\n`;
    bib += `  year = {${yearStr}}`;
    if (item.publisher) bib += `,\n  publisher = {${item.publisher}}`;
    if (item.doi) bib += `,\n  doi = {${item.doi}}`;
    if (item.url || item.reference_url) bib += `,\n  url = {${item.url || item.reference_url}}`;
    bib += '\n}';
    return bib;
  }

  /**
   * Format MLA 9th Edition
   */
  static toMla9(item: CitationItem): string {
    const rawAuthors = item.authorNames || item.author_names || item.authors;
    const authorsList = this.parseAuthors(rawAuthors);
    const authorStr = this.formatMlaAuthors(authorsList);
    const title = item.title.trim().replace(/\.$/, '');
    const yearStr = item.publicationYear || item.publication_year || item.year || 'n.d.';
    const pubType = (item.publicationType || item.publication_type || '').toLowerCase();
    const doiStr = item.doi ? ` https://doi.org/${item.doi.replace(/^https?:\/\/doi\.org\//, '')}.` : '';

    if (pubType.includes('journal') || item.journal) {
      const journal = item.journal || 'Journal of Psychological Science';
      const vol = item.volume ? ` vol. ${item.volume}` : '';
      const iss = item.issue ? `, no. ${item.issue}` : '';
      const pgs = item.pages ? `, pp. ${item.pages}` : '';
      return `${authorStr} "${title}." ${journal}${vol}${iss}, ${yearStr}${pgs}.${doiStr}`;
    }

    const publisher = item.publisher || 'Academic Press';
    return `${authorStr} ${title}. ${publisher}, ${yearStr}.${doiStr}`;
  }

  /**
   * Format Chicago 17th Edition (Author-Date)
   */
  static toChicago17(item: CitationItem): string {
    const rawAuthors = item.authorNames || item.author_names || item.authors;
    const authorsList = this.parseAuthors(rawAuthors);
    const authorStr = authorsList.length > 0 ? authorsList.join(', ') : 'Author';
    const yearStr = item.publicationYear || item.publication_year || item.year || 'n.d.';
    const title = item.title.trim().replace(/\.$/, '');
    const pubType = (item.publicationType || item.publication_type || '').toLowerCase();
    const doiStr = item.doi ? ` https://doi.org/${item.doi}.` : '';

    if (pubType.includes('journal') || item.journal) {
      const journal = item.journal || 'Psychological Science';
      const vol = item.volume ? ` ${item.volume}` : '';
      const iss = item.issue ? `, no. ${item.issue}` : '';
      const pgs = item.pages ? `: ${item.pages}` : '';
      return `${authorStr}. ${yearStr}. "${title}." ${journal}${vol}${iss}${pgs}.${doiStr}`;
    }

    const publisher = item.publisher || 'Academic Press';
    return `${authorStr}. ${yearStr}. ${title}. ${publisher}.${doiStr}`;
  }

  /**
   * Format Vancouver Style (NLM Numeric)
   */
  static toVancouver(item: CitationItem): string {
    const rawAuthors = item.authorNames || item.author_names || item.authors;
    const authorsList = this.parseAuthors(rawAuthors);
    const authorStr = authorsList.slice(0, 6).join(', ') + (authorsList.length > 6 ? ', et al.' : '');
    const title = item.title.trim().replace(/\.$/, '');
    const yearStr = item.publicationYear || item.publication_year || item.year || '2024';
    const pubType = (item.publicationType || item.publication_type || '').toLowerCase();

    if (pubType.includes('journal') || item.journal) {
      const journal = item.journal || 'Psychol Sci';
      const vol = item.volume ? `${item.volume}` : '';
      const iss = item.issue ? `(${item.issue})` : '';
      const pgs = item.pages ? `:${item.pages}` : '';
      return `${authorStr}. ${title}. ${journal}. ${yearStr};${vol}${iss}${pgs}.`;
    }

    const publisher = item.publisher || 'Academic Press';
    return `${authorStr}. ${title}. ${publisher}; ${yearStr}.`;
  }

  /**
   * Format RIS (Research Information Systems) Export
   */
  static toRis(item: CitationItem): string {
    const pubType = (item.publicationType || item.publication_type || '').toLowerCase();
    const typeTag = (pubType.includes('journal') || item.journal) ? 'JOUR' : 'BOOK';
    const rawAuthors = item.authorNames || item.author_names || item.authors;
    const authorsList = this.parseAuthors(rawAuthors);
    const yearStr = item.publicationYear || item.publication_year || item.year || '';

    const lines: string[] = [
      `TY  - ${typeTag}`,
      `TI  - ${item.title}`
    ];

    authorsList.forEach(a => {
      lines.push(`AU  - ${a}`);
    });

    if (yearStr) lines.push(`PY  - ${yearStr}`);
    if (item.publisher) lines.push(`PB  - ${item.publisher}`);
    if (item.journal) lines.push(`JO  - ${item.journal}`);
    if (item.volume) lines.push(`VL  - ${item.volume}`);
    if (item.issue) lines.push(`IS  - ${item.issue}`);
    if (item.pages) lines.push(`SP  - ${item.pages}`);
    if (item.doi) lines.push(`DO  - ${item.doi}`);
    if (item.url || item.reference_url) lines.push(`UR  - ${item.url || item.reference_url}`);
    lines.push('ER  - ');

    return lines.join('\r\n');
  }

  /**
   * Generate all 6 standard formats for any resource or article
   */
  static generateFormattedCitations(item: CitationItem): FormattedCitations {
    return {
      apa: this.toApa7(item),
      bibtex: this.toBibtex(item),
      mla: this.toMla9(item),
      chicago: this.toChicago17(item),
      vancouver: this.toVancouver(item),
      ris: this.toRis(item)
    };
  }
}

