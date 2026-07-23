import { createClient } from "@sanity/client";
import axios from "axios";
import { parseStringPromise } from "xml2js";
import slugify from "slugify";
import * as dotenv from "dotenv";
import { htmlToPortableText } from "./htmlToPortableText.js";

// Load environment variables from .env
dotenv.config();

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET;
const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;
const BLOGSPOT_URL = "https://gdywbrzuchuburczy.blogspot.com";
const RSS_URL = `${BLOGSPOT_URL}/feeds/posts/default?alt=rss&max-results=500`;

if (!PROJECT_ID || !DATASET || !WRITE_TOKEN) {
  console.error("Missing Sanity credentials in .env");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  token: WRITE_TOKEN,
  apiVersion: "2024-07-23",
  useCdn: false,
});

async function migrate() {
  console.log(`Fetching RSS feed from: ${RSS_URL}`);
  
  try {
    const response = await axios.get(RSS_URL);
    const xml = response.data;
    const parsed = await parseStringPromise(xml);
    
    const items = parsed.rss.channel[0].item;
    console.log(`Found ${items.length} posts to migrate.`);
    
    // Process items (limit to 5 for testing initially, remove slice for full run)
    // We will process sequentially to avoid overwhelming Sanity's rate limits
    for (let i = 0; i < 5; i++) {
      const item = items[i];
      const title = item.title[0];
      const link = item.link[0];
      const pubDate = new Date(item.pubDate[0]).toISOString();
      const content = item["content:encoded"] ? item["content:encoded"][0] : item.description[0];
      const rawCategories = item.category || [];
      
      console.log(`\n[${i + 1}/${items.length}] Processing: ${title}`);
      
      // 1. Process tags
      const tagRefs = [];
      for (const cat of rawCategories) {
        // xml2js might parse category as string or object { _: 'tag', $:{...} }
        const catName = typeof cat === 'string' ? cat : (cat._ || cat);
        if (typeof catName !== 'string') continue;
        
        const tagSlug = slugify(catName, { lower: true, strict: true });
        const tagId = `tag-${tagSlug}`;
        
        // Create tag document if it doesn't exist
        await client.createIfNotExists({
          _id: tagId,
          _type: "tag",
          name: catName,
          slug: { _type: "slug", current: tagSlug },
          category: "other", // Default category, needs manual sorting later
        });
        
        tagRefs.push({
          _type: "reference",
          _ref: tagId,
          _key: Math.random().toString(36).substring(2, 9),
        });
      }
      
      // 2. Process content and images
      const portableText = await htmlToPortableText(content, client);
      
      // 3. Find first image to use as mainImage
      const firstImageBlock = portableText.find((b: any) => b._type === "image");
      let mainImage = undefined;
      
      if (firstImageBlock) {
        mainImage = {
          _type: "image",
          asset: firstImageBlock.asset,
          alt: firstImageBlock.alt,
        };
      }
      
      // 4. Generate excerpt from first text block
      const firstTextBlock = portableText.find((b: any) => b._type === "block" && b.children && b.children.length > 0);
      let excerpt = "";
      if (firstTextBlock) {
        excerpt = firstTextBlock.children.map((c: any) => c.text).join("").substring(0, 197) + "...";
      }
      
      // 5. Create Sanity document
      const slug = slugify(title, { lower: true, strict: true });
      const doc = {
        _id: `recipe-${slug}`,
        _type: "recipe",
        title: title,
        slug: { _type: "slug", current: slug },
        publishedAt: pubDate,
        mainImage: mainImage,
        excerpt: excerpt,
        body: portableText,
        tags: tagRefs,
        legacyBloggerUrl: link,
      };
      
      console.log(`Saving document: ${title}`);
      await client.createOrReplace(doc);
    }
    
    console.log("\nMigration script finished.");
    console.log("Note: Only 5 posts were migrated for testing. Remove the .slice in migrate.ts to run for all posts.");
    
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
