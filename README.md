# 🚀 E-Signature Pro - Advanced PDF Signature System

A **production-ready**, enterprise-grade e-signature system built with Next.js, TypeScript, Tailwind CSS, and PDF-lib. Features visual coordinate selection for signature field placement and seamless PDF signature overlay.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)
![PDF-lib](https://img.shields.io/badge/PDF--lib-1.17-red)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Admin Features
- 📄 **PDF Upload** - Upload documents up to 50MB
- 🎯 **Visual Coordinate Selection** - Click and drag to select signature field position
- 📐 **Precise Positioning** - Pixel-perfect signature placement
- 🔗 **Unique Signing Links** - Generate secure, expiring links for recipients
- 📊 **Dashboard** - Track all documents and their signing status
- 📥 **Download Signed PDFs** - Access completed documents

### Guest Features
- ✍️ **Signature Pad** - Draw signatures using HTML5 canvas
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 👀 **PDF Preview** - View document before signing
- ✅ **One-Click Signing** - Simple, intuitive signing process
- 🔒 **Secure Links** - Token-based access with expiration

### Technical Features
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS
- ⚡ **Fast Performance** - Optimized PDF rendering
- 🔐 **Security First** - Multiple layers of protection
- 🗄️ **Database Backed** - PostgreSQL with Prisma ORM
- 📦 **Type Safe** - Full TypeScript coverage
- 🚀 **Production Ready** - Comprehensive error handling

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Signature Canvas** - Signature drawing
- **PDF.js** - PDF rendering and preview

### Backend
- **Next.js API Routes** - Serverless functions
- **Prisma** - Modern ORM for database access
- **PDF-lib** - PDF manipulation and signature overlay
- **Multer/Formidable** - File upload handling
- **JWT** - Token-based authentication

### Database
- **PostgreSQL** - Primary database (can use MySQL/SQLite)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Admin Flow                            │
│  1. Upload PDF                                               │
│  2. Visual Coordinate Selection (Click & Drag)              │
│  3. Generate Unique Token                                    │
│  4. Share Link with Recipient                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Guest Flow                            │
│  1. Open Unique Link                                         │
│  2. View PDF Document                                        │
│  3. Draw Signature on Canvas                                │
│  4. Submit Signature                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend Processing                        │
│  1. Validate Token & Document Status                        │
│  2. Save Signature as PNG Image                             │
│  3. Overlay Signature on PDF at Exact Coordinates           │
│  4. Generate Signed PDF                                      │
│  5. Update Database Status                                   │
│  6. Store Signed PDF                                         │
└─────────────────────────────────────────────────────────────┘
```

### Core Logic Explained

#### 1. Coordinate Capture (Admin Side)
```typescript
// When admin drags on PDF preview
const handleMouseDown = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;  // Relative X position
  const y = e.clientY - rect.top;   // Relative Y position
  setStartPoint({ x, y });
};

const handleMouseMove = (e) => {
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  // Calculate width and height from start point
  const width = Math.abs(currentX - startPoint.x);
  const height = Math.abs(currentY - startPoint.y);
  
  setSignatureField({ x, y, width, height });
};

// Coordinates saved: { x: 100, y: 200, width: 300, height: 80 }
```

#### 2. PDF Signature Overlay (Backend)
```typescript
export async function overlaySignatureOnPDF(
  pdfPath: string,
  signaturePath: string,
  coordinates: SignatureCoordinates,
  outputPath: string
) {
  // Load PDF and signature image
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const signatureImage = await pdfDoc.embedPng(signatureBytes);
  
  // Get page where signature should be placed
  const page = pages[coordinates.pageNumber - 1];
  const pageHeight = page.getHeight();
  
  // Convert from top-left origin to bottom-left (PDF coordinate system)
  const pdfY = pageHeight - coordinates.y - coordinates.height;
  
  // Draw signature at exact coordinates
  page.drawImage(signatureImage, {
    x: coordinates.x,
    y: pdfY,
    width: coordinates.width,
    height: coordinates.height,
  });
  
  // Save modified PDF
  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, modifiedPdfBytes);
}
```

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 12+ (or MySQL/SQLite)
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd esignature-pro
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Setup Environment Variables
```bash
cp env.example .env
```

Edit `.env` and configure:
```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/esignature?schema=public"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Base URL
BASE_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# File Upload Settings
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_DIR="./public/uploads"

