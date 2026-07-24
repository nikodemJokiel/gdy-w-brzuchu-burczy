import { JSDOM } from "jsdom";
import axios from "axios";
import type { SanityClient } from "@sanity/client";

/**
 * Converts Blogger HTML content into Portable Text blocks.
 * Simultaneously finds images, downloads them, and uploads to Sanity.
 */
export async function htmlToPortableText(
  html: string,
  sanityClient: SanityClient
): Promise<any[]> {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const blocks: any[] = [];
  
  // Custom traverse function to build Portable Text
  const parseNode = async (node: Node): Promise<any> => {
    // Note: this is a simplified version. For production we would use
    // @sanity/block-tools with the compiled schema, but writing a custom
    // one allows us to easily hook into the image upload process inline.
    
    // In Blogger, images are often inside <a> tags (links to larger images).
    if (node.nodeName === "IMG") {
      const img = node as HTMLImageElement;
      let src = img.src;
      
      // Sometimes Blogger images are HTTP, enforce HTTPS
      if (src.startsWith("http://")) {
        src = src.replace("http://", "https://");
      }
      
      try {
        console.log(`Downloading image: ${src}`);
        const response = await axios.get(src, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");
        
        console.log(`Uploading to Sanity...`);
        const asset = await sanityClient.assets.upload("image", buffer, {
          filename: src.split("/").pop() || "image.jpg",
        });
        
        return {
          _type: "image",
          _key: generateKey(),
          asset: {
            _type: "reference",
            _ref: asset._id,
          },
          alt: img.alt || "",
        };
      } catch (e) {
        console.error(`Failed to process image ${src}`, e);
        return null;
      }
    }
    
    return null;
  };

  // Helper to generate a random key for blocks
  const generateKey = () => Math.random().toString(36).substring(2, 9);

  // Split content by paragraphs or block elements to create root level blocks
  // For simplicity, we just dump everything into a single block or multiple if images exist.
  // In a real migration, we'd traverse and separate text from images.
  
  let currentTextBlock: any = {
    _type: "block",
    _key: generateKey(),
    style: "normal",
    markDefs: [],
    children: [],
  };
  
  const processChildren = async (parent: Node) => {
    for (let i = 0; i < parent.childNodes.length; i++) {
      const node = parent.childNodes[i];
      
      if (node.nodeName === "IMG") {
        // Push the current text block if it has content
        if (currentTextBlock.children.length > 0) {
          blocks.push({ ...currentTextBlock });
          currentTextBlock = {
            _type: "block",
            _key: generateKey(),
            style: "normal",
            markDefs: [],
            children: [],
          };
        }
        
        // Process image
        const imgBlock = await parseNode(node);
        if (imgBlock) {
          blocks.push(imgBlock);
        }
      } else if (node.nodeName === "A") {
        // Check if it's a wrapper for an image
        const img = Array.from(node.childNodes).find(n => n.nodeName === "IMG");
        if (img) {
          // It's an image wrapper, process the image
          if (currentTextBlock.children.length > 0) {
            blocks.push({ ...currentTextBlock });
            currentTextBlock = {
              _type: "block",
              _key: generateKey(),
              style: "normal",
              markDefs: [],
              children: [],
            };
          }
          const imgBlock = await parseNode(img);
          if (imgBlock) {
            blocks.push(imgBlock);
          }
        } else {
          // Standard text link
          const linkNode = node as HTMLAnchorElement;
          const markKey = generateKey();
          
          currentTextBlock.markDefs.push({
            _key: markKey,
            _type: "link",
            href: linkNode.href,
            blank: true
          });
          
          currentTextBlock.children.push({
            _type: "span",
            _key: generateKey(),
            text: linkNode.textContent || "",
            marks: [markKey],
          });
        }
      } else if (node.nodeType === 3) { // Text node
        const text = node.textContent?.replace(/\s+/g, " ") || "";
        if (text.trim().length > 0 || text === " ") {
          currentTextBlock.children.push({
            _type: "span",
            _key: generateKey(),
            text: text,
            marks: [],
          });
        }
      } else if (node.nodeName === "BR") {
        // Line break
        currentTextBlock.children.push({
          _type: "span",
          _key: generateKey(),
          text: "\n",
          marks: [],
        });
      } else if (node.nodeName === "DIV" || node.nodeName === "P") {
        // New block
        if (currentTextBlock.children.length > 0) {
          blocks.push({ ...currentTextBlock });
        }
        currentTextBlock = {
          _type: "block",
          _key: generateKey(),
          style: "normal",
          markDefs: [],
          children: [],
        };
        await processChildren(node);
      } else {
        // Recursively process other nodes (span, etc.)
        await processChildren(node);
      }
    }
  };

  await processChildren(document.body);
  
  if (currentTextBlock.children.length > 0) {
    blocks.push(currentTextBlock);
  }

  return blocks;
}
