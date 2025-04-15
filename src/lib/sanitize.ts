import sanitizeHtml from 'sanitize-html';

export interface SanitizeOptions {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  allowedSchemes: string[];
  textFilter: (text: string) => string;
}

export const sanitizeOptions: SanitizeOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
    'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  textFilter: (text: string): string => {
    // Limit length to reasonable size
    return text.substring(0, 10000);
  }
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content The HTML content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitize(content: string): string {
  return sanitizeHtml(content, sanitizeOptions);
} 