# Token Expiry
TOKEN_EXPIRY_DAYS=30
```

### Step 4: Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### Step 5: Create Upload Directories
```bash
mkdir -p public/uploads/pdfs
mkdir -p public/uploads/signatures
mkdir -p public/uploads/signed
```

### Step 6: Run Development Server
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` 🎉

---

## ⚙️ Configuration

### Database Options

**PostgreSQL (Recommended)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/esignature"
```

**MySQL**
```env
DATABASE_URL="mysql://user:password@localhost:3306/esignature"
```

**SQLite (Development)**
```env
DATABASE_URL="file:./dev.db"
```

### File Upload Limits

Edit `next.config.js`:
```javascript
api: {
  bodyParser: {
    sizeLimit: '50mb',  // Adjust as needed
  },
},
```

### Token Expiration

Modify in `.env`:
```env
TOKEN_EXPIRY_DAYS=30  # Documents expire after 30 days
```

---

## 📖 Usage

### For Administrators

#### 1. Upload Document
1. Navigate to `/admin/upload`
2. Fill in document details
3. Upload PDF file (max 50MB)
4. Click and drag on PDF preview to select signature field
5. Click "Upload Document"
6. Copy the generated signing link

#### 2. View Documents
1. Navigate to `/admin/documents`
2. View all uploaded documents
3. Check status (Pending, Signed, Expired)
4. Copy signing links
5. Download signed PDFs

### For Recipients (Guests)

#### 1. Access Document
1. Open unique link received from admin
2. Document loads automatically

#### 2. Sign Document
1. Review the PDF
2. Draw signature in the signature pad
3. Check consent checkbox
4. Click "Submit Signature"
5. Wait for confirmation

---

## 🔌 API Documentation

### Admin Endpoints

#### Upload Document
```http
POST /api/admin/upload
Content-Type: multipart/form-data

Fields:
- file: PDF file
- title: Document title
- recipientName: Recipient name (optional)
- recipientEmail: Recipient email (optional)
- signatureX: X coordinate
- signatureY: Y coordinate
- signatureWidth: Width in pixels
- signatureHeight: Height in pixels
- pageNumber: Page number for signature
- pdfWidth: PDF width
- pdfHeight: PDF height

Response:
{
  "success": true,
  "document": { ... },
  "token": "unique-token",
  "signingLink": "http://localhost:3000/sign/unique-token"
}
```

#### Get All Documents
```http
GET /api/admin/documents

Response:
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "title": "Contract",
      "status": "PENDING",
      "token": "unique-token",
      ...
    }
  ]
}
```

### Guest Endpoints

#### Get Document by Token
```http
GET /api/documents/[token]

Response:
{
  "success": true,
  "document": { ... },
  "pdfUrl": "/uploads/pdfs/filename.pdf"
}
```

#### Submit Signature
```http
POST /api/documents/sign
Content-Type: application/json

Body:
{
  "token": "unique-token",
  "signature": "data:image/png;base64,..."
}

