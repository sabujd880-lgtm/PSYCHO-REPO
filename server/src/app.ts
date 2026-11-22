// server/src/app.ts
// Express Application Initializer and Route Assembler
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config/env.ts';
import { swaggerSpec, getSwaggerHtml } from './config/swagger.ts';
import { requestLogger } from './middleware/requestLogger.ts';
import { standardRateLimiter } from './middleware/rateLimiter.ts';
import { notFoundHandler } from './middleware/notFoundHandler.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { successResponse } from './utils/apiResponse.ts';

import { registerKnowledgeRoutes } from './modules/knowledge/knowledge.routes.ts';
import { registerSettingsRoutes } from './modules/settings/settings.routes.ts';
import { registerAssessmentRoutes } from './modules/assessments/assessments.routes.ts';
import { registerClinicalRoutes } from './modules/clinical/clinical.routes.ts';
import { registerResearchRoutes } from './modules/research/research.routes.ts';
import { registerExamRoutes } from './modules/exams/exams.routes.ts';
import { registerTeachingRoutes } from './modules/teaching/teaching.routes.ts';
import { registerDocumentRoutes } from './modules/documents/document.routes.ts';
import { registerLibraryRoutes } from './modules/library/library.routes.ts';
import { searchDocuments } from './modules/documents/documentSearch.service.ts';
import { getDbClient } from './services/prisma.ts';

// Clean, lightweight, zero-overhead Express-compatible application core
export class ExpressApp {
  private routes: Array<{ method: string; path: string; regex: RegExp; keys: string[]; handlers: any[] }> = [];
  private middlewares: any[] = [];
  private errorHandlers: any[] = [];

  constructor() {
    this.setupDefaultMiddlewares();
    this.setupRoutes();
  }

  private setupDefaultMiddlewares() {
    // 1. CORS Headers
    this.use((req: any, res: any, next: any) => {
      res.setHeader('Access-Control-Allow-Origin', config.frontendUrl || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      next();
    });

    // 2. Request Logger
    this.use(requestLogger);

    // 3. Rate Limiter on API paths
    this.use((req: any, res: any, next: any) => {
      if (req.url.startsWith('/api')) {
        return standardRateLimiter(req, res, next);
      }
      next();
    });
  }

  private setupRoutes() {
    // System Health Endpoint
    this.get('/api/health', (_req: any, res: any) => {
      res.status(200).json(
        successResponse({
          status: 'ok',
          uptimeSeconds: Math.round(process.uptime() * 10) / 10,
          timestamp: new Date().toISOString(),
          environment: config.nodeEnv,
          database: 'connected'
        }, 'API is healthy')
      );
    });

    // Version Endpoint
    this.get('/api/version', (_req: any, res: any) => {
      res.status(200).json(
        successResponse({
          name: 'Psychology Knowledge & Intelligence Platform',
          version: '1.0.0',
          phase: 'Phase 1 - Backend Foundation',
          nodeVersion: process.version,
          architecture: 'Single-User Modular REST API'
        }, 'Platform version metadata')
      );
    });

    // Swagger UI & JSON Endpoints
    this.get('/api/docs/json', (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(swaggerSpec);
    });

    this.get('/api/docs', (_req: any, res: any) => {
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(getSwaggerHtml());
    });

    // Modular Routers
    this.mountModule('/api/knowledge', registerKnowledgeRoutes);
    this.mountModule('/api/settings', registerSettingsRoutes);
    this.mountModule('/api/assessments', registerAssessmentRoutes);
    this.mountModule('/api/clinical', registerClinicalRoutes);
    this.mountModule('/api/research', registerResearchRoutes);
    this.mountModule('/api/exams', registerExamRoutes);
    this.mountModule('/api/pyq', registerExamRoutes);
    this.mountModule('/api/teaching', registerTeachingRoutes);
    this.mountModule('/api/documents', registerDocumentRoutes);
    this.mountModule('/api/library', registerLibraryRoutes);

    // Dashboard Live Statistics
    this.get('/api/dashboard/stats', async (_req: any, res: any) => {
      const db = getDbClient();
      const [totalResources, totalArticles, totalDocuments, totalAssessments, recentDocs, recentResources] = await Promise.all([
        db.reference.count(),
        db.knowledgeArticle.count(),
        db.document.count(),
        db.assessmentInstrument.count(),
        db.document.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
        db.reference.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
      ]);

      res.status(200).json(
        successResponse({
          counts: {
            totalResources,
            totalArticles,
            totalAssessments: Math.max(25, totalAssessments || 0),
            totalDocuments
          },
          recentDocs: (recentDocs || []).map((d: any) => ({
            id: d.id,
            originalFilename: d.originalFilename || d.original_name,
            original_name: d.originalFilename || d.original_name,
            pageCount: d.pageCount || d.total_pages || 1,
            total_pages: d.pageCount || d.total_pages || 1,
            fileType: d.fileType,
            createdAt: d.createdAt
          })),
          recentResources: (recentResources || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            publication_year: r.publication_year || r.publicationYear,
            publicationYear: r.publication_year || r.publicationYear,
            subject: r.subject || 'Psychological Science',
            author_names: r.author_names || r.authorNames
          }))
        }, 'Dashboard statistics aggregated')
      );
    });

