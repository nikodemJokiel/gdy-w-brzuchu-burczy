import fs from "fs";
import { createClient } from "@sanity/client";
import slugify from "slugify";
import * as dotenv from "dotenv";
import { htmlToPortableText } from "./htmlToPortableText.js";
import axios from "axios";
import { basename } from "path";

dotenv.config();

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET;
const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;

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

interface ExportedRecipe {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  bodyHtml: string;
  ingredients: string[];
  instructions: string;
  mainImageUrl: string;
  mainImageAlt: string;
  allImages: { url: string; alt: string }[];
  tags: string[];
  legacyUrl: string;
}

function normalizeTagName(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
}

function determineTagCategory(tagName: string): string {
  const t = tagName.toLowerCase();
  
  if (["boże narodzenie", "wielkanoc", "halloween", "walentynki", "tłusty czwartek", "sylwester", "urodziny", "imieniny"].includes(t)) {
    return "occasion";
  }
  
  if (["ciasta", "desery", "zupy", "sałatki", "napoje", "przetwory", "dania główne", "przekąski"].includes(t)) {
    return "dishType";
  }
  
  if (["włoska", "polska", "meksykańska", "azjatycka", "amerykańska"].includes(t) || t.includes("kuchnia")) {
    return "cuisine";
  }
  
  if (["truskawki", "czekolada", "jabłka", "dynia", "rabarbar", "szparagi", "maliny"].includes(t)) {
    return "ingredient";
  }
  
  return "other";
}

async function uploadImage(url: string, alt: string): Promise<any> {
  if (!url) return null;
  try {
    const res = await axios.get(url, { responseType: 'stream' });
    const filename = basename(url.split("?")[0]) || "image.jpg";
    console.log(`Downloading image: ${url}`);
    
    const asset = await client.assets.upload('image', res.data, { filename });
    return {
      _type: 'image',
      asset: {
        _type: "reference",
        _ref: asset._id
      },
      alt: alt || ""
    };
  } catch (e: any) {
    console.log(`Failed to upload image ${url}: ${e.message}`);
    return null;
  }
}

async function upload() {
  const postsRaw = fs.readFileSync("recipes-full-export.json", "utf-8");
  const allPosts: ExportedRecipe[] = JSON.parse(postsRaw);
  
  const posts = allPosts;
  
  console.log(`Starting upload for ALL ${posts.length} posts...`);
  
  const globalTags = new Map<string, {name: string, category: string, slug: string}>();
  for (const post of posts) {
    const rawTags = post.tags || [];
    for (const rawCat of rawTags) {
      const normalizedName = normalizeTagName(rawCat);
      const tagSlug = slugify(normalizedName, { lower: true, strict: true });
      if (!globalTags.has(tagSlug)) {
        globalTags.set(tagSlug, { name: normalizedName, category: determineTagCategory(normalizedName), slug: tagSlug });
      }
    }
  }
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\n[${i + 1}/${posts.length}] Uploading: ${post.title}`);
    
    // Create Tag references
    const tagRefs = [];
    const rawTags = post.tags || [];
    for (const rawCat of rawTags) {
      const normalizedName = normalizeTagName(rawCat);
      const tagSlug = slugify(normalizedName, { lower: true, strict: true });
      const tagId = `tag-${tagSlug}`;
      const tagInfo = globalTags.get(tagSlug)!;
      
      await client.createIfNotExists({
        _id: tagId,
        _type: "tag",
        name: tagInfo.name,
        slug: { _type: "slug", current: tagSlug },
        category: tagInfo.category,
      });
      
      tagRefs.push({
        _type: "reference",
        _ref: tagId,
        _key: Math.random().toString(36).substring(2, 9),
      });
    }
    
    // Zapisywanie obrazków do Sanity (mainImage + gallery)
    let mainImage = undefined;
    if (post.mainImageUrl) {
        mainImage = await uploadImage(post.mainImageUrl, post.mainImageAlt);
    }

    const gallery = [];
    if (post.allImages && post.allImages.length > 0) {
      for (const imgData of post.allImages) {
        // Skip duplicate of mainImage
        if (imgData.url === post.mainImageUrl) continue;
        const uploaded = await uploadImage(imgData.url, imgData.alt);
        if (uploaded) {
          uploaded._key = Math.random().toString(36).substring(2, 9);
          gallery.push(uploaded);
        }
      }
    }
    
    // Body HTML -> PortableText
    const portableTextBody = await htmlToPortableText(post.bodyHtml, client);
    
    // Process instructions (bez obrazków inline)
    let portableTextInstructions = undefined;
    if (post.instructions) {
      portableTextInstructions = await htmlToPortableText(post.instructions, client);
    }

    // Create excerpt from body text, fallback to instructions
    let firstTextBlock = portableTextBody.find((b: any) => b._type === "block" && b.children && b.children.length > 0);
    if (!firstTextBlock && portableTextInstructions) {
      firstTextBlock = portableTextInstructions.find((b: any) => b._type === "block" && b.children && b.children.length > 0);
    }
    
    let excerpt = "";
    if (firstTextBlock) {
      excerpt = firstTextBlock.children.map((c: any) => c.text).join("").substring(0, 197) + "...";
    }
    
    // Map ingredients directly into the name field of the sanity object
    const structuredIngredients = (post.ingredients || []).map(ing => ({
      _key: Math.random().toString(36).substring(2, 9),
      name: ing,
      amount: "",
      unit: "",
      group: ""
    }));
    
    const slug = post.slug || slugify(post.title, { lower: true, strict: true });
    
    const doc = {
      _id: `recipe-${slug}`,
      _type: "recipe",
      title: post.title,
      slug: { _type: "slug", current: slug },
      publishedAt: post.publishedAt,
      mainImage: mainImage,
      gallery: gallery.length > 0 ? gallery : undefined,
      excerpt: excerpt,
      body: portableTextBody,
      instructions: portableTextInstructions,
      ingredients: structuredIngredients,
      tags: tagRefs,
      legacyBloggerUrl: post.legacyUrl,
    };
    
    console.log(`Saving to Sanity: ${post.title}`);
    await client.createOrReplace(doc);
  }
  
  console.log("\nFinished uploading all posts!");
}

upload().catch((e) => {
  console.error("FATAL ERROR CAUGHT:");
  console.error(e);
  if (e && e.message) console.error(e.message);
  if (e && e.stack) console.error(e.stack);
});
