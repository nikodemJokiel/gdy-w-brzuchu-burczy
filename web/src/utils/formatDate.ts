/**
 * Date formatting utilities for the blog.
 * All dates are displayed in Polish format.
 */

/**
 * Format date as DD/MM/YY (e.g., "15/05/26")
 * Used in post cards on the grid.
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Format date as full Polish date (e.g., "15 maja 2026")
 * Used on individual recipe pages.
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format date as ISO 8601 for Schema.org (e.g., "2026-05-15")
 */
export function formatDateISO(dateString: string): string {
  return new Date(dateString).toISOString().split("T")[0];
}