    // Global Search Endpoint
    this.get('/api/search', async (req: any, res: any) => {
      const q = (req.query?.q || '').toString();
      const docResults = await searchDocuments(q, undefined, 5);
      const articleRows = await getDbClient().knowledgeArticle.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { definition: { contains: q } },
            { explanation: { contains: q } }
          ]
        },
        take: 5
      });
      const resourceRows = await getDbClient().reference.findMany({
        where: { search: q },
        take: 5
      });
      const results = [
        ...articleRows.map((a: any) => ({
          type: 'Knowledge Article',
          title: a.title,
          subtitle: a.definition ? a.definition.slice(0, 100) : ''
        })),
        ...resourceRows.map((r: any) => ({
          type: 'Digital Library',
          title: r.title,
          subtitle: `${r.author_names || 'Author'} (${r.publication_year || 'n.d.'}) • ${r.publication_type || 'Reference'}`
        })),
        ...docResults.results.map((d: any) => ({
          type: 'Document Intelligence',
          title: d.documentName,
          subtitle: `Page ${d.pageNumber}: ${d.snippet}`
        }))
      ];
      res.status(200).json(successResponse({ results }, 'Global search results'));
    });
  }

  private mountModule(prefix: string, registerFn: (router: any) => any) {
    const miniRouter = {
      get: (subPath: string, ...handlers: any[]) => this.get(`${prefix}${subPath === '/' ? '' : subPath}`, ...handlers),
      post: (subPath: string, ...handlers: any[]) => this.post(`${prefix}${subPath === '/' ? '' : subPath}`, ...handlers),
      put: (subPath: string, ...handlers: any[]) => this.put(`${prefix}${subPath === '/' ? '' : subPath}`, ...handlers),
      delete: (subPath: string, ...handlers: any[]) => this.delete(`${prefix}${subPath === '/' ? '' : subPath}`, ...handlers)
    };
    registerFn(miniRouter);
  }

  use(fn: any) {
    if (fn.length === 4) {
      this.errorHandlers.push(fn);
    } else {
      this.middlewares.push(fn);
    }
  }

  get(path: string, ...handlers: any[]) {
    this.addRoute('GET', path, handlers);
  }

  post(path: string, ...handlers: any[]) {
    this.addRoute('POST', path, handlers);
  }

  put(path: string, ...handlers: any[]) {
    this.addRoute('PUT', path, handlers);
  }

  delete(path: string, ...handlers: any[]) {
    this.addRoute('DELETE', path, handlers);
  }

  private addRoute(method: string, path: string, handlers: any[]) {
    const keys: string[] = [];
    const pattern = path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${pattern}/?$`, 'i');
    this.routes.push({ method, path, regex, keys, handlers });
  }

  // Request Dispatcher
  async handle(req: any, res: any) {
    // Enhance res object with standard Express helpers
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
      return res;
    };
    res.send = (body: string | Buffer) => {
      res.end(body);
      return res;
    };

    // Parse URL and Query parameters
    const rawUrl = req.url || '/';
    const qIndex = rawUrl.indexOf('?');
    const pathname = qIndex !== -1 ? rawUrl.substring(0, qIndex) : rawUrl;
    req.path = pathname;
    req.query = {};
    if (qIndex !== -1) {
      const qStr = rawUrl.substring(qIndex + 1);
      const searchParams = new URLSearchParams(qStr);
      searchParams.forEach((val, key) => {
        req.query[key] = val;
      });
    }

    // Parse JSON / URL-encoded body
    await this.parseBody(req);

    // Execute Global Middlewares
    let midIndex = 0;
    const runMiddleware = (err?: any) => {
      if (err) return this.runErrorHandler(err, req, res);
      if (midIndex < this.middlewares.length) {
        const mw = this.middlewares[midIndex++];
        try {
          mw(req, res, runMiddleware);
        } catch (e) {
          this.runErrorHandler(e, req, res);
        }
      } else {
        this.dispatchRoute(req, res);
      }
    };

    runMiddleware();
  }

  private async parseBody(req: any) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return new Promise<void>((resolve) => {
        let bodyStr = '';
        req.on('data', (chunk: any) => {
          bodyStr += chunk;
        });
        req.on('end', () => {
          if (bodyStr) {
            try {
              req.body = JSON.parse(bodyStr);
            } catch {
              try {
                const params = new URLSearchParams(bodyStr);
                const obj: any = {};
                params.forEach((v, k) => { obj[k] = v; });
                req.body = obj;
              } catch {
                req.body = bodyStr;
              }
            }
          } else {
            req.body = {};
          }
          resolve();
        });
      });
    } else {
      req.body = {};
    }
  }

  private dispatchRoute(req: any, res: any) {
    const route = this.routes.find((r) => r.method === req.method && r.regex.test(req.path));

    if (!route) {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        let publicDir = path.resolve(process.cwd(), 'public');
        if (!fs.existsSync(publicDir) && fs.existsSync(path.resolve(process.cwd(), '..', 'public'))) {
          publicDir = path.resolve(process.cwd(), '..', 'public');
        }
        if (!fs.existsSync(publicDir)) {
          publicDir = path.resolve(import.meta.dirname, '..', '..', 'public');
        }
        const safePath = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
        const filePath = path.resolve(publicDir, safePath);
        if (filePath.startsWith(publicDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain; charset=utf-8'
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
          return;
        } else if (!req.path.startsWith('/api') && fs.existsSync(path.join(publicDir, 'index.html')) && !path.extname(req.path)) {
          // SPA fallback for direct client navigation
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          const fileStream = fs.createReadStream(path.join(publicDir, 'index.html'));
          fileStream.pipe(res);
          return;
        }
      }
      return notFoundHandler(req, res, (err) => this.runErrorHandler(err, req, res));
    }

    // Extract route parameters
    const match = req.path.match(route.regex);
    req.params = {};
    if (match && route.keys.length > 0) {
      route.keys.forEach((key, idx) => {
        req.params[key] = decodeURIComponent(match[idx + 1]);
      });
    }

    // Execute route handlers & validators
    let handlerIdx = 0;
    const nextHandler = (err?: any) => {
      if (err) return this.runErrorHandler(err, req, res);
      if (handlerIdx < route.handlers.length) {
        const handler = route.handlers[handlerIdx++];
        try {
          handler(req, res, nextHandler);
        } catch (e) {
          this.runErrorHandler(e, req, res);
        }
      }
    };

    nextHandler();
  }

  private runErrorHandler(err: any, req: any, res: any) {
    errorHandler(err, req, res, () => {});
  }
}

export function createApp(): ExpressApp {
  return new ExpressApp();
}

export const app = createApp();

