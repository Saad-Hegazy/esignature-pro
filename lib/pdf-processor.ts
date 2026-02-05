import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export interface SignatureCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface PDFDimensions {
  width: number;
  height: number;
}

/**
 * Overlay signature image onto PDF at specified coordinates
 * This is the core function that merges the signature into the PDF
 */
export async function overlaySignatureOnPDF(
  pdfPath: string,
  signaturePath: string,
  coordinates: SignatureCoordinates,
  outputPath: string
): Promise<void> {
  try {
    // Read the existing PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Read the signature image
    const signatureBytes = fs.readFileSync(signaturePath);
    
    // Embed the signature image (supports PNG)
    let signatureImage;
    if (signaturePath.toLowerCase().endsWith('.png')) {
      signatureImage = await pdfDoc.embedPng(signatureBytes);
    } else {
      throw new Error('Only PNG signature images are supported');
    }

    // Get the page where signature should be placed
    const pages = pdfDoc.getPages();
    const pageIndex = coordinates.pageNumber - 1;
    
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error(`Invalid page number: ${coordinates.pageNumber}`);
    }

    const page = pages[pageIndex];
    const pageHeight = page.getHeight();

    // Convert coordinates from top-left origin to bottom-left origin (PDF coordinate system)
    // PDF uses bottom-left as origin, but we capture coordinates from top-left
    const pdfY = pageHeight - coordinates.y - coordinates.height;

    // Draw the signature image
    page.drawImage(signatureImage, {
      x: coordinates.x,
      y: pdfY,
      width: coordinates.width,
      height: coordinates.height,
    });

    // Add signature metadata (optional)
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const signedDate = new Date().toLocaleDateString();
    
    page.drawText(`Digitally Signed: ${signedDate}`, {
      x: coordinates.x,
      y: pdfY - 15,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);

  } catch (error) {
    console.error('Error overlaying signature on PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to overlay signature: ${errorMessage}`);
  }
}

/**
 * Get PDF page dimensions
 * Useful for coordinate calculations
 */
export async function getPDFDimensions(pdfPath: string, pageNumber: number = 1): Promise<PDFDimensions> {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    if (pageNumber < 1 || pageNumber > pages.length) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const page = pages[pageNumber - 1];
    
    return {
      width: page.getWidth(),
      height: page.getHeight(),
    };
  } catch (error) {
    console.error('Error getting PDF dimensions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get PDF dimensions: ${errorMessage}`);
  }
}

/**
 * Get total number of pages in PDF
 */
export async function getPDFPageCount(pdfPath: string): Promise<number> {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get PDF page count: ${errorMessage}`);
  }
}

/**
 * Validate PDF file
 */
export async function validatePDF(pdfPath: string): Promise<boolean> {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    await PDFDocument.load(pdfBytes);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Convert signature canvas data URL to PNG file
 */
export function saveSignatureImage(dataUrl: string, outputPath: string): void {
  try {
    // Remove data URL prefix
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    
    // Convert to buffer and save
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, buffer);
  } catch (error) {
    console.error('Error saving signature image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save signature image: ${errorMessage}`);
  }
}
