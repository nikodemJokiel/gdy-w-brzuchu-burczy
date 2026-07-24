import fs from "fs";

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

function run() {
  const inFile = "migration-data.json";
  const outFile = "recipes-full-export.json";

  if (!fs.existsSync(inFile)) {
    console.error(`File ${inFile} not found. Run step1_extract.ts first.`);
    process.exit(1);
  }

  const data: ExtractedData[] = JSON.parse(fs.readFileSync(inFile, "utf8"));

  // Sort by published date descending
  data.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const exportData = data.map((post) => {
    // Generate a slug based on title (similar to Sanity's slugify)
    const slug = post.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      id: post.id,
      title: post.title,
      slug: slug,
      publishedAt: post.publishedAt,
      bodyHtml: post.bodyHtml,
      ingredients: post.ingredientsList,
      instructions: post.instructionsHtml,
      mainImageUrl: post.images.length > 0 ? post.images[0].url : null,
      mainImageAlt: post.images.length > 0 ? post.images[0].alt : null,
      allImages: post.images,
      tags: post.rawCategories,
      legacyUrl: post.legacyUrl,
    };
  });

  fs.writeFileSync(outFile, JSON.stringify(exportData, null, 2));
  console.log(`Successfully exported ${exportData.length} recipes to ${outFile}`);
  console.log("You can use this file to manually tag mealType and diet for each recipe.");
}

run();
