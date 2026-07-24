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

// ─── Ingredient-section header patterns ─────────────────────────────────────
// These match short text blocks that introduce a list of ingredients.
// Order matters: more specific patterns first, general last.
const INGREDIENT_HEADER_RE =
  /składnik|ciast[oa]\b.*:|\bnadzi[eo]n|farsz\b|krem\b.*:|\bmas[aąy]\s|polew[aą]|biszko[pt]|sos\b.*:|\bkruszonk|\bglaz|\bbrioche|drożdżow|testo\b|beza\b.*:|\bgalaret|budyni|lukier|marynat|mus\b.*:/i;

// Instruction-section header patterns
const INSTRUCTION_HEADER_RE =
  /wykonanie|przygotowan|sposób\s*przyrządz|pieczenie|smażenie|gotowanie|jak\s+(zrobić|upiec|ugotować|przyrządzić|przygotować|usmaż)|praca\s+z\s+ciastem/i;

// Detect if a div is a Word-style bulleted list item (MsoNormal with mso-list)
function isMsoBulletDiv(el: Element): boolean {
  const style = el.getAttribute("style") || "";
  const cls = el.className || "";
  return (
    (cls.includes("MsoNormal") || el.nodeName === "DIV") &&
    (style.includes("mso-list") || style.includes("text-indent: -14"))
  );
}

// Extract clean text from an element, stripping bullet chars and nbsp
function cleanBulletText(el: Element): string {
  let text = el.textContent || "";
  // Remove bullet markers
  text = text.replace(/^[\s·•\-\*►▪→]+/, "");
  // Collapse whitespace
  text = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  return text;
}

// Check if a block looks like an ingredient-group header
function isIngredientGroupHeader(el: Element, text: string): boolean {
  if (text.length > 200) return false;
  const lower = text.toLowerCase();

  // If the text is long, it's likely an instruction sentence containing a keyword, not a header
  if (text.length < 60 && INGREDIENT_HEADER_RE.test(lower)) {
    return true;
  }

  // Short underlined or bolded text ending with colon (common pattern)
  if (text.length < 80) {
    const hasUnderline = el.querySelector("u") !== null;
    const hasBold = el.querySelector("b,strong") !== null;
    const endsWithColon = lower.trimEnd().endsWith(":");
    if (endsWithColon && (hasUnderline || hasBold)) return true;
  }

  return false;
}

// Check if a block looks like an instruction header
function isInstructionHeader(text: string): boolean {
  if (text.length > 200) return false;
  return INSTRUCTION_HEADER_RE.test(text.toLowerCase());
}

