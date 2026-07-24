const fs = require('fs');
const { JSDOM } = require('jsdom');

const data = JSON.parse(fs.readFileSync('migration-data.json', 'utf8'));
const empty = data.filter(p => p.ingredientsList.length === 0);

const ingKeywords = /składnik|ciast[oa]\s*:?\s*$|nadzi[eo]n|krem\s*:|farsz|mas[aą]\s|polew[aą]|biszko[pt]|sos\s*:/im;
const listMarkers = /[·•\-]\s+\d|^\s*\d+\s+(g|ml|łyż|szt|dag|kg|szklank)/im;

let hasData = 0;
let noData = 0;

for (const post of empty) {
  const html = post.bodyHtml;
  const dom = new JSDOM(html);
  const text = dom.window.document.body.textContent || '';
  
  // Check for ul/ol tags
  const hasUL = html.includes('<ul') || html.includes('<ol');
  const hasMso = html.includes('MsoNormal') && html.includes('mso-list');
  const hasKeyword = ingKeywords.test(text);
  const hasBullet = listMarkers.test(text);
  
  if (hasUL || hasMso || hasKeyword) {
    hasData++;
    console.log(`[FIXABLE] ${post.title} — UL:${hasUL} Mso:${hasMso} Keyword:${hasKeyword}`);
  } else {
    noData++;
    console.log(`[NO RECIPE] ${post.title} — bodyLen:${html.length}`);
  }
}

console.log(`\nFixable: ${hasData}, No recipe data: ${noData}`);
