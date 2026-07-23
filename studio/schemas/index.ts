import blockContent from "./blockContent";
import recipe from "./recipe";
import tag from "./tag";
import siteSettings from "./siteSettings";
import aboutPage from "./aboutPage";
import collaborationPage from "./collaborationPage";

/**
 * Central schema registry — all document and object types
 * must be registered here for Sanity to recognize them.
 */
export const schemaTypes = [
  // Object types
  blockContent,

  // Document types
  recipe,
  tag,
  siteSettings,
  aboutPage,
  collaborationPage,
];
