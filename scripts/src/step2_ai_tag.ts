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
  comments: any[];
}

interface TagData {
  id: string;
  mealType: string;
  diet: string[];
}

function classifyMealType(title: string, categories: string[]): string {
  const t = title.toLowerCase();
  const c = categories.map(cat => cat.toLowerCase()).join(" ");
  const combined = t + " " + c;

  if (combined.includes("śniadani") || combined.includes("owsianka") || combined.includes("jajecznic") || combined.includes("placuszki") || combined.includes("omlet")) return "breakfast";
  if (combined.includes("zup") || combined.includes("obiad") || combined.includes("makaron") || combined.includes("kurczak") || combined.includes("zapiekanka") || combined.includes("risotto")) return "lunch";
  if (combined.includes("kolacj") || combined.includes("sałatk") || combined.includes("kanapk")) return "dinner";
  if (combined.includes("ciasto") || combined.includes("deser") || combined.includes("tart") || combined.includes("babka") || combined.includes("sernik") || combined.includes("słodk") || combined.includes("muffiny") || combined.includes("brownie") || combined.includes("lody") || combined.includes("pucharkach") || combined.includes("bułecz")) return "dessert";
  if (combined.includes("przekąsk") || combined.includes("przystawk") || combined.includes("krakers") || combined.includes("chipsy") || combined.includes("hummus")) return "snack";
  if (combined.includes("napój") || combined.includes("koktajl") || combined.includes("smoothie") || combined.includes("lemoniad") || combined.includes("kawa") || combined.includes("herbata") || combined.includes("drink")) return "drink";

  // Default fallback based on sweetness vs savory
  if (combined.includes("cukier") || combined.includes("czekolad") || combined.includes("krem")) return "dessert";
  
  return "lunch"; // Default fallback
}

function classifyDiets(title: string, categories: string[], ingredients: string[]): string[] {
  const t = title.toLowerCase();
  const c = categories.map(cat => cat.toLowerCase()).join(" ");
  const ing = ingredients.join(" ").toLowerCase();
  const combined = t + " " + c + " " + ing;
  
  const diets = new Set<string>();
  
  // Bez glutenu - TYLKO jeśli jawnie napisane, żeby nie ryzykować przy domyślnych ciastach
  if (combined.includes("bez glutenu") || combined.includes("bezglutenow")) {
    diets.add("gluten-free");
  }
  
  // Wegańskie - j.w.
  if (combined.includes("wegańsk") || combined.includes("vegan")) {
    diets.add("vegan");
    diets.add("vegetarian");
    diets.add("dairy-free");
    diets.add("egg-free");
  }
  
  // Wegetariańskie
  if (combined.includes("wegetariańsk")) {
    diets.add("vegetarian");
  } else {
    // Jeżeli to obiad lub zupa i nie ma mięsa, to można zaryzykować wegetariańskie, 
    // ale bezpieczniej po prostu oprzeć się na braku mięsa w składnikach
    const hasMeat = /mięs|kurczak|wieprzowin|wołowin|boczek|szynka|kiełbas|ryb|łosoś|tuńczyk|dorsz|krewetk|żelatyn|rosół/i.test(combined);
    if (!hasMeat) diets.add("vegetarian");
  }
  
  // Bez cukru - tylko jawnie!
  if (combined.includes("bez cukru") || combined.includes("sugar-free") || combined.includes("sugar free")) {
    diets.add("sugar-free");
  }

  // Bez mleka / laktozy - jawnie
  if (combined.includes("bez mleka") || combined.includes("bez laktozy") || combined.includes("dairy-free")) {
    diets.add("dairy-free");
  }

  return Array.from(diets);
}

function run() {
  const rawData = fs.readFileSync("migration-data.json", "utf-8");
  const posts: ExtractedData[] = JSON.parse(rawData);
  
  console.log(`Analyzing ${posts.length} recipes for meal types and diets...`);
  
  const aiTags: TagData[] = [];
  
  for (const post of posts) {
    const mealType = classifyMealType(post.title, post.rawCategories);
    const diet = classifyDiets(post.title, post.rawCategories, post.ingredientsList);
    
    aiTags.push({
      id: post.id,
      mealType,
      diet
    });
  }
  
  const outFile = "ai-tags.json";
  fs.writeFileSync(outFile, JSON.stringify(aiTags, null, 2));
  console.log(`Analysis complete. Saved tags to ${outFile}.`);
  console.log(`Sample output for first 3 posts:`);
  console.log(JSON.stringify(aiTags.slice(0, 3), null, 2));
}

run();
