import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// We must use the .mjs worker script because the main library is loaded as an ES module.
// Using jsDelivr ensures we get the correct file structure from the npm package.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const getPdfPageAsImage = async (file: File): Promise<{ imageUrl: string; width: number; height: number; textContent: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument(arrayBuffer);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1); // Preview first page

  const viewport = page.getViewport({ scale: 1.5 }); // Good quality preview
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (context) {
    await page.render({ canvasContext: context, viewport }).promise;
  }

  // Extract text for AI
  const textContentItem = await page.getTextContent();
  const textContent = textContentItem.items.map((item: any) => item.str).join(' ');

  return {
    imageUrl: canvas.toDataURL(),
    width: viewport.width,
    height: viewport.height,
    textContent
  };
};

export const createStampedPdf = async (file: File, text: string, xPercent: number, yPercent: number, fontSize: number, hexColor: string): Promise<Uint8Array> => {
  const fileBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Load font
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Convert Hex to RGB (0-1)
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  // Calculate coordinates
  // pdf-lib coords: (0,0) is bottom-left. 
  // UI coords: (0,0) is top-left.
  // xPercent is 0-100.
  
  const x = (xPercent / 100) * width;
  // Invert Y for PDF coordinate system
  // We need to account for font height roughly to align with visual top-left anchor logic of HTML
  const y = height - ((yPercent / 100) * height) - (fontSize * 0.8); 

  firstPage.drawText(text, {
    x,
    y,
    size: fontSize,
    font: font,
    color: rgb(r, g, b),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};