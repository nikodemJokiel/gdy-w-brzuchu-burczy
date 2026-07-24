import fs from 'fs';
import { JSDOM } from 'jsdom';
import axios from 'axios';

// Copy parser logic here to trace
const INGREDIENT_HEADER_RE =
  /składnik|ciast[oa]\b.*:|\bnadzi[eo]n|farsz\b|krem\b.*:|\bmas[aąy]\s|polew[aą]|biszko[pt]|sos\b.*:|\bkruszonk|\bglaz|\bbrioche|drożdżow|testo\b|beza\b.*:|\bgalaret|budyni|lukier|marynat|mus\b.*:/i;
const INSTRUCTION_HEADER_RE =
  /wykonanie|przygotowan|sposób\s*przyrządz|pieczenie|smażenie|gotowanie|jak\s+(zrobić|upiec|ugotować|przyrządzić|przygotować|usmaż)|praca\s+z\s+ciastem/i;

function isMsoBulletDiv(el: Element): boolean {
  const style = el.getAttribute("style") || "";
  const cls = el.className || "";
  return (
    (cls.includes("MsoNormal") || el.nodeName === "DIV") &&
    (style.includes("mso-list") || style.includes("text-indent: -14"))
  );
}
function cleanBulletText(el: Element): string {
  let text = el.textContent || "";
  text = text.replace(/^[\s·•\-\*►▪→]+/, "");
  text = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  return text;
}
function isIngredientGroupHeader(el: Element, text: string): boolean {
  if (text.length > 200) return false;
  const lower = text.toLowerCase();
  if (text.length < 60 && INGREDIENT_HEADER_RE.test(lower)) {
    return true;
  }
  if (text.length < 80) {
    const hasUnderline = el.querySelector("u") !== null;
    const hasBold = el.querySelector("b,strong") !== null;
    const endsWithColon = lower.trimEnd().endsWith(":");
    if (endsWithColon && (hasUnderline || hasBold)) return true;
  }
  return false;
}
function isInstructionHeader(text: string): boolean {
  if (text.length > 200) return false;
  return INSTRUCTION_HEADER_RE.test(text.toLowerCase());
}

async function run() {
  const q = 'Najprostsze ciasto z rabarbarem';
  const url = `https://gdywbrzuchuburczy.blogspot.com/feeds/posts/default?alt=json&max-results=1&q=${encodeURIComponent(q)}`;
  const res = await axios.get(url);
  const html = res.data.feed.entry[0].content.$t;

  const dom = new JSDOM(html);
  const doc = dom.window.document;

  doc.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="pinterest"]').forEach((el) => el.remove());
  doc.querySelectorAll('img[src*="social"]').forEach((el) => el.remove());

  doc.querySelectorAll("img").forEach((img) => {
    const table = img.closest("table.tr-caption-container");
    const separator = img.closest(".separator");
    const anchor = img.closest("a");
    if (table) table.remove();
    else if (separator) separator.remove();
    else if (anchor) anchor.remove();
    else img.remove();
  });

  const blocks: Element[] = [];
  const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "UL", "OL", "TABLE"]);

  const walk = (node: Element) => {
    if (!node.textContent || node.textContent.trim().length === 0) return;
    const tag = node.nodeName;
    if (BLOCK_TAGS.has(tag)) {
      blocks.push(node);
      return;
    }
    if (tag === "BLOCKQUOTE") {
      for (let i = 0; i < node.children.length; i++) walk(node.children[i]);
      return;
    }
    if (tag === "DIV") {
      let hasBlockChild = false;
      for (let i = 0; i < node.children.length; i++) {
        const childTag = node.children[i].nodeName;
        if (BLOCK_TAGS.has(childTag) || childTag === "BLOCKQUOTE" || childTag === "DIV") {
          hasBlockChild = true;
          break;
        }
      }
      if (hasBlockChild) {
        for (let i = 0; i < node.children.length; i++) walk(node.children[i]);
        return;
      }
      if (node.textContent && node.textContent.trim().length > 0) {
        blocks.push(node);
      }
      return;
    }
    for (let i = 0; i < node.children.length; i++) walk(node.children[i]);
  };

  walk(doc.body);

  let mode = "body";
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const text = block.textContent?.trim() || "";
    
    // TRACE
    console.log(`[${mode}] TAG:${block.nodeName} LEN:${text.length} TEXT: ${text.substring(0, 60).replace(/\n/g, '')}`);

    if (mode === "body" || mode === "instructions") {
      if (isIngredientGroupHeader(block, text)) {
        console.log(`  -> Transition to ingredients (Header)`);
        mode = "ingredients";
        continue;
      }
    }
    if (mode === "body") {
      if (isInstructionHeader(text) && text.length < 200) {
        console.log(`  -> Transition to instructions (Header)`);
        mode = "instructions";
        continue;
      }
    }
    if (mode === "ingredients") {
      if (isInstructionHeader(text) && text.length < 200) {
        console.log(`  -> Transition to instructions (Header)`);
        mode = "instructions";
        continue;
      }
      if (isIngredientGroupHeader(block, text) && text.length < 100) continue;
      
      const tag = block.nodeName;
      if (tag === "UL" || tag === "OL") continue;
      if (isMsoBulletDiv(block)) continue;
      
      if (tag === "DIV" || tag === "P") {
        const hasBr = block.innerHTML.includes("<br");
        const startsWithBullet = text.startsWith("-") || text.startsWith("·") || text.startsWith("•") || text.startsWith("*");
        if (hasBr || startsWithBullet) continue;
        
        if (text.length > 80 && !startsWithBullet) {
          console.log(`  -> Transition to instructions (Long text > 80)`);
          mode = "instructions";
          continue;
        }
        if (text.length < 80) continue;
      }
    }
    if (mode === "instructions") {
      if (isIngredientGroupHeader(block, text) && text.length < 100) {
        console.log(`  -> Transition to ingredients (Header in instructions)`);
        mode = "ingredients";
        continue;
      }
    }
  }
}
run();
