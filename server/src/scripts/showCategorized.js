// server/src/scripts/showCategorized.js
import fs from 'node:fs';

const cats = JSON.parse(fs.readFileSync('books_categorized.json', 'utf-8'));

for (const [k, list] of Object.entries(cats)) {
  console.log(`\n=== ${k.toUpperCase()} (${list.length}) ===`);
  list.slice(0, 15).forEach(f => {
    console.log(`- ${f.name} (${f.sizeMB} MB)`);
  });
}
