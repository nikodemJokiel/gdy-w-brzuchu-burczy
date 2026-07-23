import axios from "axios";
import { JSDOM } from "jsdom";
import fs from "fs";

function extractSections(html: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Usuń zdjęcia (uproszczone usuwanie by zobaczyć szkielet)
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
    const blockNames = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'UL', 'OL', 'BLOCKQUOTE', 'TABLE'];
    if (blockNames.includes(node.nodeName)) {
      blocks.push(node);
      return; 
    }
    
    let hasBlockChildren = false;
    for (let i = 0; i < node.children.length; i++) {
        if (blockNames.includes(node.children[i].nodeName) || node.children[i].querySelector(blockNames.join(","))) {
            hasBlockChildren = true;
            break;
        }
    }

    if (node.nodeName === "DIV" && !hasBlockChildren) {
        if (node.textContent && node.textContent.trim().length > 0) {
            blocks.push(node);
        }
        return;
    }

    for (let i = 0; i < node.children.length; i++) {
       walk(node.children[i]);
    }
  };
  walk(doc.body);
  
  let mode = "body";
  let bodyHtml = "";
  let instructionsHtml = "";
  const ingLines: string[] = [];
  let seenUlInIngredients = false;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const text = block.textContent?.trim() || "";
    const lowerText = text.toLowerCase();
    const isShort = lowerText.length < 150;
    
    console.log("-> loop start Mode:", mode, "| Block:", block.nodeName, text.substring(0, 30).replace(/\n/g, " "));

    // Check transitions
    if (mode === "body") {
      if (isShort && (lowerText.includes("składnik") || lowerText === "ciasto:" || lowerText === "krem:" || lowerText === "kruszonka:")) {
        mode = "ingredients";
        continue;
      }
    } else if (mode === "ingredients") {
      if (block.nodeName === "UL" || block.nodeName === "OL") {
         seenUlInIngredients = true;
      }
      
      const isInstructionHeader = isShort && (lowerText.includes("wykonanie") || lowerText.includes("przygotowani") || lowerText.includes("pieczenie"));
      
      const startsWithBullet = text.startsWith("-") || text.startsWith("·") || text.startsWith("•");
      const isAfterIngredientsP = !isInstructionHeader && block.nodeName !== "UL" && block.nodeName !== "OL" && text.length > 80 && !startsWithBullet && !lowerText.includes("składnik") && !lowerText.includes("ciasto") && !lowerText.includes("krem");
      
      if (isInstructionHeader || (isAfterIngredientsP && i > 0)) {
         mode = "instructions";
         if (isInstructionHeader) continue;
      }
    }
    
    if (mode === "body") {
      bodyHtml += block.outerHTML;
    } else if (mode === "ingredients") {
      if (block.nodeName === "UL" || block.nodeName === "OL") {
         console.log("FOUND UL, length of lis:", block.querySelectorAll("li").length);
         block.querySelectorAll("li").forEach(li => {
            const liText = li.textContent?.trim();
            console.log("  -> liText:", liText);
            if (liText && liText.length > 2) ingLines.push(liText);
         });
      } else {
         const pieces = block.innerHTML.split(/<br\s*\/?>/i);
         pieces.forEach(p => {
             const tempDoc = new JSDOM(p).window.document;
             let line = tempDoc.body.textContent?.trim() || "";
             line = line.replace(/^[-\·\•\*\>]\s*/, "");
             if (line.length > 2 && !line.toLowerCase().includes("składnik")) {
                 ingLines.push(line);
             }
         });
      }
    } else {
      instructionsHtml += block.outerHTML;
    }
  }

  return {
    bodyHtml: bodyHtml.trim(),
    ingredientsList: ingLines,
    instructionsHtml: instructionsHtml.trim()
  };
}

const BLOGSPOT_URL = "https://gdywbrzuchuburczy.blogspot.com";

async function testExtraction() {
  // Nowe posty (start-index=1)
  const urlNew = `${BLOGSPOT_URL}/feeds/posts/default?alt=json&start-index=1&max-results=1`;
  const resNew = await axios.get(urlNew);
  const entryNew = resNew.data.feed.entry[0];
  
  // Stare posty (start-index=650)
  const urlOld = `${BLOGSPOT_URL}/feeds/posts/default?alt=json&start-index=650&max-results=1`;
  const resOld = await axios.get(urlOld);
  const entryOld = resOld.data.feed.entry[0];

  console.log("=== NEW POST:", entryNew.title.$t);
  const dom1 = new JSDOM(entryNew.content.$t);
  dom1.window.document.body.querySelectorAll("p,h1,h2,h3,h4,h5,ul,ol,div").forEach(b => console.log("NEW BLOCK:", b.nodeName, b.textContent?.substring(0, 50).trim()));
  const res1 = extractSections(entryNew.content.$t);
  console.log("INGREDIENTS:", res1.ingredientsList);
  console.log("INSTRUCTIONS HAS CONTENT?", res1.instructionsHtml.length > 0);

  console.log("\n=== OLD POST:", entryOld.title.$t);
  const res2 = extractSections(entryOld.content.$t);
  console.log("INGREDIENTS:", res2.ingredientsList);
  console.log("INSTRUCTIONS HAS CONTENT?", res2.instructionsHtml.length > 0);
}

testExtraction().catch(console.error);
