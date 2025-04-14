// TypeScript type definitions for Emaki scroll viewer JSON data

/**
 * Represents the metadata for an image in the Emaki scroll viewer.
 */
export type ImageMetadata = {
  /** Unique identifier for the image */
  id: string;
  /** Width of the image in pixels */
  width: number;
  /** Height of the image in pixels */
  height: number;
  /** URL of the image */
  url: string;
  /** Chapter number associated with the image */
  chapter: number;
};

/**
 * Represents the text data for a specific Emaki scroll.
 */
export type EmakiTextData = {
  /** Title of the scroll */
  title: string;
  /** English title of the scroll (optional) */
  title_en?: string;
  /** Main text content of the scroll */
  text: string;
  /** Chapter number of the scroll */
  chapter: number;
};