# API Reference

Complete API documentation for E-Signature Pro.

## Base URL

```
Development: http://localhost:3000
Production: https://yourdomain.com
```

---

## Authentication

Currently, the system uses token-based authentication for document access. Admin endpoints should be protected with JWT authentication in production.

**Headers**:
```
Authorization: Bearer <jwt-token>
```

---

## Admin Endpoints

### 1. Upload Document

Upload a PDF and set signature field coordinates.

**Endpoint**: `POST /api/admin/upload`

**Content-Type**: `multipart/form-data`

**Request Body**:
```
file: File (PDF, max 50MB)
title: string (required)
recipientName: string (optional)
recipientEmail: string (optional)
signatureX: number (required)
signatureY: number (required)
signatureWidth: number (required)
signatureHeight: number (required)
pageNumber: number (required, default: 1)
pdfWidth: number (optional)
pdfHeight: number (optional)
```

**Success Response** (201):
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "title": "Contract Agreement",
    "token": "abc123-def456-ghi789"
  },
  "token": "abc123-def456-ghi789",
  "signingLink": "http://localhost:3000/sign/abc123-def456-ghi789"
}
```

**Error Response** (400):
```json
{
  "error": "Title and PDF file are required"
}
```

---

### 2. Get All Documents

Retrieve list of all uploaded documents.

**Endpoint**: `GET /api/admin/documents`

**Query Parameters**: None

**Success Response** (200):
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "title": "Contract Agreement",
      "fileName": "contract.pdf",
      "status": "PENDING",
      "token": "abc123-def456-ghi789",
      "recipientName": "John Doe",
      "recipientEmail": "john@example.com",
      "createdAt": "2026-02-05T10:00:00Z",
      "signedAt": null,
      "expiresAt": "2026-03-07T10:00:00Z"
    }
  ]
}
```

---

## Guest Endpoints

### 3. Get Document by Token

Retrieve document information using unique token.

**Endpoint**: `GET /api/documents/[token]`

**URL Parameters**:
- `token` (string, required): Unique document token

**Success Response** (200):
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "title": "Contract Agreement",
    "fileName": "contract.pdf",
    "recipientName": "John Doe",
    "status": "PENDING",
    "expiresAt": "2026-03-07T10:00:00Z"
  },
  "pdfUrl": "/uploads/pdfs/document-123.pdf"
}
```

**Error Responses**:

404 - Document Not Found:
```json
{
  "error": "Document not found"
}
```

400 - Document Already Signed:
```json
{
  "error": "Document has already been signed"
}
```

400 - Document Expired:
```json
{
  "error": "Document link has expired"
}
```

---

### 4. Submit Signature

Submit a signature for a document.

**Endpoint**: `POST /api/documents/sign`

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "token": "abc123-def456-ghi789",
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Field Descriptions**:
- `token` (string, required): Document token
- `signature` (string, required): Base64-encoded PNG image from signature canvas

**Success Response** (200):
```json
{
  "success": true,
  "message": "Document signed successfully",
  "document": {
    "id": "uuid",
    "title": "Contract Agreement",
    "status": "SIGNED",
    "signedAt": "2026-02-05T11:30:00Z"
  }
}
```

**Error Responses**:

400 - Missing Required Fields:
```json
{
  "error": "Token and signature are required"
}
```

404 - Document Not Found:
```json
{
  "error": "Document not found"
}
```

400 - Already Signed:
```json
{
  "error": "Document has already been signed"
}
```

500 - Processing Error:
```json
{
  "error": "Failed to process signature",
  "details": "Error message (development only)"
}
```

---

## Data Models

### Document

```typescript
interface Document {
  id: string;                    // UUID
  title: string;                 // Document title
  fileName: string;              // Original filename
  filePath: string;              // Path to PDF file
  fileSize: number;              // File size in bytes
  
  // Signature field coordinates
  signatureX: number | null;     // X position in pixels
  signatureY: number | null;     // Y position in pixels
  signatureWidth: number | null; // Width in pixels
  signatureHeight: number | null;// Height in pixels
  pageNumber: number;            // Page number (1-indexed)
  
  // PDF dimensions
  pdfWidth: number | null;       // PDF width in pixels
  pdfHeight: number | null;      // PDF height in pixels
  
  // Access control
  token: string;                 // Unique access token
  expiresAt: Date;              // Token expiration date
  
  // Recipient info
  recipientName: string | null;  // Recipient name
  recipientEmail: string | null; // Recipient email
  
  // Status tracking
  status: DocumentStatus;        // Current status
  signedAt: Date | null;        // When signed
  signaturePath: string | null; // Path to signed PDF
  signerIp: string | null;      // IP address of signer
  
  // Relations
  adminId: string;              // Admin who uploaded
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

enum DocumentStatus {
  PENDING = "PENDING",
  SIGNED = "SIGNED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed - Wrong HTTP method |
| 413 | Payload Too Large - File too big |
| 500 | Internal Server Error - Server error |

---

## Rate Limits

**Development**: No rate limits

**Production (Recommended)**:
- Upload: 10 requests per hour per IP
- Sign: 20 requests per hour per IP
- Get Documents: 100 requests per hour per IP

Implement rate limiting using packages like:
- `express-rate-limit`
- `rate-limiter-flexible`

---

## Webhooks (Future)

Future versions will support webhooks for events:

**Events**:
- `document.uploaded`
- `document.signed`
- `document.expired`

**Webhook Payload**:
```json
{
  "event": "document.signed",
  "timestamp": "2026-02-05T11:30:00Z",
  "data": {
    "documentId": "uuid",
    "token": "abc123",
    "status": "SIGNED"
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Upload Document
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('title', 'Contract');
formData.append('signatureX', '100');
formData.append('signatureY', '200');
formData.append('signatureWidth', '300');
formData.append('signatureHeight', '80');
formData.append('pageNumber', '1');

const response = await fetch('/api/admin/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Signing Link:', data.signingLink);
```

```typescript
// Submit Signature
const response = await fetch('/api/documents/sign', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'abc123-def456',
    signature: signatureCanvas.toDataURL('image/png'),
  }),
});

const data = await response.json();
console.log('Signed:', data.success);
```

### cURL

```bash
# Get Document
curl -X GET http://localhost:3000/api/documents/abc123-def456

# Submit Signature
curl -X POST http://localhost:3000/api/documents/sign \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123-def456",
    "signature": "data:image/png;base64,..."
  }'
```

---

## Testing

Use these test scenarios:

1. **Valid Upload**: Upload small PDF with coordinates
2. **Invalid File**: Try uploading non-PDF file
3. **Missing Coordinates**: Upload without signature field
4. **Valid Signature**: Sign document with valid token
5. **Expired Token**: Try signing with expired document
6. **Already Signed**: Try signing same document twice
7. **Invalid Token**: Try accessing with wrong token

---

## Best Practices

1. **Always validate file types** on client and server
2. **Set reasonable file size limits** (50MB recommended)
3. **Use HTTPS** in production
4. **Implement rate limiting** to prevent abuse
5. **Log all signing events** for audit trail
6. **Set appropriate token expiry** (30 days default)
7. **Validate coordinates** before saving
8. **Handle errors gracefully** with user-friendly messages

---

For more information, see the main [README.md](README.md).