Response:
{
  "success": true,
  "message": "Document signed successfully",
  "document": { ... }
}
```

---

## 🔐 Security

### Implemented Security Measures

1. **File Upload Security**
   - File type validation (PDF only)
   - File size limits (50MB)
   - Sanitized filenames
   - Isolated upload directories
   - `.htaccess` protection

2. **Token-Based Access**
   - Unique UUID tokens per document
   - Expiration dates
   - One-time signing (status check)
   - IP address logging

3. **Database Security**
   - Prepared statements (Prisma)
   - Input validation
   - SQL injection prevention

4. **HTTP Security Headers**
   - X-Frame-Options (clickjacking protection)
   - X-XSS-Protection
   - X-Content-Type-Options
   - Content-Security-Policy
   - Referrer-Policy

5. **Directory Protection**
   - Disabled directory listing
   - PHP execution prevention
   - Access control via `.htaccess`

### Recommendations for Production

1. **HTTPS Only**
   - Force SSL/TLS
   - HSTS headers

2. **Rate Limiting**
   - Implement rate limiting on API routes
   - Prevent brute force attacks

3. **Authentication**
   - Add admin authentication
   - JWT or session-based auth
   - Role-based access control

4. **File Storage**
   - Consider cloud storage (AWS S3, Google Cloud Storage)
   - Encrypted file storage
   - CDN for static assets

5. **Monitoring**
   - Log all signature events
   - Monitor suspicious activity
   - Set up alerts

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your repository
   - Configure environment variables
   - Deploy

3. **Setup Database**
   - Use Vercel Postgres, or
   - External PostgreSQL (Railway, Supabase, etc.)

4. **Run Migrations**
```bash
npx prisma migrate deploy
```

### Deploy to Custom Server

1. **Build Application**
```bash
npm run build
```

2. **Start Production Server**
```bash
npm start
```

3. **Setup Process Manager (PM2)**
```bash
npm install -g pm2
pm2 start npm --name "esignature-pro" -- start
pm2 save
pm2 startup
```

4. **Configure Nginx (Optional)**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐛 Troubleshooting

### PDF Not Rendering
**Issue**: PDF preview shows blank page

**Solutions**:
- Check PDF.js worker URL in code
- Verify PDF file is not corrupted
- Check browser console for errors
- Try different PDF file

### Signature Not Overlaying Correctly
**Issue**: Signature appears in wrong position

**Solutions**:
- Verify coordinate calculation
- Check PDF coordinate system (origin is bottom-left)
- Ensure pdfWidth and pdfHeight are saved correctly
- Test with different page numbers

### File Upload Fails
**Issue**: "Failed to upload document"

**Solutions**:
- Check upload directory permissions (755 or 777)
- Verify file size under 50MB
- Ensure upload directories exist
- Check server disk space

### Database Connection Error
**Issue**: "Connection failed"

**Solutions**:
- Verify DATABASE_URL in `.env`
- Check database is running
- Run `npx prisma generate`
- Run migrations: `npx prisma migrate dev`

### Token Expired/Not Found
**Issue**: "Document link has expired"

**Solutions**:
- Check TOKEN_EXPIRY_DAYS setting
- Verify token in URL is correct
- Check document status in database
- Generate new signing link

---

## 📂 Project Structure

```
esignature-pro/
├── pages/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── upload.ts       # PDF upload endpoint
│   │   │   └── documents.ts    # Get all documents
│   │   └── documents/
│   │       ├── [token].ts      # Get document by token
│   │       └── sign.ts         # Submit signature
│   ├── admin/
│   │   ├── upload.tsx          # Admin upload page
│   │   └── documents.tsx       # Admin dashboard
│   ├── sign/
│   │   └── [token].tsx         # Guest signing page
│   ├── _app.tsx
│   └── index.tsx               # Homepage
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── auth.ts                 # Authentication utilities
│   ├── utils.ts                # Helper functions
│   └── pdf-processor.ts        # PDF manipulation logic
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   ├── uploads/
│   │   ├── pdfs/               # Original PDFs
│   │   ├── signatures/         # Signature images
│   │   └── signed/             # Signed PDFs
│   └── .htaccess               # Security config
├── styles/
│   └── globals.css             # Global styles
├── .env.example                # Environment template
├── next.config.js              # Next.js config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Key Implementation Details

### Coordinate System Conversion
PDFs use a **bottom-left origin** coordinate system, while HTML canvas uses **top-left origin**. The system automatically converts coordinates during signature overlay.

### Signature Field Positioning
The visual coordinate selector captures `(x, y, width, height)` which are stored in the database and used to precisely place the signature during PDF generation.

### File Management
- Original PDFs: `public/uploads/pdfs/`
- Signatures: `public/uploads/signatures/`
- Signed PDFs: `public/uploads/signed/`

### Security Best Practices
- All upload directories have `.htaccess` files preventing script execution
- File type validation on both client and server
- Token-based access with expiration
- SQL injection prevention via Prisma ORM

---

## 🎯 Roadmap

- [ ] Multi-signature support (multiple signers per document)
- [ ] Email notifications
- [ ] Document templates
- [ ] Admin dashboard analytics
- [ ] Signature certificate/audit trail
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Webhook support

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Built with ❤️ using Next.js, TypeScript, and PDF-lib**
