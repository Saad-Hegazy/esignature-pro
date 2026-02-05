import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { isExpired } from '../../../lib/utils';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { token },
      select: {
        id: true,
        title: true,
        fileName: true,
        filePath: true,
        recipientName: true,
        recipientEmail: true,
        status: true,
        expiresAt: true,
        signedAt: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if already signed
    if (document.status === 'SIGNED') {
      return res.status(400).json({ error: 'Document has already been signed' });
    }

    // Check if expired
    if (isExpired(document.expiresAt)) {
      // Update status to expired if not already
      await prisma.document.update({
        where: { token },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Document link has expired' });
    }

    // Check if cancelled
    if (document.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Document has been cancelled' });
    }

    // Verify file exists
    const filePath = path.join(process.cwd(), 'public', document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    // Return document data with PDF URL
    return res.status(200).json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        recipientName: document.recipientName,
        status: document.status,
        expiresAt: document.expiresAt,
      },
      pdfUrl: document.filePath,
    });

  } catch (error: any) {
    console.error('Fetch document error:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
}
