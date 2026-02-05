import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import prisma from '../../../lib/prisma';
import { generateDocumentToken, calculateExpiryDate, sanitizeFilename } from '../../../lib/utils';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb',
  },
};

interface ParsedFormData {
  fields: formidable.Fields;
  files: formidable.Files;
}

const parseForm = async (req: NextApiRequest): Promise<ParsedFormData> => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filename: (name, ext, part) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${uniqueSuffix}${ext}`;
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const { fields, files } = await parseForm(req);
    
    // Extract and validate fields
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const recipientName = Array.isArray(fields.recipientName) ? fields.recipientName[0] : fields.recipientName;
    const recipientEmail = Array.isArray(fields.recipientEmail) ? fields.recipientEmail[0] : fields.recipientEmail;
    const signatureX = Array.isArray(fields.signatureX) ? parseFloat(fields.signatureX[0]) : parseFloat(fields.signatureX as string);
    const signatureY = Array.isArray(fields.signatureY) ? parseFloat(fields.signatureY[0]) : parseFloat(fields.signatureY as string);
    const signatureWidth = Array.isArray(fields.signatureWidth) ? parseFloat(fields.signatureWidth[0]) : parseFloat(fields.signatureWidth as string);
    const signatureHeight = Array.isArray(fields.signatureHeight) ? parseFloat(fields.signatureHeight[0]) : parseFloat(fields.signatureHeight as string);
    const pageNumber = Array.isArray(fields.pageNumber) ? parseInt(fields.pageNumber[0]) : parseInt(fields.pageNumber as string);
    const pdfWidth = Array.isArray(fields.pdfWidth) ? parseFloat(fields.pdfWidth[0]) : parseFloat(fields.pdfWidth as string);
    const pdfHeight = Array.isArray(fields.pdfHeight) ? parseFloat(fields.pdfHeight[0]) : parseFloat(fields.pdfHeight as string);

    // Validate required fields
    if (!title || !files.file) {
      return res.status(400).json({ error: 'Title and PDF file are required' });
    }

    if (isNaN(signatureX) || isNaN(signatureY) || isNaN(signatureWidth) || isNaN(signatureHeight)) {
      return res.status(400).json({ error: 'Invalid signature coordinates' });
    }

    // Get uploaded file
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (uploadedFile.mimetype !== 'application/pdf') {
      // Delete uploaded file
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Generate unique token
    const token = generateDocumentToken();
    const expiresAt = calculateExpiryDate(parseInt(process.env.TOKEN_EXPIRY_DAYS || '30'));

    // Get file info
    const fileName = sanitizeFilename(uploadedFile.originalFilename || 'document.pdf');
    const filePath = `/uploads/pdfs/${path.basename(uploadedFile.filepath)}`;

    // Create document record in database
    // For demo purposes, we'll use a hardcoded adminId
    // In production, this should come from authenticated session
    const adminId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    
    const document = await prisma.document.create({
      data: {
        title,
        fileName,
        filePath,
        fileSize: uploadedFile.size,
        signatureX,
        signatureY,
        signatureWidth,
        signatureHeight,
        pageNumber,
        pdfWidth,
        pdfHeight,
        token,
        expiresAt,
        recipientName: recipientName || null,
        recipientEmail: recipientEmail || null,
        status: 'PENDING',
        adminId,
      },
    });

    // Generate signing link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const signingLink = `${baseUrl}/sign/${token}`;

    return res.status(201).json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        token: document.token,
        signingLink,
      },
      token: document.token,
      signingLink,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
}
