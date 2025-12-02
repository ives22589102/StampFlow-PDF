export interface StampConfig {
  text: string;
  x: number; // Percentage 0-100 relative to width
  y: number; // Percentage 0-100 relative to height
  fontSize: number;
  color: string;
}

export interface PDFMetadata {
  fileName: string;
  pageCount: number;
  width: number;
  height: number;
  textContent?: string;
}

export interface DragPosition {
  x: number;
  y: number;
}
