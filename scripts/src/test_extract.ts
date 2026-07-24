import axios from "axios";
import { JSDOM } from "jsdom";

async function run() {
  const url = "https://gdywbrzuchuburczy.blogspot.com/feeds/posts/default?alt=json&q=Deser+podwójnie+kawowy+z+musem+malinowym";
  const res = await axios.get(url);
  const entry = res.data.feed.entry[0];
  const html = entry.content.$t;
  
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "UL", "OL", "TABLE"]);
  
  const blocks: Element[] = [];
  const walk = (node: Element) => {
    if (!node.textContent || node.textContent.trim().length === 0) return;
    const tag = node.nodeName;

    if (BLOCK_TAGS.has(tag) || tag === "BLOCKQUOTE") {
      blocks.push(node);
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
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i]);
        }
        return;
      }
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
  console.log(`Found ${blocks.length} blocks.`);
  blocks.forEach((b, i) => {
    console.log(`Block ${i} [${b.nodeName}]: ${b.textContent?.trim().substring(0, 50)}`);
  });
}

run();
