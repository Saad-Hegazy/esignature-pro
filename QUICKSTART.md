# 🚀 Quick Start Guide

Get your E-Signature Pro system running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or use SQLite for testing)
- Git

---

## Step 1: Clone & Install (2 min)

```bash
# Clone the repository
git clone <your-repo-url>
cd esignature-pro

# Install dependencies
npm install
```

---

## Step 2: Configure Environment (1 min)

```bash
# Copy environment template
cp env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/esignature"
JWT_SECRET="change-this-to-a-random-string"
BASE_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## Step 3: Setup Database (1 min)

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

---

## Step 4: Create Upload Folders (30 sec)

```bash
mkdir -p public/uploads/pdfs
mkdir -p public/uploads/signatures
mkdir -p public/uploads/signed
```

Or on Windows:
```bash
mkdir public\uploads\pdfs
mkdir public\uploads\signatures
mkdir public\uploads\signed
```

---

## Step 5: Start Development Server (30 sec)

```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## Test the System

### Admin Flow (Upload Document)
1. Go to http://localhost:3000/admin/upload
2. Enter title: "Test Contract"
3. Upload a PDF file
4. Click and drag on the PDF to select signature field
5. Click "Upload Document"
6. Copy the signing link

### Guest Flow (Sign Document)
1. Paste the signing link in browser
2. View the PDF
3. Draw your signature
4. Check consent checkbox
5. Click "Submit Signature"
6. See success message!

### View Results
1. Go to http://localhost:3000/admin/documents
2. See your signed document
3. Download the signed PDF

---

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Update DATABASE_URL in .env with correct credentials
npx prisma migrate dev --name init
```

### Upload Directory Permission Error
```bash
# On Unix/Mac
chmod -R 755 public/uploads

# On Windows (run as admin)
icacls public\uploads /grant Users:F /T
```

### PDF Not Rendering
- Clear browser cache
- Try different PDF file
- Check browser console for errors

---

## Next Steps

- **Security**: Set strong JWT_SECRET in production
- **Database**: Use hosted PostgreSQL (Railway, Supabase)
- **Deployment**: Deploy to Vercel or your server
- **Customization**: Modify styles in `tailwind.config.js`

---

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create new migration
npx prisma generate        # Regenerate Prisma client

# Linting
npm run lint
```

---

## File Locations

- **Uploaded PDFs**: `public/uploads/pdfs/`
- **Signatures**: `public/uploads/signatures/`
- **Signed PDFs**: `public/uploads/signed/`
- **Database**: Check your DATABASE_URL

---

## Quick Tips

1. **Testing**: Use small PDF files (< 5MB) for faster testing
2. **Signature Size**: Draw signature fields at least 200x60 pixels
3. **Browser**: Works best on Chrome, Firefox, Safari, Edge
4. **Mobile**: Responsive design works on tablets and phones

---

## Getting Help

- Read full documentation: `README.md`
- Check troubleshooting section
- Review code comments
- Open GitHub issue

---

**You're all set! Start uploading and signing documents! 🎉**
