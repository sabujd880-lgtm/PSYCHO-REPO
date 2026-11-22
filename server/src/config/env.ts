// server/src/config/env.ts
// Environment configuration loader with fallback defaults

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  frontendUrl: string;
  apiBaseUrl: string;
}

function parseEnv(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = parseInt(process.env.PORT || '5000', 10);
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/psychology_db?schema=public';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const apiBaseUrl = process.env.API_BASE_URL || '/api';

  return {
    nodeEnv,
    port: isNaN(port) ? 5000 : port,
    databaseUrl,
    frontendUrl,
    apiBaseUrl
  };
}

export const config = parseEnv();