// ─── Main extraction function ────────────────────────────────────────────────
function extractSections(html: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const extractedImages: { url: string; alt: string }[] = [];

  // Remove social icons
  doc
    .querySelectorAll(
      'a[href*="facebook.com"], a[href*="instagram.com"], a[href*="pinterest"]'
    )
    .forEach((el) => el.remove());
  doc.querySelectorAll('img[src*="social"]').forEach((el) => el.remove());

  // Collect and remove all images
  doc.querySelectorAll("img").forEach((img) => {
    let src = img.src || "";
    let alt = img.alt || "";

    // Upgrade Blogger image resolution
    src = src.replace(/\/(s|w)\d+(-h\d+)?(-[cp])?\//, "/s1600/");

    // Check for caption in table
    const captionContainer = img.closest("table.tr-caption-container");
    if (captionContainer) {
      const captionCell = captionContainer.querySelector(".tr-caption");
      if (captionCell && captionCell.textContent) {
        alt = captionCell.textContent.trim();
      }
    }

    if (
      src &&
      !src.includes("feeds.feedburner.com") &&
      !src.includes("tracking")
    ) {
      extractedImages.push({ url: src, alt: alt.trim() });
    }

    // Remove image containers
    const table = img.closest("table.tr-caption-container");
    const separator = img.closest(".separator");
    const anchor = img.closest("a");

    if (table) table.remove();
    else if (separator) separator.remove();
    else if (anchor) anchor.remove();
    else img.remove();
  });

  // ── Walk DOM to collect semantic blocks ──────────────────────────────────
  const blocks: Element[] = [];
  const BLOCK_TAGS = new Set([
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "UL",
    "OL",
    "TABLE",
  ]);

  const walk = (node: Element) => {
    // Skip empty nodes
    if (!node.textContent || node.textContent.trim().length === 0) return;

    const tag = node.nodeName;

    // Standard block-level elements: collect directly
    if (BLOCK_TAGS.has(tag) || tag === "BLOCKQUOTE") {
      blocks.push(node);
      return;
    }

    // DIV handling — the most complex part
    if (tag === "DIV") {
      // Check if this div contains block-level children
      let hasBlockChild = false;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.nodeName;
        if (
          BLOCK_TAGS.has(childTag) ||
          childTag === "BLOCKQUOTE" ||
          childTag === "DIV"
        ) {
          hasBlockChild = true;
          break;
        }
      }

      if (hasBlockChild) {
        // Container div — recurse into children
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i]);
        }
        return;
      }

      // Leaf div — treat as block (MsoNormal bullet items, plain text divs)
      if (node.textContent && node.textContent.trim().length > 0) {
        blocks.push(node);
      }
      return;
    }

    // Other elements: recurse
    for (let i = 0; i < node.children.length; i++) {
      walk(node.children[i]);
    }
  };

  walk(doc.body);

  // ── State machine: classify blocks into body / ingredients / instructions ─
  type Mode = "body" | "ingredients" | "instructions";
  let mode: Mode = "body";

  let bodyHtml = "";
  let instructionsHtml = "";
  const ingLines: string[] = [];

  // Helper to extract ingredient lines from a UL/OL element
  function extractListIngredients(listEl: Element) {
    listEl.querySelectorAll("li").forEach((li) => {
      const text = cleanBulletText(li);
      if (text.length > 1) ingLines.push(text);
    });
  }

  // Helper to extract ingredient lines from MsoNormal bullet divs
  function extractMsoBulletIngredient(el: Element) {
    const text = cleanBulletText(el);
    if (text.length > 1) ingLines.push(text);
  }

  // Helper to extract ingredients from text split by <br> (old-style posts)
  function extractBrSplitIngredients(el: Element) {
    const pieces = el.innerHTML.split(/<br\s*\/?>/i);
    pieces.forEach((p) => {
      const tempDoc = new JSDOM(p).window.document;
      let line = tempDoc.body.textContent?.trim() || "";
      line = line.replace(/^[-·•\*►▪→>\s]+/, "").trim();
      if (
        line.length > 1 &&
        !INGREDIENT_HEADER_RE.test(line.toLowerCase())
      ) {
        ingLines.push(line);
      }
    });
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const text = (block.textContent?.trim() || "");
    const tag = block.nodeName;

    // ── Detect section transitions ─────────────────────────────────────────

    // Check for ingredient-group header (works from body OR instructions mode)
    if (mode === "body" || mode === "instructions") {
      // A <UL>/<OL> right after an H2/H3 without any explicit "Składniki:" header
      // If we're still in body mode and hit a UL, check if the previous block was
      // an H-tag that looks like a recipe title (e.g. "Jak zrobić...?")
      if (
        mode === "body" &&
        (tag === "UL" || tag === "OL") &&
        i > 0
      ) {
        const prevTag = blocks[i - 1].nodeName;
        const prevText = blocks[i - 1].textContent?.trim() || "";
        // Previous block is a heading or short text that's a recipe title
        if (
          (prevTag.startsWith("H") || prevText.length < 100) &&
          !isInstructionHeader(prevText)
        ) {
          mode = "ingredients";
          extractListIngredients(block);
          continue;
        }
      }

      if (isIngredientGroupHeader(block, text)) {
        mode = "ingredients";
        // Don't add the header itself as an ingredient line
        continue;
      }
    }

    if (mode === "body") {
      // Check for "Składniki:" embedded as first keyword in a UL
      if (tag === "UL" || tag === "OL") {
        const firstLi = block.querySelector("li");
        if (firstLi) {
          const firstLiText = firstLi.textContent?.trim().toLowerCase() || "";
          if (INGREDIENT_HEADER_RE.test(firstLiText) && firstLiText.length < 30) {
            mode = "ingredients";
            // Remove the header LI, extract the rest
            const lis = block.querySelectorAll("li");
            lis.forEach((li, idx) => {
              if (idx === 0) return; // skip header LI
              const t = cleanBulletText(li);
              if (t.length > 1) ingLines.push(t);
            });
            continue;
          }
        }
      }

      // Detect MsoNormal bullet div as potential ingredient start
      if (isMsoBulletDiv(block) && text.length < 150) {
        // Check if the PREVIOUS block was an ingredient header
        if (i > 0) {
          const prevText = blocks[i - 1].textContent?.trim() || "";
          if (isIngredientGroupHeader(blocks[i - 1], prevText)) {
            mode = "ingredients";
            extractMsoBulletIngredient(block);
            continue;
          }
        }
      }

      // Instruction header while still in body (no ingredients found — recipe without listed ingredients)
      if (isInstructionHeader(text) && text.length < 200) {
        mode = "instructions";
        continue;
      }
    }

    if (mode === "ingredients") {
      // Check if we should transition to instructions
      if (isInstructionHeader(text) && text.length < 200) {
        mode = "instructions";
        continue;
      }

      // Ingredient group sub-header (e.g. "Nadzienie:", "Krem:")
      if (isIngredientGroupHeader(block, text) && text.length < 100) {
        // Stay in ingredients mode, skip the header text
        continue;
      }

      // UL/OL: extract all LIs as ingredients
      if (tag === "UL" || tag === "OL") {
        extractListIngredients(block);
        continue;
      }

      // MsoNormal bullet div
      if (isMsoBulletDiv(block)) {
        extractMsoBulletIngredient(block);
        continue;
      }

      // Div/P with <br>-separated content (old-style)
      if (tag === "DIV" || tag === "P") {
        const hasBr = block.innerHTML.includes("<br");
        const startsWithBullet =
          text.startsWith("-") ||
          text.startsWith("·") ||
          text.startsWith("•") ||
          text.startsWith("*");

        if (hasBr || startsWithBullet) {
          extractBrSplitIngredients(block);
          continue;
        }

        // Long text without bullet markers → transition to instructions
        if (text.length > 80 && !startsWithBullet) {
          mode = "instructions";
          instructionsHtml += block.outerHTML;
          continue;
        }

        // Short text that doesn't look like an ingredient — might be a sub-header
        if (text.length < 80) {
          // Check if it looks like an ingredient (has a number or unit-like word)
          const looksLikeIngredient =
            /\d/.test(text) ||
            /łyż|szt|szklank|garść|szczyp|opakowa|paczk|puszk|listek|gałąz/i.test(text);
          if (looksLikeIngredient) {
            const cleaned = text
              .replace(/^[-·•\*►▪→>\s]+/, "")
              .trim();
            if (cleaned.length > 1) ingLines.push(cleaned);
          }
          // Otherwise it's a sub-header like "Do dekoracji:" — skip but stay in ingredients
          continue;
        }
      }

      // H-tags in ingredients mode: check if it's actually an instruction header
      if (tag.startsWith("H")) {
        if (isInstructionHeader(text)) {
          mode = "instructions";
          continue;
        }
        // Otherwise it's a recipe-section heading that precedes more ingredients
        continue;
      }
    }

    if (mode === "instructions") {
      // Check if we encounter another ingredient-group header
      if (isIngredientGroupHeader(block, text) && text.length < 100) {
        mode = "ingredients";
        continue;
      }

      // MsoNormal bullet div after transitioning back from instructions
      if (isMsoBulletDiv(block) && i > 0) {
        const prevText = blocks[i - 1].textContent?.trim() || "";
        if (isIngredientGroupHeader(blocks[i - 1], prevText)) {
          mode = "ingredients";
          extractMsoBulletIngredient(block);
          continue;
        }
      }

      instructionsHtml += block.outerHTML;
      continue;
    }

    // Default: append to body
    if (mode === "body") {
      bodyHtml += block.outerHTML;
    }
  }

  // ── Fallback: if no ingredients found, try alternative strategies ─────────
  if (ingLines.length === 0 && bodyHtml.length > 200) {
    // Strategy 1: Look for UL/OL in the body HTML that might be ingredients
    const bodyDom = new JSDOM(bodyHtml);
    const bodyDoc = bodyDom.window.document;
    const lists = bodyDoc.querySelectorAll("ul, ol");

    if (lists.length > 0) {
      // Take the first list as potential ingredients
      const firstList = lists[0];
      const items: string[] = [];
      firstList.querySelectorAll("li").forEach((li) => {
        const t = cleanBulletText(li);
        if (t.length > 1) items.push(t);
      });

      // Heuristic: if 3+ items and most look like ingredients (short, possibly with numbers)
      if (items.length >= 3) {
        const looksLikeIngredients = items.filter(
          (item) =>
            item.length < 100 &&
            (/\d/.test(item) ||
              /łyż|szt|szklank|garść|szczyp|g\b|ml\b|dag\b|kg\b/i.test(item))
        ).length;

        if (looksLikeIngredients >= items.length * 0.5) {
          items.forEach((item) => ingLines.push(item));
          // Remove the list from bodyHtml
          firstList.remove();
          bodyHtml = bodyDoc.body.innerHTML.trim();
        }
      }
    }
  }

  // Strategy 2: Look for MsoNormal bullet divs in bodyHtml
  if (ingLines.length === 0 && bodyHtml.includes("mso-list")) {
    const bodyDom = new JSDOM(bodyHtml);
    const bodyDoc = bodyDom.window.document;
    const msoDivs = bodyDoc.querySelectorAll(
      'div[style*="mso-list"], div[style*="text-indent: -14"]'
    );

    if (msoDivs.length >= 3) {
      const items: string[] = [];
      msoDivs.forEach((div) => {
        const t = cleanBulletText(div);
        if (t.length > 1 && t.length < 150) items.push(t);
      });

      if (items.length >= 3) {
        items.forEach((item) => ingLines.push(item));
        msoDivs.forEach((div) => div.remove());
        bodyHtml = bodyDoc.body.innerHTML.trim();
      }
    }
  }

  return {
    bodyHtml: bodyHtml.trim(),
    ingredientsList: ingLines,
    instructionsHtml: instructionsHtml.trim(),
    images: extractedImages,
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
    console.log(
      `Fetching posts ${startIndex} to ${startIndex + maxResults - 1}...`
    );
    const url = `${BLOGSPOT_URL}/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${maxResults}`;

    try {
      const res = await axios.get(url);
      const feed = res.data.feed;
      const entries = feed.entry || [];

      if (entries.length === 0) break;

      for (const entry of entries) {
        const title = entry.title.$t;
        const legacyUrl =
          entry.link.find((l: any) => l.rel === "alternate")?.href || "";
        const publishedAt = entry.published.$t;
        const rawCategories = entry.category
          ? entry.category.map((c: any) => c.term)
          : [];
        const content = entry.content ? entry.content.$t : "";

        const { bodyHtml, ingredientsList, instructionsHtml, images } =
          extractSections(content);

        // Fetch comments
        const repliesLink = entry.link.find(
          (l: any) => l.rel === "replies" && l.type.includes("json")
        );
        let comments: any[] = [];
        if (repliesLink) {
          try {
            const commRes = await axios.get(repliesLink.href);
            const commEntries = commRes.data.feed.entry || [];
            comments = commEntries.map((c: any) => ({
              author: c.author?.[0]?.name?.$t || "Anonim",
              publishedAt: c.published.$t,
              content: c.content?.$t || "",
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
          comments,
        });
      }

      startIndex += maxResults;
    } catch (e: any) {
      console.error("Error fetching feed", e.message);
      break;
    }
  }

  console.log(`Found ${allPosts.length} posts in total.`);

  // Stats
  const noIng = allPosts.filter((p) => p.ingredientsList.length === 0);
  const noInstr = allPosts.filter(
    (p) => !p.instructionsHtml || p.instructionsHtml.length < 10
  );
  console.log(`Posts with NO ingredients: ${noIng.length}`);
  console.log(`Posts with NO instructions: ${noInstr.length}`);
  if (noIng.length > 0) {
    console.log("Posts missing ingredients:");
    noIng.forEach((p) => console.log(`  - ${p.title}`));
  }

  const outFile = "migration-data.json";
  fs.writeFileSync(outFile, JSON.stringify(allPosts, null, 2));
  console.log(`Saved extracted data to ${outFile}`);
}

run();
