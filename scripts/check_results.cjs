const fs = require('fs');
const d = JSON.parse(fs.readFileSync('migration-data.json', 'utf8'));
const noIng = d.filter(p => p.ingredientsList.length === 0);
console.log('No ingredients:', noIng.length);
noIng.forEach(p => {
  const hasUL = p.bodyHtml.includes('<ul') || p.bodyHtml.includes('<ol');
  const hasMso = p.bodyHtml.includes('MsoNormal') && p.bodyHtml.includes('mso-list');
  const tag = hasUL ? 'UL' : hasMso ? 'MSO' : 'NONE';
  console.log(`  [${tag}] ${p.title} (body:${p.bodyHtml.length})`);
});
console.log();
const noInstr = d.filter(p => !p.instructionsHtml || p.instructionsHtml.length < 10);
console.log('No instructions:', noInstr.length);
noInstr.forEach(p => {
  console.log(`  - ${p.title} (ing:${p.ingredientsList.length} body:${p.bodyHtml.length})`);
});
