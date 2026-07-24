import fs from "fs";

function run() {
  const oldDataRaw = fs.readFileSync("recipes-full-export.json", "utf-8");
  const oldData = JSON.parse(oldDataRaw);
  
  const newDataRaw = fs.readFileSync("migration-data.json", "utf-8");
  const newData = JSON.parse(newDataRaw);
  
  const newMap = new Map();
  newData.forEach((d: any) => {
    newMap.set(d.id, d);
  });
  
  for (const item of oldData) {
    const fresh = newMap.get(item.id);
    if (fresh) {
      item.bodyHtml = fresh.bodyHtml;
      item.instructions = fresh.instructionsHtml;
      item.ingredients = fresh.ingredientsList;
    }
  }
  
  fs.writeFileSync("recipes-full-export.json", JSON.stringify(oldData, null, 2));
  console.log("Merged extracted data into recipes-full-export.json");
}

run();
