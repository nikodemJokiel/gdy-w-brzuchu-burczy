import fs from "fs";

function run() {
  const data = JSON.parse(fs.readFileSync("recipes-full-export.json", "utf-8"));
  
  let missingBody = 0;
  let missingIngredients = 0;
  let missingInstructions = 0;
  let missingTags = 0;
  
  const weirdBodies = [];
  
  for (const post of data) {
    if (!post.bodyHtml || post.bodyHtml.trim() === "") missingBody++;
    if (!post.ingredients || post.ingredients.length === 0) missingIngredients++;
    if (!post.instructions || post.instructions.trim() === "") missingInstructions++;
    if (!post.tags || post.tags.length === 0) missingTags++;
    
    // Check for weird characters/tags in the plain text representation
    // To do this roughly, we can just check the raw HTML for unusual patterns.
    // The user mentioned blockquote or dots. We will clean HTML during upload, but let's check.
    if (post.bodyHtml && post.bodyHtml.includes("<blockquote>")) {
      weirdBodies.push({ title: post.title, issue: "contains blockquote" });
    }
    if (post.bodyHtml && (post.bodyHtml.includes("..") || post.bodyHtml.includes("·"))) {
      weirdBodies.push({ title: post.title, issue: "contains dots or bullets" });
    }
  }
  
  console.log(`Total posts: ${data.length}`);
  console.log(`Missing description (bodyHtml): ${missingBody}`);
  console.log(`Missing ingredients: ${missingIngredients}`);
  console.log(`Missing instructions: ${missingInstructions}`);
  console.log(`Missing tags: ${missingTags}`);
  
  if (missingBody > 0) {
    console.log("\nSample posts missing description:");
    data.filter((p: any) => !p.bodyHtml || p.bodyHtml.trim() === "").slice(0, 5).forEach((p: any) => console.log(` - ${p.title}`));
  }
  
  console.log(`\nPosts with blockquote in body: ${weirdBodies.length}`);
  if (weirdBodies.length > 0) {
    weirdBodies.slice(0, 5).forEach(wb => console.log(` - ${wb.title}: ${wb.issue}`));
  }
}

run();
