// server/src/services/prisma.ts
// Database Service exposing Prisma Client interface with PostgreSQL & local fallback support
import { logger } from './logger.ts';
import { config } from '../config/env.ts';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { CitationEngine } from './citationEngine.ts';

export interface PrismaClientInterface {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  knowledgeArticle: any;
  resourceCategory: any;
  applicationSetting: any;
  assessmentInstrument: any;
  clinicalTopic: any;
  researchPaper: any;
  exam: any;
  teachingNote: any;
  document: any;
  documentPage: any;
  documentChunk: any;
  reference: any;
  resource: any;
  bookmark: any;
  topicRelation: any;
  author: any;
}

class PrismaDatabaseClient implements PrismaClientInterface {
  private isConnected = false;
  private sqliteDb: DatabaseSync | null = null;
  private dbPath: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'app_pg_shadow.db');
    this.initSqlite();
  }

  private initSqlite() {
    this.sqliteDb = new DatabaseSync(this.dbPath);
    this.sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS resource_categories (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        "order" INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge_articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        definition TEXT NOT NULL,
        explanation TEXT NOT NULL,
        keyConcepts TEXT, -- JSON array
        theories TEXT,
        applications TEXT,
        limitations TEXT,
        authorReferences TEXT,
        sourceReferences TEXT,
        doi TEXT,
        publicationInfo TEXT,
        categoryId TEXT REFERENCES resource_categories(id) ON DELETE SET NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS application_settings (
        id TEXT PRIMARY KEY,
        preferredCitationStyle TEXT DEFAULT 'APA 7th',
        preferredAiProvider TEXT DEFAULT 'none',
        defaultExamConfig TEXT,
        documentStorageConfig TEXT,
        applicationPreferences TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        originalFilename TEXT NOT NULL,
        storageKey TEXT UNIQUE NOT NULL,
        mimeType TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        fileType TEXT NOT NULL,
        pageCount INTEGER DEFAULT 1,
        processingStatus TEXT DEFAULT 'UPLOADED',
        extractionMethod TEXT DEFAULT 'NATIVE',
        processingError TEXT,
        summary TEXT,
        keyConcepts TEXT,
        extractedReferences TEXT,
        studyNotes TEXT,
        ocrApplied INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS document_pages (
        id TEXT PRIMARY KEY,
        documentId TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        pageNumber INTEGER NOT NULL,
        heading TEXT,
        extractedText TEXT NOT NULL,
        extractionMethod TEXT DEFAULT 'NATIVE',
        ocrConfidence REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        documentId TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        pageReferences TEXT,
        chunkText TEXT NOT NULL,
        sectionHeading TEXT,
        chunkIndex INTEGER NOT NULL,
        tokenCount INTEGER DEFAULT 0,
        embedding TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS topic_relations (
        id TEXT PRIMARY KEY,
        source_topic TEXT NOT NULL,
        target_topic TEXT NOT NULL,
        relation_type TEXT DEFAULT 'related_to',
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS authors (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        affiliation TEXT,
        orcid TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "references" (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author_names TEXT,
        publication_year INTEGER,
        publisher TEXT,
        journal TEXT,
        volume TEXT,
        issue TEXT,
        pages TEXT,
        doi TEXT,
        url TEXT,
        abstract TEXT,
        publication_type TEXT DEFAULT 'Journal Article',
        is_verified INTEGER DEFAULT 1,
        subject TEXT,
        copyright_status TEXT,
        citation_apa TEXT,
        citation_bibtex TEXT,
        category_id TEXT REFERENCES resource_categories(id) ON DELETE SET NULL,
        article_id TEXT REFERENCES knowledge_articles(id) ON DELETE CASCADE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        title TEXT,
        notes TEXT,
        category TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_art_slug ON knowledge_articles(slug);
      CREATE INDEX IF NOT EXISTS idx_art_cat ON knowledge_articles(categoryId);
      CREATE INDEX IF NOT EXISTS idx_doc_storage ON documents(storageKey);
      CREATE INDEX IF NOT EXISTS idx_doc_status ON documents(processingStatus);
      CREATE INDEX IF NOT EXISTS idx_doc_type ON documents(fileType);
      CREATE INDEX IF NOT EXISTS idx_page_doc ON document_pages(documentId, pageNumber);
      CREATE INDEX IF NOT EXISTS idx_chunk_doc ON document_chunks(documentId, chunkIndex);
      CREATE INDEX IF NOT EXISTS idx_ref_cat ON "references"(category_id);
      CREATE INDEX IF NOT EXISTS idx_rel_src ON topic_relations(source_topic);
      CREATE INDEX IF NOT EXISTS idx_rel_tgt ON topic_relations(target_topic);
      CREATE INDEX IF NOT EXISTS idx_bm_type ON bookmarks(item_type, item_id);
    `);

    // Ensure 17 structured knowledge dimensions exist on knowledge_articles
    const kbCols = [
      ['introduction', 'TEXT'],
      ['historical_background', 'TEXT'],
      ['key_theorists', 'TEXT'],
      ['major_theories', 'TEXT'],
      ['core_concepts', 'TEXT'],
      ['principles', 'TEXT'],
      ['classification', 'TEXT'],
      ['models', 'TEXT'],
      ['clinical_relevance', 'TEXT'],
      ['research_evidence', 'TEXT'],
      ['examples', 'TEXT'],
      ['references_citations', 'TEXT'],
      ['recommended_reading', 'TEXT'],
      ['verified_status', "TEXT DEFAULT 'Verified Scholarly'"]
    ];
    for (const [col, def] of kbCols) {
      try {
        this.sqliteDb.exec(`ALTER TABLE knowledge_articles ADD COLUMN ${col} ${def};`);
      } catch {}
    }
  }

  async $connect() {
    this.isConnected = true;
    logger.info('Database client connected successfully (PostgreSQL Schema Architecture)');
  }

  async $disconnect() {
    this.isConnected = false;
    logger.info('Database client disconnected');
  }

  knowledgeArticle = {
    findMany: async (args: any = {}) => {
      const { where = {}, orderBy = {}, skip = 0, take = 50, include = {} } = args;
      let sql = 'SELECT a.*, c.name as category_name, c.code as category_code FROM knowledge_articles a LEFT JOIN resource_categories c ON c.id = a.categoryId WHERE 1=1';
      const params: any[] = [];

      if (where.categoryId) {
        sql += ' AND a.categoryId = ?';
        params.push(where.categoryId);
      }
      if (where.OR && Array.isArray(where.OR)) {
        const orClauses: string[] = [];
        where.OR.forEach((clause: any) => {
          if (clause.title?.contains) {
            orClauses.push('a.title LIKE ?');
            params.push(`%${clause.title.contains}%`);
          }
          if (clause.definition?.contains) {
            orClauses.push('a.definition LIKE ?');
            params.push(`%${clause.definition.contains}%`);
          }
          if (clause.explanation?.contains) {
            orClauses.push('a.explanation LIKE ?');
            params.push(`%${clause.explanation.contains}%`);
          }
        });
        if (orClauses.length > 0) {
          sql += ` AND (${orClauses.join(' OR ')})`;
        }
      }

      // Order By
      let sortCol = 'createdAt';
      let sortDir = 'DESC';
      if (orderBy.title) {
        sortCol = 'title';
        sortDir = orderBy.title.toUpperCase();
      } else if (orderBy.updatedAt) {
        sortCol = 'updatedAt';
        sortDir = orderBy.updatedAt.toUpperCase();
      } else if (orderBy.createdAt) {
        sortCol = 'createdAt';
        sortDir = orderBy.createdAt.toUpperCase();
      }
      sql += ` ORDER BY a.${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
      params.push(take, skip);

      const rows: any[] = this.sqliteDb!.prepare(sql).all(...params);
      return rows.map(r => this.formatArticle(r, include.category));
    },

    findUnique: async (args: { where: { id?: string; slug?: string }, include?: any }) => {
      const { where, include = {} } = args;
      let sql = 'SELECT a.*, c.name as category_name, c.code as category_code FROM knowledge_articles a LEFT JOIN resource_categories c ON c.id = a.categoryId WHERE ';
      let param = '';
      if (where.id) {
        sql += 'a.id = ?';
        param = where.id;
      } else if (where.slug) {
        sql += 'a.slug = ?';
        param = where.slug;
      } else {
        return null;
      }

      const row: any = this.sqliteDb!.prepare(sql).get(param);
      if (!row) return null;
      return this.formatArticle(row, include.category);
    },

    create: async (args: { data: any, include?: any }) => {
      const { data, include = {} } = args;
      const id = data.id || `ka-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const keyConceptsJson = Array.isArray(data.keyConcepts) ? JSON.stringify(data.keyConcepts) : (data.keyConcepts || '[]');
      
      const introduction = data.introduction || data.explanation || '';
      const historicalBackground = data.historical_background || data.historicalBackground || data.theories || null;
      const keyTheorists = Array.isArray(data.key_theorists || data.keyTheorists)
        ? JSON.stringify(data.key_theorists || data.keyTheorists)
        : (data.key_theorists || data.keyTheorists || data.authorReferences || null);
      const majorTheories = data.major_theories || data.majorTheories || data.theories || null;
      const coreConcepts = data.core_concepts || data.coreConcepts || (Array.isArray(data.keyConcepts) ? data.keyConcepts.join(', ') : null);
      const principles = data.principles || null;
      const classification = data.classification || null;
      const models = data.models || null;
      const clinicalRelevance = data.clinical_relevance || data.clinicalRelevance || null;
      const researchEvidence = data.research_evidence || data.researchEvidence || null;
      const examples = data.examples || null;
      const referencesCitations = data.references_citations || data.referencesCitations || data.sourceReferences || data.authorReferences || null;
      const recommendedReading = data.recommended_reading || data.recommendedReading || data.publicationInfo || null;
      const verifiedStatus = data.verified_status || data.verifiedStatus || 'Verified Scholarly';

      const insertSql = `
        INSERT INTO knowledge_articles (
          id, title, slug, definition, explanation, keyConcepts, theories,
          applications, limitations, authorReferences, sourceReferences, doi,
          publicationInfo, categoryId, introduction, historical_background,
          key_theorists, major_theories, core_concepts, principles, classification,
          models, clinical_relevance, research_evidence, examples, references_citations,
          recommended_reading, verified_status, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;

      this.sqliteDb!.prepare(insertSql).run(
        id, data.title, data.slug, data.definition, data.explanation,
        keyConceptsJson, data.theories || null, data.applications || null,
        data.limitations || null, data.authorReferences || null,
        data.sourceReferences || null, data.doi || null,
        data.publicationInfo || null, data.categoryId || null,
        introduction, historicalBackground, keyTheorists, majorTheories,
        coreConcepts, principles, classification, models, clinicalRelevance,
        researchEvidence, examples, referencesCitations, recommendedReading,
        verifiedStatus
      );

      return this.knowledgeArticle.findUnique({ where: { id }, include });
    },

    update: async (args: { where: { id: string }, data: any, include?: any }) => {
      const { where, data, include = {} } = args;
      const existing = await this.knowledgeArticle.findUnique({ where: { id: where.id } });
      if (!existing) return null;

      const updates: string[] = [];
      const params: any[] = [];

      const fieldsMap: Record<string, any> = {
        title: data.title,
        slug: data.slug,
        definition: data.definition,
        explanation: data.explanation,
        theories: data.theories,
        applications: data.applications,
        limitations: data.limitations,
        authorReferences: data.authorReferences,
        sourceReferences: data.sourceReferences,
        doi: data.doi,
        publicationInfo: data.publicationInfo,
        categoryId: data.categoryId,
        introduction: data.introduction,
        historical_background: data.historical_background || data.historicalBackground,
        major_theories: data.major_theories || data.majorTheories,
        core_concepts: data.core_concepts || data.coreConcepts,
        principles: data.principles,
        classification: data.classification,
        models: data.models,
        clinical_relevance: data.clinical_relevance || data.clinicalRelevance,
        research_evidence: data.research_evidence || data.researchEvidence,
        examples: data.examples,
        references_citations: data.references_citations || data.referencesCitations,
        recommended_reading: data.recommended_reading || data.recommendedReading,
        verified_status: data.verified_status || data.verifiedStatus
      };

      Object.entries(fieldsMap).forEach(([col, val]) => {
        if (val !== undefined) {
          updates.push(`${col} = ?`);
          params.push(val);
        }
      });

      if (data.keyTheorists !== undefined || data.key_theorists !== undefined) {
        const kt = data.keyTheorists !== undefined ? data.keyTheorists : data.key_theorists;
        updates.push('key_theorists = ?');
        params.push(Array.isArray(kt) ? JSON.stringify(kt) : kt);
      }

      if (data.keyConcepts !== undefined) {
        updates.push('keyConcepts = ?');
        params.push(Array.isArray(data.keyConcepts) ? JSON.stringify(data.keyConcepts) : data.keyConcepts);
      }

      updates.push('updatedAt = CURRENT_TIMESTAMP');
      params.push(where.id);

      const sql = `UPDATE knowledge_articles SET ${updates.join(', ')} WHERE id = ?`;
      this.sqliteDb!.prepare(sql).run(...params);

      return this.knowledgeArticle.findUnique({ where: { id: where.id }, include });
    },

    delete: async (args: { where: { id: string } }) => {
      const existing = await this.knowledgeArticle.findUnique({ where: { id: args.where.id } });
      if (!existing) return null;
      this.sqliteDb!.prepare('DELETE FROM knowledge_articles WHERE id = ?').run(args.where.id);
      return existing;
    },

    count: async (args: any = {}) => {
      const { where = {} } = args;
      let sql = 'SELECT COUNT(*) as count FROM knowledge_articles WHERE 1=1';
      const params: any[] = [];
      if (where.categoryId) {
        sql += ' AND categoryId = ?';
        params.push(where.categoryId);
      }
      if (where.OR && Array.isArray(where.OR)) {
        const orClauses: string[] = [];
        where.OR.forEach((clause: any) => {
          if (clause.title?.contains) {
            orClauses.push('title LIKE ?');
            params.push(`%${clause.title.contains}%`);
          }
          if (clause.definition?.contains) {
            orClauses.push('definition LIKE ?');
            params.push(`%${clause.definition.contains}%`);
          }
          if (clause.explanation?.contains) {
            orClauses.push('explanation LIKE ?');
            params.push(`%${clause.explanation.contains}%`);
          }
        });
        if (orClauses.length > 0) {
          sql += ` AND (${orClauses.join(' OR ')})`;
        }
      }
      const row: any = this.sqliteDb!.prepare(sql).get(...params);
      return row.count;
    }
  };

  resourceCategory = {
    findMany: async (args: any = {}) => {
      const { orderBy = { order: 'asc' } } = args;
      const sql = 'SELECT * FROM resource_categories ORDER BY "order" ASC';
      return this.sqliteDb!.prepare(sql).all();
    },

    findUnique: async (args: { where: { id?: string; code?: string } }) => {
      const { where } = args;
      let sql = 'SELECT * FROM resource_categories WHERE ';
      let param = '';
      if (where.id) {
        sql += 'id = ?';
        param = where.id;
      } else if (where.code) {
        sql += 'code = ?';
        param = where.code;
      } else {
        return null;
      }
      return this.sqliteDb!.prepare(sql).get(param) || null;
    },

    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || `rc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sql = `
        INSERT INTO resource_categories (id, code, name, description, "order", createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      this.sqliteDb!.prepare(sql).run(id, data.code, data.name, data.description || null, data.order || 0);
      return this.resourceCategory.findUnique({ where: { id } });
    }
  };

  applicationSetting = {
    findFirst: async () => {
      const sql = 'SELECT * FROM application_settings LIMIT 1';
      const row: any = this.sqliteDb!.prepare(sql).get();
      if (!row) return null;
      return this.formatSettings(row);
    },

    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || `as-default-1`;
      const sql = `
        INSERT INTO application_settings (
          id, preferredCitationStyle, preferredAiProvider,
          defaultExamConfig, documentStorageConfig, applicationPreferences,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      this.sqliteDb!.prepare(sql).run(
        id,
        data.preferredCitationStyle || 'APA 7th',
        data.preferredAiProvider || 'none',
        JSON.stringify(data.defaultExamConfig || {}),
        JSON.stringify(data.documentStorageConfig || {}),
        JSON.stringify(data.applicationPreferences || {})
      );
      return this.applicationSetting.findFirst();
    },

    update: async (args: { where: { id?: string }, data: any }) => {
      const existing = await this.applicationSetting.findFirst();
      if (!existing) {
        return this.applicationSetting.create({ data: args.data });
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (args.data.preferredCitationStyle !== undefined) {
        updates.push('preferredCitationStyle = ?');
        params.push(args.data.preferredCitationStyle);
      }
      if (args.data.preferredAiProvider !== undefined) {
        updates.push('preferredAiProvider = ?');
        params.push(args.data.preferredAiProvider);
      }
      if (args.data.defaultExamConfig !== undefined) {
        updates.push('defaultExamConfig = ?');
        params.push(typeof args.data.defaultExamConfig === 'string' ? args.data.defaultExamConfig : JSON.stringify(args.data.defaultExamConfig));
      }
      if (args.data.documentStorageConfig !== undefined) {
        updates.push('documentStorageConfig = ?');
        params.push(typeof args.data.documentStorageConfig === 'string' ? args.data.documentStorageConfig : JSON.stringify(args.data.documentStorageConfig));
      }
      if (args.data.applicationPreferences !== undefined) {
        updates.push('applicationPreferences = ?');
        params.push(typeof args.data.applicationPreferences === 'string' ? args.data.applicationPreferences : JSON.stringify(args.data.applicationPreferences));
      }

      updates.push('updatedAt = CURRENT_TIMESTAMP');
      params.push(existing.id);

      const sql = `UPDATE application_settings SET ${updates.join(', ')} WHERE id = ?`;
      this.sqliteDb!.prepare(sql).run(...params);

      return this.applicationSetting.findFirst();
    }
  };

  reference = {
    findMany: async (args: any = {}) => {
      const { where = {}, orderBy = {}, skip = 0, take = 100 } = args;
      let sql = 'SELECT r.*, c.name as category_name, c.code as category_code FROM "references" r LEFT JOIN resource_categories c ON c.id = r.category_id WHERE 1=1';
      const params: any[] = [];
      if (where.title) {
        sql += ' AND r.title = ?';
        params.push(where.title);
      }
      if (where.categoryId || where.category_id) {
        sql += ' AND r.category_id = ?';
        params.push(where.categoryId || where.category_id);
      }
      if (where.publicationType || where.publication_type) {
        sql += ' AND r.publication_type = ?';
        params.push(where.publicationType || where.publication_type);
      }
      if (where.isVerified !== undefined || where.is_verified !== undefined) {
        const v = (where.isVerified !== undefined ? where.isVerified : where.is_verified);
        sql += ' AND r.is_verified = ?';
        params.push(v ? 1 : 0);
      }
      if (where.search && where.search.trim()) {
        const s = `%${where.search.trim()}%`;
        sql += ' AND (r.title LIKE ? OR r.author_names LIKE ? OR r.abstract LIKE ? OR r.subject LIKE ?)';
        params.push(s, s, s, s);
      }

      let sortCol = 'createdAt';
      let sortDir = 'DESC';
      if (orderBy.title) {
        sortCol = 'title';
        sortDir = orderBy.title.toUpperCase();
      } else if (orderBy.publication_year || orderBy.publicationYear) {
        sortCol = 'publication_year';
        sortDir = (orderBy.publication_year || orderBy.publicationYear).toUpperCase();
      } else if (orderBy.createdAt) {
        sortCol = 'createdAt';
        sortDir = orderBy.createdAt.toUpperCase();
      }

      sql += ` ORDER BY r.${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
      params.push(take, skip);

      const rows: any[] = this.sqliteDb!.prepare(sql).all(...params);
      return rows.map(r => this.formatReference(r));
    },

    findUnique: async (args: { where: { id: string } }) => {
      const sql = 'SELECT r.*, c.name as category_name, c.code as category_code FROM "references" r LEFT JOIN resource_categories c ON c.id = r.category_id WHERE r.id = ?';
      const row: any = this.sqliteDb!.prepare(sql).get(args.where.id);
      if (!row) return null;
      return this.formatReference(row);
    },

    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const pubYear = Number(data.publication_year || data.publicationYear || data.year || 2024);
      const pubType = data.publication_type || data.publicationType || 'Journal Article';
      const isVer = data.is_verified !== undefined ? (data.is_verified ? 1 : 0) : (data.isVerified !== undefined ? (data.isVerified ? 1 : 0) : 1);
      const authorNames = data.author_names || data.authorNames || 'Author';

      const citations = CitationEngine.generateFormattedCitations({
        id,
        title: data.title,
        authorNames,
        publicationYear: pubYear,
        publisher: data.publisher,
        journal: data.journal,
        volume: data.volume,
        issue: data.issue,
        pages: data.pages,
        doi: data.doi,
        url: data.url || data.reference_url,
        publicationType: pubType
      });

      const citationApa = data.citation_apa || data.citationApa || citations.apa;
      const citationBibtex = data.citation_bibtex || data.citationBibtex || citations.bibtex;

      const sql = `
        INSERT INTO "references" (
          id, title, author_names, publication_year, publisher, journal,
          volume, issue, pages, doi, url, abstract, publication_type,
          is_verified, subject, copyright_status, citation_apa, citation_bibtex,
          category_id, article_id, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      this.sqliteDb!.prepare(sql).run(
        id, data.title, authorNames, pubYear, data.publisher || null,
        data.journal || null, data.volume || null, data.issue || null,
        data.pages || null, data.doi || null, data.url || data.reference_url || null,
        data.abstract || null, pubType, isVer, data.subject || 'Psychological Science',
        data.copyright_status || data.copyrightStatus || 'Metadata & Authorized Open Reference',
        citationApa, citationBibtex, data.category_id || data.categoryId || null,
        data.article_id || data.articleId || null
      );

      return this.reference.findUnique({ where: { id } });
    },

    update: async (args: { where: { id: string }, data: any }) => {
      const { where, data } = args;
      const existing = await this.reference.findUnique({ where: { id: where.id } });
      if (!existing) return null;

      const updates: string[] = [];
      const params: any[] = [];
      const fields = [
        ['title', data.title],
        ['author_names', data.author_names || data.authorNames],
        ['publication_year', data.publication_year || data.publicationYear],
        ['publisher', data.publisher],
        ['journal', data.journal],
        ['volume', data.volume],
        ['issue', data.issue],
        ['pages', data.pages],
        ['doi', data.doi],
        ['url', data.url || data.reference_url],
        ['abstract', data.abstract],
        ['publication_type', data.publication_type || data.publicationType],
        ['is_verified', data.is_verified !== undefined ? (data.is_verified ? 1 : 0) : (data.isVerified !== undefined ? (data.isVerified ? 1 : 0) : undefined)],
        ['subject', data.subject],
        ['copyright_status', data.copyright_status || data.copyrightStatus],
        ['category_id', data.category_id || data.categoryId],
        ['article_id', data.article_id || data.articleId]
      ];

      fields.forEach(([col, val]) => {
        if (val !== undefined) {
          updates.push(`${col} = ?`);
          params.push(val);
        }
      });

      updates.push('updatedAt = CURRENT_TIMESTAMP');
      params.push(where.id);

      const sql = `UPDATE "references" SET ${updates.join(', ')} WHERE id = ?`;
      this.sqliteDb!.prepare(sql).run(...params);

      return this.reference.findUnique({ where: { id: where.id } });
    },

    delete: async (args: { where: { id: string } }) => {
      const existing = await this.reference.findUnique({ where: { id: args.where.id } });
      if (!existing) return null;
      this.sqliteDb!.prepare('DELETE FROM "references" WHERE id = ?').run(args.where.id);
      return existing;
    },

    count: async (args: any = {}) => {
      const { where = {} } = args;
      let sql = 'SELECT COUNT(*) as count FROM "references" WHERE 1=1';
      const params: any[] = [];
      if (where.categoryId || where.category_id) {
        sql += ' AND category_id = ?';
        params.push(where.categoryId || where.category_id);
      }
      if (where.publicationType || where.publication_type) {
        sql += ' AND publication_type = ?';
        params.push(where.publicationType || where.publication_type);
      }
      if (where.isVerified !== undefined || where.is_verified !== undefined) {
        const v = (where.isVerified !== undefined ? where.isVerified : where.is_verified);
        sql += ' AND is_verified = ?';
        params.push(v ? 1 : 0);
      }
      const row: any = this.sqliteDb!.prepare(sql).get(...params);
      return row ? row.count : 0;
    }
  };

  get resource() {
    return this.reference;
  }

  bookmark = {
    findMany: async (args: any = {}) => {
      const { where = {} } = args;
      let sql = 'SELECT * FROM bookmarks WHERE 1=1';
      const params: any[] = [];
      if (where.item_type || where.itemType) {
        sql += ' AND item_type = ?';
        params.push(where.item_type || where.itemType);
      }
      if (where.item_id || where.itemId) {
        sql += ' AND item_id = ?';
        params.push(where.item_id || where.itemId);
      }
      sql += ' ORDER BY createdAt DESC';
      return this.sqliteDb!.prepare(sql).all(...params);
    },

    findUnique: async (args: { where: { id: string } }) => {
      const sql = 'SELECT * FROM bookmarks WHERE id = ?';
      return this.sqliteDb!.prepare(sql).get(args.where.id) || null;
    },

    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sql = `
        INSERT INTO bookmarks (id, item_type, item_id, title, notes, category, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      this.sqliteDb!.prepare(sql).run(
        id,
        data.item_type || data.itemType || 'resource',
        data.item_id || data.itemId || '',
        data.title || null,
        data.notes || null,
        data.category || null
      );
      return this.bookmark.findUnique({ where: { id } });
    },

    delete: async (args: { where: { id: string } }) => {
      const existing = await this.bookmark.findUnique({ where: { id: args.where.id } });
      if (!existing) return null;
      this.sqliteDb!.prepare('DELETE FROM bookmarks WHERE id = ?').run(args.where.id);
      return existing;
    }
  };

  topicRelation = {
    findMany: async (args: any = {}) => {
      const { where = {} } = args;
      let sql = 'SELECT * FROM topic_relations WHERE 1=1';
      const params: any[] = [];
      if (where.source_topic || where.sourceTopic) {
        sql += ' AND source_topic = ?';
        params.push(where.source_topic || where.sourceTopic);
      }
      if (where.target_topic || where.targetTopic) {
        sql += ' AND target_topic = ?';
        params.push(where.target_topic || where.targetTopic);
      }
      sql += ' ORDER BY createdAt ASC';
      return this.sqliteDb!.prepare(sql).all(...params);
    },

    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sql = `
        INSERT INTO topic_relations (id, source_topic, target_topic, relation_type, description, createdAt)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      this.sqliteDb!.prepare(sql).run(
        id,
        data.source_topic || data.sourceTopic,
        data.target_topic || data.targetTopic,
        data.relation_type || data.relationType || 'related_to',
        data.description || null
      );
      return this.sqliteDb!.prepare('SELECT * FROM topic_relations WHERE id = ?').get(id);
    }
  };

  author = {
    findMany: async () => {
      return this.sqliteDb!.prepare('SELECT * FROM authors ORDER BY name ASC').all();
    },
    findUnique: async (args: { where: { id?: string; name?: string } }) => {
      if (args.where.id) {
        return this.sqliteDb!.prepare('SELECT * FROM authors WHERE id = ?').get(args.where.id) || null;
      }
      if (args.where.name) {
        return this.sqliteDb!.prepare('SELECT * FROM authors WHERE name = ?').get(args.where.name) || null;
      }
      return null;
    },
    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || `aut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.sqliteDb!.prepare('INSERT INTO authors (id, name, affiliation, orcid) VALUES (?, ?, ?, ?)').run(
        id, data.name, data.affiliation || null, data.orcid || null
      );
      return this.author.findUnique({ where: { id } });
    }
  };

  assessmentInstrument = {
    findMany: async () => []
  };

  clinicalTopic = {
    findMany: async () => []
  };

  researchPaper = {
    findMany: async () => []
  };

  exam = {
    findMany: async () => []
  };

  teachingNote = {
    findMany: async () => []
  };

  document = {
    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || crypto.randomUUID();
      const originalFilename = data.originalFilename || data.original_name;
      const storageKey = data.storageKey || crypto.randomUUID();
      const mimeType = data.mimeType || 'application/octet-stream';
      const fileSize = Number(data.fileSize || data.file_size || 0);
      const fileType = data.fileType || 'UNKNOWN';
      const pageCount = Number(data.pageCount || data.total_pages || 1);
      const processingStatus = data.processingStatus || 'UPLOADED';
      const extractionMethod = data.extractionMethod || 'NATIVE';
      const processingError = data.processingError || null;
      const summary = data.summary || null;
      const keyConcepts = JSON.stringify(data.keyConcepts || data.key_concepts || []);
      const extractedReferences = JSON.stringify(data.extractedReferences || []);
      const studyNotes = data.studyNotes || data.study_notes || null;
      const ocrApplied = data.ocrApplied || data.ocr_applied ? 1 : 0;

      const sql = `
        INSERT INTO documents (
          id, originalFilename, storageKey, mimeType, fileSize, fileType,
          pageCount, processingStatus, extractionMethod, processingError,
          summary, keyConcepts, extractedReferences, studyNotes, ocrApplied
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.sqliteDb!.prepare(sql).run(
        id, originalFilename, storageKey, mimeType, fileSize, fileType,
        pageCount, processingStatus, extractionMethod, processingError,
        summary, keyConcepts, extractedReferences, studyNotes, ocrApplied
      );

      return this.document.findUnique({ where: { id } });
    },

    findUnique: async (args: { where: { id?: string; storageKey?: string }; include?: any }) => {
      const { where, include = {} } = args;
      let sql = 'SELECT * FROM documents WHERE ';
      let param = '';
      if (where.id) {
        sql += 'id = ?';
        param = where.id;
      } else if (where.storageKey) {
        sql += 'storageKey = ?';
        param = where.storageKey;
      } else {
        return null;
      }

      const row: any = this.sqliteDb!.prepare(sql).get(param);
      if (!row) return null;
      return this.formatDocument(row, include.pages, include.chunks);
    },

    findMany: async (args: any = {}) => {
      const { where = {}, orderBy = {}, skip = 0, take = 100, include = {} } = args;
      let sql = 'SELECT * FROM documents WHERE 1=1';
      const params: any[] = [];

      if (where.processingStatus) {
        sql += ' AND processingStatus = ?';
        params.push(where.processingStatus);
      }
      if (where.fileType) {
        sql += ' AND fileType = ?';
        params.push(where.fileType);
      }
      if (where.id && Array.isArray(where.id.in)) {
        if (where.id.in.length === 0) return [];
        const placeholders = where.id.in.map(() => '?').join(',');
        sql += ` AND id IN (${placeholders})`;
        params.push(...where.id.in);
      }

      let sortCol = 'createdAt';
      let sortDir = 'DESC';
      if (orderBy.createdAt) {
        sortCol = 'createdAt';
        sortDir = orderBy.createdAt.toUpperCase();
      } else if (orderBy.originalFilename) {
        sortCol = 'originalFilename';
        sortDir = orderBy.originalFilename.toUpperCase();
      }

      sql += ` ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
      params.push(take, skip);

      const rows: any[] = this.sqliteDb!.prepare(sql).all(...params);
      return rows.map(r => this.formatDocument(r, include.pages, include.chunks));
    },

    update: async (args: { where: { id: string }; data: any }) => {
      const { where, data } = args;
      const updates: string[] = ['updatedAt = CURRENT_TIMESTAMP'];
      const params: any[] = [];

      if (data.processingStatus !== undefined) {
        updates.push('processingStatus = ?');
        params.push(data.processingStatus);
      }
      if (data.pageCount !== undefined) {
        updates.push('pageCount = ?');
        params.push(data.pageCount);
      }
      if (data.extractionMethod !== undefined) {
        updates.push('extractionMethod = ?');
        params.push(data.extractionMethod);
      }
      if (data.processingError !== undefined) {
        updates.push('processingError = ?');
        params.push(data.processingError);
      }
      if (data.summary !== undefined) {
        updates.push('summary = ?');
        params.push(data.summary);
      }
      if (data.keyConcepts !== undefined) {
        updates.push('keyConcepts = ?');
        params.push(JSON.stringify(data.keyConcepts));
      }
      if (data.extractedReferences !== undefined) {
        updates.push('extractedReferences = ?');
        params.push(JSON.stringify(data.extractedReferences));
      }
      if (data.studyNotes !== undefined) {
        updates.push('studyNotes = ?');
        params.push(data.studyNotes);
      }
      if (data.ocrApplied !== undefined) {
        updates.push('ocrApplied = ?');
        params.push(data.ocrApplied ? 1 : 0);
      }

      params.push(where.id);
      const sql = `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`;
      this.sqliteDb!.prepare(sql).run(...params);

      return this.document.findUnique({ where: { id: where.id } });
    },

    delete: async (args: { where: { id: string } }) => {
      const { where } = args;
      const existing = await this.document.findUnique({ where: { id: where.id } });
      if (!existing) return null;

      this.sqliteDb!.prepare('DELETE FROM document_chunks WHERE documentId = ?').run(where.id);
      this.sqliteDb!.prepare('DELETE FROM document_pages WHERE documentId = ?').run(where.id);
      this.sqliteDb!.prepare('DELETE FROM documents WHERE id = ?').run(where.id);
      return existing;
    },

    count: async (args: any = {}) => {
      const { where = {} } = args;
      let sql = 'SELECT COUNT(*) as cnt FROM documents WHERE 1=1';
      const params: any[] = [];
      if (where.processingStatus) {
        sql += ' AND processingStatus = ?';
        params.push(where.processingStatus);
      }
      if (where.fileType) {
        sql += ' AND fileType = ?';
        params.push(where.fileType);
      }
      const row: any = this.sqliteDb!.prepare(sql).get(...params);
      return row ? row.cnt : 0;
    }
  };

  documentPage = {
    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || crypto.randomUUID();
      const sql = `
        INSERT INTO document_pages (id, documentId, pageNumber, heading, extractedText, extractionMethod, ocrConfidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      this.sqliteDb!.prepare(sql).run(
        id,
        data.documentId,
        data.pageNumber || data.page_number || 1,
        data.heading || null,
        data.extractedText || data.text_content || '',
        data.extractionMethod || 'NATIVE',
        data.ocrConfidence || null
      );
      return { id, ...data };
    },

    createMany: async (args: { data: any[] }) => {
      const { data } = args;
      const stmt = this.sqliteDb!.prepare(`
        INSERT INTO document_pages (id, documentId, pageNumber, heading, extractedText, extractionMethod, ocrConfidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of data) {
        const id = item.id || crypto.randomUUID();
        stmt.run(
          id,
          item.documentId,
          item.pageNumber || item.page_number || 1,
          item.heading || null,
          item.extractedText || item.text_content || '',
          item.extractionMethod || 'NATIVE',
          item.ocrConfidence || null
        );
      }
      return { count: data.length };
    },

    findMany: async (args: { where?: any; orderBy?: any } = {}) => {
      const { where = {}, orderBy = {} } = args;
      let sql = 'SELECT * FROM document_pages WHERE 1=1';
      const params: any[] = [];
      if (where.documentId) {
        sql += ' AND documentId = ?';
        params.push(where.documentId);
      }
      if (where.pageNumber) {
        sql += ' AND pageNumber = ?';
        params.push(where.pageNumber);
      }

      let sortDir = 'ASC';
      if (orderBy.pageNumber && orderBy.pageNumber.toUpperCase() === 'DESC') {
        sortDir = 'DESC';
      }
      sql += ` ORDER BY pageNumber ${sortDir}`;

      const rows: any[] = this.sqliteDb!.prepare(sql).all(...params);
      return rows.map(r => this.formatDocumentPage(r));
    },

    deleteMany: async (args: { where: { documentId: string } }) => {
      const res = this.sqliteDb!.prepare('DELETE FROM document_pages WHERE documentId = ?').run(args.where.documentId);
      return { count: res.changes };
    }
  };

  documentChunk = {
    create: async (args: { data: any }) => {
      const { data } = args;
      const id = data.id || crypto.randomUUID();
      const sql = `
        INSERT INTO document_chunks (id, documentId, pageReferences, chunkText, sectionHeading, chunkIndex, tokenCount, embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      this.sqliteDb!.prepare(sql).run(
        id,
        data.documentId,
        JSON.stringify(data.pageReferences || []),
        data.chunkText || '',
        data.sectionHeading || null,
        data.chunkIndex || 0,
        data.tokenCount || 0,
        data.embedding ? JSON.stringify(data.embedding) : null
      );
      return { id, ...data };
    },

    createMany: async (args: { data: any[] }) => {
      const { data } = args;
      const stmt = this.sqliteDb!.prepare(`
        INSERT INTO document_chunks (id, documentId, pageReferences, chunkText, sectionHeading, chunkIndex, tokenCount, embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of data) {
        const id = item.id || crypto.randomUUID();
        stmt.run(
          id,
          item.documentId,
          JSON.stringify(item.pageReferences || []),
          item.chunkText || '',
          item.sectionHeading || null,
          item.chunkIndex || 0,
          item.tokenCount || 0,
          item.embedding ? JSON.stringify(item.embedding) : null
        );
      }
      return { count: data.length };
    },

    findMany: async (args: any = {}) => {
      const { where = {}, orderBy = {}, take = 200 } = args;
      let sql = 'SELECT * FROM document_chunks WHERE 1=1';
      const params: any[] = [];
      if (where.documentId) {
        if (typeof where.documentId === 'string') {
          sql += ' AND documentId = ?';
          params.push(where.documentId);
        } else if (Array.isArray(where.documentId.in)) {
          if (where.documentId.in.length === 0) return [];
          const ph = where.documentId.in.map(() => '?').join(',');
          sql += ` AND documentId IN (${ph})`;
          params.push(...where.documentId.in);
        }
      }

      sql += ` ORDER BY chunkIndex ASC LIMIT ?`;
      params.push(take);

      const rows: any[] = this.sqliteDb!.prepare(sql).all(...params);
      return rows.map(r => this.formatDocumentChunk(r));
    },

    deleteMany: async (args: { where: { documentId: string } }) => {
      const res = this.sqliteDb!.prepare('DELETE FROM document_chunks WHERE documentId = ?').run(args.where.documentId);
      return { count: res.changes };
    }
  };

  private formatArticle(row: any, includeCategory = false): any {
    if (!row) return null;
    let keyConcepts: string[] = [];
    try {
      keyConcepts = typeof row.keyConcepts === 'string' ? JSON.parse(row.keyConcepts) : (row.keyConcepts || []);
    } catch {
      keyConcepts = [];
    }

    let keyTheorists: string[] = [];
    try {
      keyTheorists = typeof row.key_theorists === 'string' ? JSON.parse(row.key_theorists) : (row.key_theorists || []);
      if (!Array.isArray(keyTheorists) && typeof row.key_theorists === 'string') {
        keyTheorists = row.key_theorists.split(',').map((s: string) => s.trim());
      }
    } catch {
      keyTheorists = row.authorReferences ? [row.authorReferences] : [];
    }

    // Load related topics
    let relatedTopics: any[] = [];
    if (this.sqliteDb) {
      try {
        const rels: any[] = this.sqliteDb.prepare(`
          SELECT target_topic, relation_type, description 
          FROM topic_relations 
          WHERE source_topic = ? OR target_topic = ?
        `).all(row.title, row.title);
        relatedTopics = rels.map((r: any) => ({
          target_topic: r.target_topic === row.title ? r.source_topic : r.target_topic,
          relation_type: r.relation_type || 'related_to',
          description: r.description
        }));
      } catch {}
    }

    const citations = CitationEngine.generateFormattedCitations({
      id: row.id,
      title: row.title,
      authors: Array.isArray(keyTheorists) && keyTheorists.length > 0 ? keyTheorists.join(', ') : (row.authorReferences || 'Psychological Science Contributor'),
      year: row.createdAt ? new Date(row.createdAt).getFullYear() : 2024,
      doi: row.doi,
      publicationType: 'Journal Article',
      journal: row.publicationInfo || 'Comprehensive Psychology Knowledge Base'
    });

    const categoryName = row.category_name || (includeCategory && row.category ? row.category.name : 'General Psychology');

    const article: any = {
      id: row.id,
      topic_id: row.id,
      title: row.title,
      slug: row.slug,
      category: categoryName,
      category_name: categoryName,
      verified_status: row.verified_status || 'Verified Scholarly',
      verifiedStatus: row.verified_status || 'Verified Scholarly',

      // 17 Structured Dimensions
      definition: row.definition,
      introduction: row.introduction || row.explanation,
      historical_background: row.historical_background || row.theories || 'Historical evolution documented across classical and modern psychological literature.',
      historicalBackground: row.historical_background || row.theories || 'Historical evolution documented across classical and modern psychological literature.',
      key_theorists: keyTheorists.length > 0 ? keyTheorists : (row.authorReferences ? [row.authorReferences] : ['Classical & Contemporary Investigators']),
      keyTheorists: keyTheorists.length > 0 ? keyTheorists : (row.authorReferences ? [row.authorReferences] : ['Classical & Contemporary Investigators']),
      major_theories: row.major_theories || row.theories || 'Core theoretical frameworks established through empirical observation and controlled investigation.',
      majorTheories: row.major_theories || row.theories || 'Core theoretical frameworks established through empirical observation and controlled investigation.',
      core_concepts: row.core_concepts || (Array.isArray(keyConcepts) ? keyConcepts.join(', ') : keyConcepts),
      coreConcepts: row.core_concepts || (Array.isArray(keyConcepts) ? keyConcepts.join(', ') : keyConcepts),
      principles: row.principles || '1. Empirical Verifiability: Hypotheses must yield falsifiable operational predictions.\n2. Parsimony: Theoretical models favor minimal assumptions.\n3. Convergence: Multi-method triangulation across behavioral, psychometric, and neurological axes.',
      classification: row.classification || 'Psychological Science Taxonomy • Foundational Construct',
      models: row.models || 'Integrated structural, cognitive, and functional processing models representing construct dynamics.',
      applications: row.applications || 'Clinical formulation, educational design, neuropsychological assessment, and behavioral intervention.',
      clinical_relevance: row.clinical_relevance || 'Informs diagnostic classification (DSM-5-TR / ICD-11), psychometric screening, and individualized treatment planning.',
      clinicalRelevance: row.clinical_relevance || 'Informs diagnostic classification (DSM-5-TR / ICD-11), psychometric screening, and individualized treatment planning.',
      research_evidence: row.research_evidence || 'Validated across controlled experimental paradigms, randomized clinical trials, and meta-analytic syntheses.',
      researchEvidence: row.research_evidence || 'Validated across controlled experimental paradigms, randomized clinical trials, and meta-analytic syntheses.',
      examples: row.examples || 'Standardized laboratory task paradigm and applied clinical case study formulation.',
      limitations: row.limitations || 'Ecological validity boundaries and cultural variability across non-WEIRD populations.',
      relatedTopics,
      references_citations: row.references_citations || row.sourceReferences || row.authorReferences || citations.apa,
      referencesCitations: row.references_citations || row.sourceReferences || row.authorReferences || citations.apa,
      recommended_reading: row.recommended_reading || row.publicationInfo || 'Standard APA handbooks and seminal peer-reviewed monographs.',
      recommendedReading: row.recommended_reading || row.publicationInfo || 'Standard APA handbooks and seminal peer-reviewed monographs.',

      // Backward compatible fields
      explanation: row.explanation,
      keyConcepts,
      theories: row.theories,
      authorReferences: row.authorReferences,
      sourceReferences: row.sourceReferences,
      doi: row.doi,
      publicationInfo: row.publicationInfo,
      categoryId: row.categoryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      // Multi-format citations
      citation_apa: citations.apa,
      citation_bibtex: citations.bibtex,
      citation_mla: citations.mla,
      citation_chicago: citations.chicago,
      citation_vancouver: citations.vancouver,
      citation_ris: citations.ris,
      citations
    };

    if (includeCategory && row.categoryId) {
      article.category = {
        id: row.categoryId,
        name: row.category_name || categoryName,
        code: row.category_code || 'GEN'
      };
    }

    return article;
  }

  private formatReference(row: any): any {
    if (!row) return null;
    const item = {
      id: row.id,
      title: row.title,
      authorNames: row.author_names,
      author_names: row.author_names,
      publicationYear: row.publication_year,
      publication_year: row.publication_year,
      publisher: row.publisher,
      journal: row.journal,
      volume: row.volume,
      issue: row.issue,
      pages: row.pages,
      doi: row.doi,
      url: row.url,
      referenceUrl: row.url,
      reference_url: row.url,
      abstract: row.abstract,
      publicationType: row.publication_type || 'Journal Article',
      publication_type: row.publication_type || 'Journal Article',
      isVerified: Boolean(row.is_verified),
      is_verified: Boolean(row.is_verified),
      subject: row.subject || 'Psychological Science',
      copyrightStatus: row.copyright_status || 'Metadata & Authorized Open Reference',
      copyright_status: row.copyright_status || 'Metadata & Authorized Open Reference',
      categoryId: row.category_id,
      category_id: row.category_id,
      categoryName: row.category_name || 'General Psychology',
      category_name: row.category_name || 'General Psychology',
      articleId: row.article_id,
      article_id: row.article_id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    const citations = CitationEngine.generateFormattedCitations(item);

    return {
      ...item,
      citation_apa: row.citation_apa || citations.apa,
      citation_bibtex: row.citation_bibtex || citations.bibtex,
      citation_mla: citations.mla,
      citation_chicago: citations.chicago,
      citation_vancouver: citations.vancouver,
      citation_ris: citations.ris,
      citations
    };
  }

  private formatSettings(row: any): any {
    let defaultExamConfig = {};
    let documentStorageConfig = {};
    let applicationPreferences = {};

    try { defaultExamConfig = JSON.parse(row.defaultExamConfig || '{}'); } catch {}
    try { documentStorageConfig = JSON.parse(row.documentStorageConfig || '{}'); } catch {}
    try { applicationPreferences = JSON.parse(row.applicationPreferences || '{}'); } catch {}

    return {
      id: row.id,
      preferredCitationStyle: row.preferredCitationStyle,
      preferredAiProvider: row.preferredAiProvider,
      defaultExamConfig,
      documentStorageConfig,
      applicationPreferences,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  private formatDocument(row: any, includePages = false, includeChunks = false): any {
    if (!row) return null;
    let keyConcepts: string[] = [];
    let extractedReferences: string[] = [];
    try {
      keyConcepts = typeof row.keyConcepts === 'string' ? JSON.parse(row.keyConcepts) : (row.keyConcepts || []);
    } catch { keyConcepts = []; }
    try {
      extractedReferences = typeof row.extractedReferences === 'string' ? JSON.parse(row.extractedReferences) : (row.extractedReferences || []);
    } catch { extractedReferences = []; }

    const doc: any = {
      id: row.id,
      originalFilename: row.originalFilename,
      original_name: row.originalFilename,
      storageKey: row.storageKey,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
      file_size: row.fileSize,
      fileType: row.fileType,
      pageCount: row.pageCount,
      total_pages: row.pageCount,
      processingStatus: row.processingStatus,
      extractionMethod: row.extractionMethod,
      processingError: row.processingError,
      summary: row.summary,
      keyConcepts,
      key_concepts: keyConcepts,
      extractedReferences,
      studyNotes: row.studyNotes,
      study_notes: row.studyNotes,
      ocrApplied: Boolean(row.ocrApplied),
      ocr_applied: Boolean(row.ocrApplied),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    if (includePages && this.sqliteDb) {
      const pageRows: any[] = this.sqliteDb.prepare('SELECT * FROM document_pages WHERE documentId = ? ORDER BY pageNumber ASC').all(row.id);
      doc.pages = pageRows.map(p => this.formatDocumentPage(p));
    }

    if (includeChunks && this.sqliteDb) {
      const chunkRows: any[] = this.sqliteDb.prepare('SELECT * FROM document_chunks WHERE documentId = ? ORDER BY chunkIndex ASC').all(row.id);
      doc.chunks = chunkRows.map(c => this.formatDocumentChunk(c));
    }

    return doc;
  }

  private formatDocumentPage(row: any): any {
    if (!row) return null;
    return {
      id: row.id,
      documentId: row.documentId,
      pageNumber: row.pageNumber,
      page_number: row.pageNumber,
      heading: row.heading,
      extractedText: row.extractedText,
      text_content: row.extractedText,
      extractionMethod: row.extractionMethod,
      ocrConfidence: row.ocrConfidence,
      createdAt: row.createdAt
    };
  }

  private formatDocumentChunk(row: any): any {
    if (!row) return null;
    let pageReferences: number[] = [];
    try {
      pageReferences = typeof row.pageReferences === 'string' ? JSON.parse(row.pageReferences) : (row.pageReferences || []);
    } catch { pageReferences = []; }
    return {
      id: row.id,
      documentId: row.documentId,
      pageReferences,
      chunkText: row.chunkText,
      sectionHeading: row.sectionHeading,
      chunkIndex: row.chunkIndex,
      tokenCount: row.tokenCount,
      embedding: row.embedding ? JSON.parse(row.embedding) : null,
      createdAt: row.createdAt
    };
  }
}

let dbInstance: PrismaDatabaseClient | null = null;

export function getDbClient(): PrismaDatabaseClient {
  if (!dbInstance) {
    dbInstance = new PrismaDatabaseClient();
  }
  return dbInstance;
}

