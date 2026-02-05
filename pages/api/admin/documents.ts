import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In production, verify admin authentication here
    
    const documents = await prisma.document.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        status: true,
        token: true,
        recipientName: true,
        recipientEmail: true,
        createdAt: true,
        signedAt: true,
        expiresAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      documents,
    });

  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
}
