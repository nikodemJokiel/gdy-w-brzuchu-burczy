import axios from "axios";
import { JSDOM } from "jsdom";
import fs from "fs";

// Kopiujemy oryginalną heurystykę ze step1
function extractSections(html: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Usuń zdjęcia
  doc.querySelectorAll('img').forEach(img => {
    const anchor = img.closest('a');
    const separator = img.closest('.separator');
    const table = img.closest('table.tr-caption-container');
    
    if (table) table.remove();
    else if (separator) separator.remove();
    else if (anchor) anchor.remove();
    else img.remove();
  });
  
  const blocks: Element[] = [];
  const walk = (node: Element) => {
    const blockNames = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'UL', 'OL', 'BLOCKQUOTE', 'TABLE', 'DIV'];
    if (blockNames.includes(node.nodeName)) {
      blocks.push(node);
      return; 
    }
    for (let i = 0; i < node.children.length; i++) {
       walk(node.children[i]);
    }
  };
  walk(doc.body);
  
  return blocks.map(b => b.textContent?.trim()).filter(Boolean);
}

const BLOGSPOT_URL = "https://gdywbrzuchuburczy.blogspot.com";

async function testOldPost() {
  const url = `${BLOGSPOT_URL}/feeds/posts/default?alt=json&start-index=650&max-results=2`;
  const res = await axios.get(url);
  const entries = res.data.feed.entry || [];
  
  for (const entry of entries) {
    console.log("=== TITLE:", entry.title.$t);
    const content = entry.content.$t;
    const dom = new JSDOM(content);
    // console.log("RAW HTML", content.substring(0, 1000));
    console.log("EXTRACTED BLOCKS:");
    const blocks = extractSections(content);
    blocks.forEach((b, i) => {
        console.log(`[${i}] ${b.substring(0, 100)}...`);
    });
    console.log("\n");
  }
}

testOldPost().catch(console.error);
