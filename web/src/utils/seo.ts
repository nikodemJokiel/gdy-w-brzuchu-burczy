/**
 * SEO utilities — Schema.org JSON-LD generators.
 */

interface RecipeSchemaInput {
  title: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: Array<{ name: string; amount?: string; unit?: string }>;
  instructions?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    fiber?: number;
  };
  url: string;
}

/**
 * Generate JSON-LD for Recipe schema (Google Rich Snippets).
 */
export function generateRecipeJsonLd(recipe: RecipeSchemaInput): string {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: recipe.imageUrl,
    datePublished: recipe.datePublished,
    url: recipe.url,
    author: {
      "@type": "Person",
      name: "Iza z Gdy w brzuchu burczy",
    },
    publisher: {
      "@type": "Organization",
      name: "Gdy w brzuchu burczy",
      url: "https://gdywbrzuchuburczy.pl",
    },
  };

  if (recipe.prepTime) {
    schema.prepTime = `PT${recipe.prepTime}M`;
  }

  if (recipe.cookTime) {
    schema.cookTime = `PT${recipe.cookTime}M`;
    if (recipe.prepTime) {
      schema.totalTime = `PT${recipe.prepTime + recipe.cookTime}M`;
    }
  }

  if (recipe.servings) {
    schema.recipeYield = `${recipe.servings} porcji`;
  }

  if (recipe.ingredients?.length) {
    schema.recipeIngredient = recipe.ingredients.map((ing) =>
      [ing.amount, ing.unit, ing.name].filter(Boolean).join(" "),
    );
  }

  if (recipe.instructions?.length) {
    schema.recipeInstructions = recipe.instructions.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step,
    }));
  }

  if (recipe.nutrition) {
    schema.nutrition = {
      "@type": "NutritionInformation",
      ...(recipe.nutrition.calories && {
        calories: `${recipe.nutrition.calories} kcal`,
      }),
      ...(recipe.nutrition.protein && {
        proteinContent: `${recipe.nutrition.protein} g`,
      }),
      ...(recipe.nutrition.fat && {
        fatContent: `${recipe.nutrition.fat} g`,
      }),
      ...(recipe.nutrition.carbs && {
        carbohydrateContent: `${recipe.nutrition.carbs} g`,
      }),
      ...(recipe.nutrition.fiber && {
        fiberContent: `${recipe.nutrition.fiber} g`,
      }),
    };
  }

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate JSON-LD for Organization schema.
 */
export function generateOrganizationJsonLd(): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Gdy w brzuchu burczy",
      url: "https://gdywbrzuchuburczy.pl",
      description: "Blog kulinarny ze sprawdzonymi, pysznymi przepisami",
      sameAs: [
        // Social links will be populated from Sanity
      ],
    },
    null,
    2,
  );
}
