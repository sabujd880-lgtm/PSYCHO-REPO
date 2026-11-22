// server/src/types/node.d.ts
// Ambient Node.js and SQLite declarations for TypeScript Language Server

declare module 'node:path' {
  const path: {
    resolve(...paths: string[]): string;
    join(...paths: string[]): string;
    extname(path: string): string;
    basename(path: string, ext?: string): string;
    dirname(path: string): string;
    [key: string]: any;
  };
  export default path;
  export const resolve: (...paths: string[]) => string;
  export const join: (...paths: string[]) => string;
  export const extname: (path: string) => string;
  export const basename: (path: string, ext?: string) => string;
  export const dirname: (path: string) => string;
}

declare module 'node:fs' {
  const fs: {
    existsSync(path: string): boolean;
    readFileSync(path: string, options?: any): Buffer | string;
    writeFileSync(path: string, data: any, options?: any): void;
    mkdirSync(path: string, options?: any): string | undefined;
    statSync(path: string): any;
    readdirSync(path: string): string[];
    unlinkSync(path: string): void;
    createReadStream(path: string, options?: any): any;
    [key: string]: any;
  };
  export default fs;
  export const existsSync: (path: string) => boolean;
  export const readFileSync: (path: string, options?: any) => Buffer | string;
  export const writeFileSync: (path: string, data: any, options?: any) => void;
  export const mkdirSync: (path: string, options?: any) => string | undefined;
  export const statSync: (path: string) => any;
  export const readdirSync: (path: string) => string[];
  export const unlinkSync: (path: string) => void;
  export const createReadStream: (path: string, options?: any) => any;
}

declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(location: string, options?: any);
    exec(sql: string): void;
    prepare(sql: string): {
      all(...params: any[]): any[];
      get(...params: any[]): any;
      run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
    };
    close(): void;
  }
}

declare module 'node:crypto' {
  const crypto: {
    randomUUID(): string;
    createHash(algorithm: string): any;
    [key: string]: any;
  };
  export default crypto;
  export const randomUUID: () => string;
}

declare module 'node:zlib' {
  const zlib: {
    inflateSync(buf: Buffer): Buffer;
    inflateRawSync(buf: Buffer): Buffer;
    deflateSync(buf: Buffer): Buffer;
    [key: string]: any;
  };
  export default zlib;
}

declare module 'node:child_process' {
  export const execFileSync: (cmd: string, args?: string[], options?: any) => string | Buffer;
  export const execSync: (cmd: string, options?: any) => string | Buffer;
  export const spawn: (cmd: string, args?: string[], options?: any) => any;
}

declare var process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  uptime(): number;
  exit(code?: number): never;
  version: string;
  on(event: string, listener: (...args: any[]) => void): any;
  [key: string]: any;
};

declare var crypto: {
  randomUUID(): string;
  [key: string]: any;
};
