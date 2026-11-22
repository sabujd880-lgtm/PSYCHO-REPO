// server/src/scripts/classifyBooks.js
import fs from 'node:fs';

const raw = fs.readFileSync('books_audit.json', 'utf-8');
const files = JSON.parse(raw);

const categories = {
  textbooks: [],
  clinical_therapy: [],
  assessment_scales: [],
  pyq_exams: [],
  neuro_biological: [],
  social_organizational: [],
  notes_lectures: [],
  misc: []
};

files.forEach(f => {
  const name = f.name.toLowerCase();
  
  if (name.includes('mcq') || name.includes('mock') || name.includes('jrf') || name.includes('net') || name.includes('syllabus') || name.includes('ugc') || name.includes('pyq')) {
    categories.pyq_exams.push(f);
  } else if (name.includes('scale') || name.includes('workbook') || name.includes('rorschach') || name.includes('battery') || name.includes('questionnaire') || name.includes('assessment') || name.includes('inventor') || name.includes('test')) {
    categories.assessment_scales.push(f);
  } else if (name.includes('clinical') || name.includes('cbt') || name.includes('therapy') || name.includes('psychiatry') || name.includes('schizophrenia') || name.includes('clozapine') || name.includes('prescriber') || name.includes('dsm') || name.includes('counseling') || name.includes('psychopathology') || name.includes('abnormal')) {
    categories.clinical_therapy.push(f);
  } else if (name.includes('neuro') || name.includes('brain') || name.includes('biological') || name.includes('nervous') || name.includes('neurology')) {
    categories.neuro_biological.push(f);
  } else if (name.includes('social') || name.includes('organizational') || name.includes('work') || name.includes('attitude') || name.includes('group')) {
    categories.social_organizational.push(f);
  } else if (name.includes('personality') || name.includes('history') || name.includes('introduction') || name.includes('handbook') || name.includes('dictionary') || name.includes('theory') || name.includes('science of psychology') || name.includes('graphic guide') || f.sizeMB > 15) {
    categories.textbooks.push(f);
  } else if (name.includes('notes') || name.includes('lecture') || name.includes('unit') || name.includes('module')) {
    categories.notes_lectures.push(f);
  } else {
    categories.misc.push(f);
  }
});

console.log('--- CLASSIFICATION SUMMARY ---');
for (const [k, v] of Object.entries(categories)) {
  console.log(`${k}: ${v.length} files`);
}

fs.writeFileSync('books_categorized.json', JSON.stringify(categories, null, 2), 'utf-8');
console.log('Saved categories to books_categorized.json');
