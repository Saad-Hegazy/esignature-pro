import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { overlaySignatureOnPDF, saveSignatureImage } from '../../../lib/pdf-processor';
import { getClientIp } from '../../../lib/utils';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, signature } = req.body;

  if (!token || !signature) {
    return res.status(400).json({ error: 'Token and signature are required' });
  }

  try {
    // Find document
    const document = await prisma.document.findUnique({
      where: { token },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Validate document status
    if (document.status === 'SIGNED') {
      return res.status(400).json({ error: 'Document has already been signed' });
    }

    if (document.status === 'EXPIRED') {
      return res.status(400).json({ error: 'Document link has expired' });
    }

    if (document.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Document has been cancelled' });
    }

    // Check expiration
    if (new Date() > document.expiresAt) {
      await prisma.document.update({
        where: { token },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Document link has expired' });
    }

    // Ensure directories exist
    const signaturesDir = path.join(process.cwd(), 'public', 'uploads', 'signatures');
    const signedDir = path.join(process.cwd(), 'public', 'uploads', 'signed');
    
    if (!fs.existsSync(signaturesDir)) {
      fs.mkdirSync(signaturesDir, { recursive: true });
    }
    
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true });
    }

    // Save signature image
    const signatureFileName = `signature-${document.id}-${Date.now()}.png`;
    const signaturePath = path.join(signaturesDir, signatureFileName);
    saveSignatureImage(signature, signaturePath);

    // Get original PDF path
    const originalPdfPath = path.join(process.cwd(), 'public', document.filePath);
    
    if (!fs.existsSync(originalPdfPath)) {
      return res.status(404).json({ error: 'Original PDF file not found' });
    }

    // Generate signed PDF path
    const signedFileName = `signed-${document.id}-${Date.now()}.pdf`;
    const signedPdfPath = path.join(signedDir, signedFileName);

    // Overlay signature on PDF at specified coordinates
    await overlaySignatureOnPDF(
      originalPdfPath,
      signaturePath,
      {
        x: document.signatureX || 0,
        y: document.signatureY || 0,
        width: document.signatureWidth || 200,
        height: document.signatureHeight || 60,
        pageNumber: document.pageNumber,
      },
      signedPdfPath
    );

    // Get client IP
    const signerIp = getClientIp(req);

    // Update document in database
    const updatedDocument = await prisma.document.update({
      where: { token },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signaturePath: `/uploads/signed/${signedFileName}`,
        signerIp,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Document signed successfully',
      document: {
        id: updatedDocument.id,
        title: updatedDocument.title,
        status: updatedDocument.status,
        signedAt: updatedDocument.signedAt,
      },
    });

  } catch (error: any) {
    console.error('Sign document error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process signature',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
