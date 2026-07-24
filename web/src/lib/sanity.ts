import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

/**
 * Sanity client for fetching data via GROQ queries.
 * Uses the public API (no token needed for reads on public datasets).
 */
export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || "i4nv6nac",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-07-23",
  useCdn: true,
});

// --- Image URL builder ---
const builder = imageUrlBuilder(sanityClient);

/**
 * Generate optimized image URLs from Sanity image references.
 * @example urlFor(post.mainImage).width(800).format("webp").url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// --- Common GROQ queries ---

/** Fetch all recipes ordered by publish date (newest first) */
export const RECIPES_QUERY = `*[_type == "recipe"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage,
  gallery,
  "tags": tags[]->{ name, slug, category },
  isSponsored,
  prepTime,
  cookTime
}`;

/** Fetch a single recipe by slug with full content */
export const RECIPE_BY_SLUG_QUERY = `*[_type == "recipe" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  mainImage,
  excerpt,
  body,
  ingredients,
  instructions,
  nutritionInfo,
  "tags": tags[]->{ name, slug, category },
  mainIngredient,
  prepTime,
  cookTime,
  servings,
  isSponsored,
  legacyBloggerUrl,
  legacyComments,
  featuredForCarousel,
  carouselImageLight,
  carouselImageDark
}`;

/** Fetch all tags grouped by category */
export const TAGS_QUERY = `*[_type == "tag"] | order(category asc, name asc) {
  _id,
  name,
  slug,
  category
}`;

/** Fetch site settings (singleton) */
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]`;

/** Fetch featured carousel recipes */
export const CAROUSEL_QUERY = `*[_type == "recipe" && featuredForCarousel == true] | order(publishedAt desc) [0...5] {
  _id,
  title,
  slug,
  excerpt,
  carouselImageLight,
  carouselImageDark
}`;

/** Fetch about page (singleton) */
export const ABOUT_PAGE_QUERY = `*[_type == "aboutPage"][0]`;

/** Fetch collaboration page (singleton) */
export const COLLABORATION_PAGE_QUERY = `*[_type == "collaborationPage"][0] {
  ...,
  "portfolioRecipes": portfolioRecipes[]->{ _id, title, slug, mainImage, excerpt, isSponsored }
}`;
