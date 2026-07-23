import axios from "axios";
import { JSDOM } from "jsdom";
import fs from "fs";

const BLOGSPOT_URL = "https://gdywbrzuchuburczy.blogspot.com";

interface ExtractedData {
  id: string;
  title: string;
  legacyUrl: string;
  publishedAt: string;
  rawCategories: string[];
  bodyHtml: string;
  ingredientsList: string[];
  instructionsHtml: string;
  images: { url: string; alt: string }[];
  comments: any[];
}

// Heurystyka do dzielenia HTML
function extractSections(html: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  const extractedImages: { url: string; alt: string }[] = [];

  // Usuń ikony social mediów i niepotrzebne śmieci
  doc.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="pinterest"]').forEach(el => {
    el.remove();
  });
  doc.querySelectorAll('img[src*="social"]').forEach(el => el.remove());
  
  // Zebranie i usunięcie wszystkich zdjęć z posta (aby znalazły się w karuzeli, a nie w tekście)
  doc.querySelectorAll('img').forEach(img => {
    let src = img.src || "";
    let alt = img.alt || "";

    // Blogger często ma w URL coś w stylu /s400/ lub /s640/ - spróbujmy zamienić to na /s1600/ dla lepszej jakości
    // Przykład: https://blogger.googleusercontent.com/img/b/R2.../s640/IMG.jpg
    src = src.replace(/\/(s|w)\d+(-h\d+)?(-[cp])?\//, '/s1600/');

    // Jeśli to jest w table.tr-caption-container, znajdźmy alt
    const captionContainer = img.closest('table.tr-caption-container');
    if (captionContainer) {
      const captionCell = captionContainer.querySelector('.tr-caption');
      if (captionCell && captionCell.textContent) {
        alt = captionCell.textContent.trim();
      }
    }

    if (src && !src.includes("feeds.feedburner.com") && !src.includes("tracking")) {
      extractedImages.push({ url: src, alt: alt.trim() });
    }

    // Usuwanie obrazka z drzewa - czyścimy też kontenery typu .separator i a.image-link
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
      
      // Jeśli jest to dłuższy, zwykły tekst i przeszliśmy listę (lub nie widzieliśmy UL ale to po prostu długi blok bez myślników na początku) - przechodzimy do instrukcji.
      const startsWithBullet = text.startsWith("-") || text.startsWith("·") || text.startsWith("•");
      const isAfterIngredientsP = !isInstructionHeader && block.nodeName !== "UL" && block.nodeName !== "OL" && text.length > 80 && !startsWithBullet && !lowerText.includes("składnik") && !lowerText.includes("ciasto") && !lowerText.includes("krem");
      
      if (isInstructionHeader || (isAfterIngredientsP && i > 0)) {
         mode = "instructions";
         if (isInstructionHeader) continue;
      }
    }
    
    // Append to correct string
    if (mode === "body") {
      bodyHtml += block.outerHTML;
    } else if (mode === "ingredients") {
      // Wyciągnij elementy z UL/OL lub podziel po liniach/BR z surowego tekstu
      if (block.nodeName === "UL" || block.nodeName === "OL") {
         block.querySelectorAll("li").forEach(li => {
            const liText = li.textContent?.trim();
            if (liText && liText.length > 2) ingLines.push(liText);
         });
      } else {
         // Rozdziel tekst po znakach nowej linii (Blogger często w DIV pakuje text nodes przedzielone <br>)
         // W DOMie jsdom, outerHTML ma <br>. Możemy po prostu splitować:
         const pieces = block.innerHTML.split(/<br\s*\/?>/i);
         pieces.forEach(p => {
             // Oczyść HTML by dostać surowy tekst z każdej części
             const tempDoc = new JSDOM(p).window.document;
             let line = tempDoc.body.textContent?.trim() || "";
             // Usuń "zwykłe" punktory z tekstu np. "-" albo "· "
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
    instructionsHtml: instructionsHtml.trim(),
    images: extractedImages
  };
}

async function fetchComments(postUrl: string): Promise<any[]> {
  return [];
}

async function run() {
  let startIndex = 1;
  const maxResults = 100;
  let allPosts: ExtractedData[] = [];
  
  while (true) {
    console.log(`Fetching posts ${startIndex} to ${startIndex + maxResults - 1}...`);
    const url = `${BLOGSPOT_URL}/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${maxResults}`;
    
    try {
      const res = await axios.get(url);
      const feed = res.data.feed;
      const entries = feed.entry || [];
      
      if (entries.length === 0) break;
      
      for (const entry of entries) {
        const title = entry.title.$t;
        const legacyUrl = entry.link.find((l: any) => l.rel === "alternate")?.href || "";
        const publishedAt = entry.published.$t;
        const rawCategories = entry.category ? entry.category.map((c: any) => c.term) : [];
        const content = entry.content ? entry.content.$t : "";
        
        const { bodyHtml, ingredientsList, instructionsHtml, images } = extractSections(content);
        
        // Znajdź link do komentarzy
        const repliesLink = entry.link.find((l: any) => l.rel === "replies" && l.type.includes("json"));
        let comments = [];
        if (repliesLink) {
           try {
             const commRes = await axios.get(repliesLink.href);
             const commEntries = commRes.data.feed.entry || [];
             comments = commEntries.map((c: any) => ({
               author: c.author?.[0]?.name?.$t || "Anonim",
               publishedAt: c.published.$t,
               content: c.content?.$t || ""
             }));
           } catch (e) {
             console.log(`Failed to fetch comments for ${title}`);
           }
        }
        
        allPosts.push({
          id: entry.id.$t,
          title,
          legacyUrl,
          publishedAt,
          rawCategories,
          bodyHtml,
          ingredientsList,
          instructionsHtml,
          images,
          comments
        });
      }
      
      startIndex += maxResults;
    } catch (e: any) {
      console.error("Error fetching feed", e.message);
      break;
    }
  }
  
  console.log(`Found ${allPosts.length} posts in total.`);
  
  const outFile = "migration-data.json";
  fs.writeFileSync(outFile, JSON.stringify(allPosts, null, 2));
  console.log(`Saved extracted data to ${outFile}`);
}

run();
