// server/src/config/swagger.ts
// OpenAPI 3.0 Specification and Swagger UI Document Generator

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Personal Psychology Knowledge & Intelligence Platform API',
    version: '1.0.0',
    description: `A modern, comprehensive, single-user REST API foundation for the Psychology Knowledge, Clinical Reference, Research, Assessment, Teaching and Examination Preparation Platform.
    
**Architecture Rules**:
- Single-user personal application (no login, no registration, no role-based controls).
- Strictly verified academic references and psychometric properties.
- Source-prioritized knowledge retrieval and examination predictions.`,
    contact: {
      name: 'Psychology Scholar',
      url: 'https://github.com/sabuj/anti'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Backend Development Server'
    }
  ],
  tags: [
    { name: 'System', description: 'Health check and platform version' },
    { name: 'Settings', description: 'Application-level configuration and scholar preferences' },
    { name: 'Knowledge Base', description: 'Structured psychology knowledge articles, categories, and literature references' },
    { name: 'Assessments', description: 'Standardized psychological test reference catalogue' },
    { name: 'Clinical', description: 'Clinical assessment protocols and documentation templates' },
    { name: 'Research', description: 'Methodology design, statistical tests, and citation exports' },
    { name: 'Examinations', description: 'PYQ bank, trend analytics, and predictor engine' },
    { name: 'Teaching', description: 'Curriculum builder and lesson plan designer' },
    { name: 'Document Intelligence', description: 'Document upload, OCR extraction, semantic chunking, grounded Q&A, and summarization' }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check API and database health status',
        responses: {
          '200': {
            description: 'API is running and healthy',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    status: 'ok',
                    uptimeSeconds: 42.5,
                    timestamp: '2026-11-21T00:30:00.000Z',
                    environment: 'development',
                    database: 'connected'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/version': {
      get: {
        tags: ['System'],
        summary: 'Get platform release version',
        responses: {
          '200': {
            description: 'Platform version metadata',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    name: 'Psychology Knowledge & Intelligence Platform',
                    version: '1.0.0',
                    phase: 'Phase 1 - Backend Foundation',
                    nodeVersion: 'v24.11.1',
                    architecture: 'Single-User Modular REST API'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Retrieve application settings',
        responses: {
          '200': {
            description: 'Current application settings',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: 'as-default-1',
                    preferredCitationStyle: 'APA 7th',
                    preferredAiProvider: 'none',
                    defaultExamConfig: {
                      targetExam: 'UGC NET Psychology',
                      defaultQuestionCount: 25,
                      defaultTimeMinutes: 60
                    },
                    documentStorageConfig: {
                      storageType: 'local',
                      uploadDir: 'data/uploads',
                      maxFileSizeMb: 50
                    },
                    applicationPreferences: {
                      theme: 'light',
                      autoSaveNotes: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Settings'],
        summary: 'Update application settings',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  preferredCitationStyle: { type: 'string', example: 'APA 7th' },
                  preferredAiProvider: { type: 'string', example: 'local' },
                  defaultExamConfig: { type: 'object' },
                  documentStorageConfig: { type: 'object' },
                  applicationPreferences: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Settings successfully updated' },
          '400': { description: 'Validation error' }
        }
      }
    },
    '/api/knowledge': {
      get: {
        tags: ['Knowledge Base'],
        summary: 'List paginated, searchable, and filtered knowledge articles',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Full-text query in title, definition, or explanation' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category code (e.g. COG, PSY, CLN)' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['title', 'createdAt', 'updatedAt'], default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
        ],
        responses: {
          '200': {
            description: 'Paginated list of knowledge articles',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      id: 'ka-1',
                      title: 'Working Memory Architecture: Multi-Component Modal Systems',
                      slug: 'working-memory-architecture',
                      definition: 'Working memory is a limited-capacity cognitive system...',
                      keyConcepts: ['Central Executive', 'Phonological Loop'],
                      createdAt: '2026-11-21T00:00:00.000Z'
                    }
                  ],
                  pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Knowledge Base'],
        summary: 'Create a new structured knowledge article',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'definition', 'explanation'],
                properties: {
                  title: { type: 'string', example: 'Signal Detection Theory' },
                  slug: { type: 'string', example: 'signal-detection-theory' },
                  definition: { type: 'string', example: 'Signal Detection Theory (SDT) is a psychophysical framework...' },
                  explanation: { type: 'string', example: 'SDT quantifies sensitivity (d\') independently from response bias (beta)...' },
                  keyConcepts: { type: 'array', items: { type: 'string' }, example: ['Hits', 'False Alarms', 'Sensitivity (d\')', 'Criterion (c)'] },
                  theories: { type: 'string', example: 'Tanner & Swets (1954)' },
                  applications: { type: 'string', example: 'Radiology detection, air traffic radar monitoring, and eyewitness identification.' },
                  limitations: { type: 'string', example: 'Assumes normal equal-variance distributions of noise and signal+noise.' },
                  categoryId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Knowledge article created successfully' },
          '400': { description: 'Validation failed' }
        }
      }
    },
    '/api/knowledge/{id}': {
      get: {
        tags: ['Knowledge Base'],
        summary: 'Retrieve detailed knowledge article by UUID or slug',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Article UUID or unique slug' }
        ],
        responses: {
          '200': { description: 'Detailed knowledge article' },
          '404': { description: 'Article not found' }
        }
      },
      put: {
        tags: ['Knowledge Base'],
        summary: 'Update an existing knowledge article',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  definition: { type: 'string' },
                  explanation: { type: 'string' },
                  keyConcepts: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Article successfully updated' },
          '404': { description: 'Article not found' }
        }
      },
      delete: {
        tags: ['Knowledge Base'],
        summary: 'Delete a knowledge article',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Article deleted successfully' },
          '404': { description: 'Article not found' }
        }
      }
    },
    '/api/knowledge/categories': {
      get: {
        tags: ['Knowledge Base'],
        summary: 'List all psychology resource categories',
        responses: {
          '200': { description: 'List of psychology categories' }
        }
      }
    },
    '/api/assessments': {
      get: {
        tags: ['Assessments'],
        summary: 'Assessment catalogue placeholder (Phase 4 Foundation)',
        responses: {
          '200': { description: 'Documented placeholder' }
        }
      }
    },
    '/api/clinical/topics': {
      get: {
        tags: ['Clinical'],
        summary: 'Clinical reference protocols placeholder (Phase 4 Foundation)',
        responses: {
          '200': { description: 'Documented placeholder' }
        }
      }
    },
    '/api/research/papers': {
      get: {
        tags: ['Research'],
        summary: 'Research papers placeholder (Phase 6 Foundation)',
        responses: {
          '200': { description: 'Documented placeholder' }
        }
      }
    },
    '/api/exams': {
      get: {
        tags: ['Examinations'],
        summary: 'Examinations placeholder (Phase 5 Foundation)',
        responses: {
          '200': { description: 'Documented placeholder' }
        }
      }
    },
    '/api/teaching/notes': {
      get: {
        tags: ['Teaching'],
        summary: 'Teaching notes placeholder (Phase 6 Foundation)',
        responses: {
          '200': { description: 'Documented placeholder' }
        }
      }
    },
    '/api/documents/upload': {
      post: {
        tags: ['Document Intelligence'],
        summary: 'Upload and immediately process document (PDF, DOCX, DOC, PPTX, XLSX, CSV, JPG, PNG, TXT)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['filename', 'content'],
                properties: {
                  filename: { type: 'string', example: 'dsm5_differential_dx.pdf' },
                  mimeType: { type: 'string', example: 'application/pdf' },
                  content: { type: 'string', description: 'Base64 data or plain text string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Document successfully uploaded, indexed, and processed' }
        }
      }
    },
    '/api/documents': {
      get: {
        tags: ['Document Intelligence'],
        summary: 'List all uploaded documents with processing status and page count',
        responses: {
          '200': { description: 'List of documents' }
        }
      }
    },
    '/api/documents/{id}': {
      get: {
        tags: ['Document Intelligence'],
        summary: 'Get full document details with indexed pages and concept analysis',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Document details' },
          '404': { description: 'Document not found' }
        }
      },
      delete: {
        tags: ['Document Intelligence'],
        summary: 'Delete document, stored files, and associated pages/chunks',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Document deleted' }
        }
      }
    },
    '/api/documents/{id}/status': {
      get: {
        tags: ['Document Intelligence'],
        summary: 'Get document processing status (UPLOADED, PROCESSING, COMPLETED, FAILED)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Document processing status' }
        }
      }
    },
    '/api/documents/{id}/pages': {
      get: {
        tags: ['Document Intelligence'],
        summary: 'Get indexed pages and extracted text for a specific document',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'List of document pages' }
        }
      }
    },
    '/api/documents/{id}/process': {
      post: {
        tags: ['Document Intelligence'],
        summary: 'Re-trigger extraction, chunking, and study notes processing',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Document re-processed' }
        }
      }
    },
    '/api/documents/search': {
      get: {
        tags: ['Document Intelligence'],
        summary: 'Full-text search across documents, pages, and chunks with snippets',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'documentId', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Matching document chunks and pages' }
        }
      }
    },
    '/api/documents/{id}/ask': {
      post: {
        tags: ['Document Intelligence'],
        summary: 'Ask a grounded question against a specific document with page citations',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string', example: 'What are the core diagnostic criteria discussed?' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Grounded answer with page citations' }
        }
      }
    },
    '/api/documents/ask-multiple': {
      post: {
        tags: ['Document Intelligence'],
        summary: 'Multi-document grounded cross-reasoning with page citations per document',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string', example: 'Compare the diagnostic validity findings across these texts' },
                  documentIds: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Cross-document grounded answer' }
        }
      }
    },
    '/api/documents/{id}/summarize': {
      post: {
        tags: ['Document Intelligence'],
        summary: 'Generate structured summaries (short, detailed, chapter_wise, definitions, theories, psychologists, findings, exam_notes)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['short', 'detailed', 'chapter_wise', 'section_wise', 'definitions', 'theories', 'psychologists', 'findings', 'exam_notes'],
                    default: 'detailed'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Structured summary' }
        }
      }
    },
    '/api/documents/{id}/questions': {
      post: {
        tags: ['Document Intelligence'],
        summary: 'Generate grounded practice questions (mcq, true_false, fill_in_blanks, short_answer, long_essay, case_based)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['mcq', 'true_false', 'fill_in_blanks', 'short_answer', 'long_essay', 'case_based'],
                    default: 'mcq'
                  },
                  count: { type: 'integer', default: 5 }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Generated practice questions' }
        }
      }
    }
  }
};

export function getSwaggerHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Psychology Platform API Documentation (Swagger)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: sans-serif; }
    .topbar { display: none; }
    .swagger-ui .info .title { color: #4f46e5; }
    .swagger-ui .opblock.opblock-get { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); }
    .swagger-ui .opblock.opblock-post { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
    .swagger-ui .opblock.opblock-put { border-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
    .swagger-ui .opblock.opblock-delete { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
    .custom-header {
      background: #4f46e5;
      color: white;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .custom-header h1 { margin: 0; font-size: 1.25rem; }
    .custom-header a { color: #ede9fe; text-decoration: none; font-size: 0.88rem; }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>Ψ PsycheIntel API Documentation (OpenAPI 3.0)</h1>
    <a href="/api/docs/json" target="_blank">Download Raw OpenAPI JSON</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
}

