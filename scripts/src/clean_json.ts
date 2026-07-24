import fs from "fs";
import { JSDOM } from "jsdom";
import axios from "axios";

// Helper to fetch missing descriptions for the 5 edge cases
async function fetchMissingDescription(legacyUrl: string): Promise<string> {
  try {
    const res = await axios.get(legacyUrl);
    const dom = new JSDOM(res.data);
    const doc = dom.window.document;
    
    const postBody = doc.querySelector(".post-body");
    if (!postBody) return "";

    // Remove images to avoid getting alt texts
    postBody.querySelectorAll("img").forEach(img => img.remove());
    // Remove scripts/styles
    postBody.querySelectorAll("script, style").forEach(el => el.remove());

    let textNodes: string[] = [];
    
    // Simple heuristic: get all paragraphs/text until we see an ingredient header
    const walker = doc.createTreeWalker(postBody, dom.window.NodeFilter.SHOW_ELEMENT | dom.window.NodeFilter.SHOW_TEXT, null);
    
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 3) {
        const text = node.textContent?.trim();
        if (text) {
          if (/składnik|ciast[oa]\b.*:|\bnadzi[eo]n|farsz\b|krem\b.*:/i.test(text.toLowerCase()) && text.length < 100) {
            break; // Reached ingredients
          }
          textNodes.push(text);
        }
      }
    }
    
    return `<p>${textNodes.join("</p><p>")}</p>`;
  } catch (e) {
    console.error(`Failed to fetch ${legacyUrl}`);
    return "";
  }
}

function cleanHtmlString(html: string): string {
  if (!html) return "";
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // 1. Unwrap blockquotes
  doc.querySelectorAll("blockquote").forEach(el => {
    const frag = doc.createDocumentFragment();
    while (el.firstChild) {
      frag.appendChild(el.firstChild);
    }
    el.replaceWith(frag);
  });
  
  // 2. Unwrap ALL links (user doesn't want any <a> tags)
  doc.querySelectorAll("a").forEach(el => {
    const frag = doc.createDocumentFragment();
    while (el.firstChild) {
      frag.appendChild(el.firstChild);
    }
    el.replaceWith(frag);
  });

  // 3. Unwrap styling tags if user wants pure JSON
  const tagsToUnroll = ["i", "b", "strong", "em", "u", "span", "font", "div"];
  tagsToUnroll.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => {
      if (tag === "div") {
        const p = doc.createElement("p");
        p.innerHTML = el.innerHTML;
        el.replaceWith(p);
      } else {
        const frag = doc.createDocumentFragment();
        while (el.firstChild) {
          frag.appendChild(el.firstChild);
        }
        el.replaceWith(frag);
      }
    });
  });

  // Remove attributes
  doc.querySelectorAll("*").forEach(el => {
    while (el.attributes.length > 0) {
      el.removeAttribute(el.attributes[0].name);
    }
  });
  
  // Replace newlines with spaces
  let finalHtml = doc.body.innerHTML;
  finalHtml = finalHtml.replace(/\n/g, " ");
  // Also clean up multiple spaces
  finalHtml = finalHtml.replace(/\s{2,}/g, " ");
  
  return finalHtml;
}

async function run() {
  const data = JSON.parse(fs.readFileSync("recipes-full-export.json", "utf-8"));
  let updatedCount = 0;

  for (const post of data) {
    // 1. Fix missing descriptions for specific posts
    if (!post.bodyHtml || post.bodyHtml.trim() === "") {
      console.log(`Fetching missing description for: ${post.title}`);
      const fixedBody = await fetchMissingDescription(post.legacyUrl);
      if (fixedBody) {
        post.bodyHtml = fixedBody;
        console.log(`Fixed body for ${post.title}`);
      }
    }
    
    // 2. Clean HTML
    post.bodyHtml = cleanHtmlString(post.bodyHtml);
    post.instructions = cleanHtmlString(post.instructions);
    
    updatedCount++;
  }
  
  fs.writeFileSync("recipes-full-export.json", JSON.stringify(data, null, 2));
  console.log(`Cleaned HTML tags and fixed missing bodies. Processed ${updatedCount} posts.`);
}

run();
