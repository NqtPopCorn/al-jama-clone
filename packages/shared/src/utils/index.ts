/**
 * Generates a clean slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Formats a date to ISO string safely.
 */
export function formatISODate(date: Date | string | number): string {
  return new Date(date).toISOString();
}
