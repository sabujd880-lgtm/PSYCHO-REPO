// server/src/scripts/listBooks.js
import fs from 'node:fs';
import path from 'node:path';

const dir = 'C:/Users/sabuj/Downloads/psy book doc';
if (!fs.existsSync(dir)) {
  console.error('Directory does not exist:', dir);
  process.exit(1);
}

const files = fs.readdirSync(dir).map(f => {
  const fullPath = path.join(dir, f);
  const stat = fs.statSync(fullPath);
  return {
    name: f,
    sizeMB: +(stat.size / (1024 * 1024)).toFixed(2),
    ext: path.extname(f).toLowerCase()
  };
});

fs.writeFileSync('books_audit.json', JSON.stringify(files, null, 2), 'utf-8');
console.log(`Audited ${files.length} files successfully. Written to books_audit.json`);
