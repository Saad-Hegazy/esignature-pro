# 🔒 Security Guide

Comprehensive security implementation and best practices for E-Signature Pro.

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Implemented Security Features](#implemented-security-features)
3. [File Upload Security](#file-upload-security)
4. [Authentication & Authorization](#authentication--authorization)
5. [Data Protection](#data-protection)
6. [API Security](#api-security)
7. [Production Security Checklist](#production-security-checklist)
8. [Security Recommendations](#security-recommendations)

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Network Layer (HTTPS, Firewall, Rate Limiting)          │
│ 2. Application Layer (Input Validation, CORS, CSP)         │
│ 3. Authentication Layer (JWT, Token Validation)            │
│ 4. Authorization Layer (Access Control, Token Expiry)      │
│ 5. Data Layer (Encryption, Sanitization, SQL Injection)    │
│ 6. File Layer (Type Validation, Size Limits, Isolation)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implemented Security Features

### ✅ File Upload Security

1. **File Type Validation**
   - Client-side: Accept only `.pdf` files
   - Server-side: Verify MIME type (`application/pdf`)
   - Double validation prevents bypassing

```typescript
// Server-side validation
if (uploadedFile.mimetype !== 'application/pdf') {
  fs.unlinkSync(uploadedFile.filepath);
  return res.status(400).json({ error: 'Only PDF files are allowed' });
}
```

2. **File Size Limits**
   - Maximum: 50MB per file
   - Configurable via environment variable
   - Prevents disk exhaustion attacks

3. **Filename Sanitization**
   - Remove dangerous characters
   - Prevent path traversal attacks
   - Generate unique filenames

```typescript
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};
```

4. **Isolated Storage**
   - Separate directories for different file types
   - Protected with `.htaccess` files
   - No script execution in upload directories

### ✅ Token-Based Access Control

1. **Unique Tokens**
   - UUID v4 for document access
   - Cryptographically random
   - One token per document

```typescript
import { v4 as uuidv4 } from 'uuid';
const token = uuidv4(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

2. **Token Expiration**
   - Default: 30 days
   - Configurable
   - Automatic status update on expiry

3. **Single-Use Signing**
   - Status check prevents re-signing
   - Immutable once signed
   - Audit trail maintained

### ✅ HTTP Security Headers

Implemented via `.htaccess`:

```apache
# Prevent clickjacking
Header always set X-Frame-Options "SAMEORIGIN"

# XSS Protection
Header always set X-XSS-Protection "1; mode=block"

# Prevent MIME sniffing
Header always set X-Content-Type-Options "nosniff"

# Referrer Policy
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Content Security Policy
Header always set Content-Security-Policy "default-src 'self'; ..."
```

### ✅ Database Security

1. **Prepared Statements**
   - Prisma ORM prevents SQL injection
   - Parameterized queries only
   - No raw SQL concatenation

2. **Input Validation**
   - Type checking (TypeScript)
   - Zod schema validation (optional)
   - Sanitized user inputs

3. **Connection Security**
   - Environment-based credentials
   - Connection pooling
   - SSL/TLS for remote databases

### ✅ Directory Protection

All upload directories have `.htaccess` files:

```apache
# Prevent PHP execution
<FilesMatch "\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|htm|shtml|sh|cgi|exe)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Disable directory listing
Options -Indexes
```

### ✅ IP Logging

```typescript
export const getClientIp = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : req.socket?.remoteAddress || 'unknown';
  return ip;
};
```

Logged on signature submission for audit trail.

---

## File Upload Security

### Secure Upload Flow

```
1. Client selects file
   ↓
2. Client-side validation (type, size)
   ↓
3. Upload to server
   ↓
4. Server-side validation (type, size, content)
   ↓
5. Generate unique filename
   ↓
6. Save to isolated directory
   ↓
7. Store metadata in database
   ↓
8. Return success (no file path exposed)
```

### Upload Directory Structure

```
public/uploads/
├── pdfs/              # Original PDFs
│   ├── .htaccess      # Security rules
│   └── [files]
├── signatures/        # Signature images
│   ├── .htaccess      # Security rules
│   └── [files]
└── signed/            # Signed PDFs
    ├── .htaccess      # Security rules
    └── [files]
```

### Prevent Common Attacks

**1. Path Traversal Prevention**
```typescript
// Bad: Vulnerable to path traversal
const filePath = path.join(uploadDir, req.body.filename);

// Good: Sanitized and validated
const safeFilename = sanitizeFilename(req.body.filename);
const filePath = path.join(uploadDir, path.basename(safeFilename));
```

**2. File Upload Bombs**
```typescript
// Set maximum file size
maxFileSize: 50 * 1024 * 1024, // 50MB

// Validate before processing
if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

**3. Malicious File Content**
```typescript
// Validate PDF structure
import { validatePDF } from '../lib/pdf-processor';

const isValid = await validatePDF(filePath);
if (!isValid) {
  fs.unlinkSync(filePath);
  throw new Error('Invalid PDF file');
}
```

---

## Authentication & Authorization

### Current Implementation

**Token-Based Access** (for guests):
- Unique token per document
- Expiration date enforcement
- Status-based access control

```typescript
// Validate token and document status
const document = await prisma.document.findUnique({ where: { token } });

if (!document) {
  return res.status(404).json({ error: 'Document not found' });
}

if (document.status === 'SIGNED') {
  return res.status(400).json({ error: 'Already signed' });
}

if (isExpired(document.expiresAt)) {
  await prisma.document.update({
    where: { token },
    data: { status: 'EXPIRED' },
  });
  return res.status(400).json({ error: 'Document expired' });
}
```

### Recommended: Admin Authentication

Implement JWT authentication for admin routes:

```typescript
// lib/middleware/auth.ts
import jwt from 'jsonwebtoken';

export const requireAuth = (handler) => {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
```

Usage:
```typescript
// pages/api/admin/upload.ts
import { requireAuth } from '../../lib/middleware/auth';

async function handler(req, res) {
  // Your upload logic
}

export default requireAuth(handler);
```

### Password Security

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

---

## Data Protection

### Encryption at Rest

**Database Encryption**:
- Use database-level encryption (PostgreSQL: pgcrypto)
- Encrypt sensitive fields (email, recipient info)

```sql
-- PostgreSQL encryption example
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt data
INSERT INTO documents (recipient_email) 
VALUES (pgp_sym_encrypt('email@example.com', 'encryption_key'));

-- Decrypt data
SELECT pgp_sym_decrypt(recipient_email::bytea, 'encryption_key') 
FROM documents;
```

**File Encryption** (optional):
- Encrypt signed PDFs at rest
- Decrypt on download
- Use AES-256 encryption

### Encryption in Transit

**HTTPS/TLS**:
- Force HTTPS in production
- Use valid SSL certificate
- Enable HSTS header

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

### Data Sanitization

```typescript
// Sanitize user inputs
import DOMPurify from 'isomorphic-dompurify';

const sanitizedTitle = DOMPurify.sanitize(req.body.title);
```

---

## API Security

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// lib/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many upload requests, please try again later',
});

export const signLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 signatures per hour
  message: 'Too many signature requests, please try again later',
});
```

### CORS Configuration

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### Input Validation

Use Zod for runtime type checking:

```typescript
import { z } from 'zod';

const uploadSchema = z.object({
  title: z.string().min(1).max(255),
  recipientEmail: z.string().email().optional(),
  signatureX: z.number().min(0),
  signatureY: z.number().min(0),
  signatureWidth: z.number().min(50).max(1000),
  signatureHeight: z.number().min(30).max(500),
});

// Validate request
try {
  const data = uploadSchema.parse(req.body);
} catch (error) {
  return res.status(400).json({ error: 'Invalid input' });
}
```

### Request Size Limits

```javascript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
};
```

---

## Production Security Checklist

### Pre-Deployment

- [ ] **Environment Variables**
  - [ ] Generate strong JWT_SECRET (32+ characters)
  - [ ] Set NODE_ENV=production
  - [ ] Remove default/test credentials
  - [ ] Use secure DATABASE_URL with strong password

- [ ] **HTTPS/SSL**
  - [ ] Obtain valid SSL certificate
  - [ ] Force HTTPS redirect
  - [ ] Enable HSTS header

- [ ] **Code Security**
  - [ ] Remove console.log statements
  - [ ] Remove debug endpoints
  - [ ] Disable source maps in production
  - [ ] Review and fix linting errors

- [ ] **Dependencies**
  - [ ] Update all packages to latest versions
  - [ ] Run npm audit and fix vulnerabilities
  - [ ] Remove unused dependencies

- [ ] **File Permissions**
  - [ ] Set correct directory permissions (755)
  - [ ] Verify .htaccess files are in place
  - [ ] Test that script execution is blocked

### Post-Deployment

- [ ] **Testing**
  - [ ] Test file upload with various file types
  - [ ] Try SQL injection on all inputs
  - [ ] Test XSS vulnerabilities
  - [ ] Verify CSRF protection
  - [ ] Test rate limiting

- [ ] **Monitoring**
  - [ ] Setup error tracking (Sentry)
  - [ ] Configure log monitoring
  - [ ] Setup uptime monitoring
  - [ ] Enable security alerts

- [ ] **Backups**
  - [ ] Automated database backups
  - [ ] File storage backups
  - [ ] Test restore procedures
  - [ ] Offsite backup storage

### Ongoing Security

- [ ] **Regular Updates**
  - [ ] Update dependencies monthly
  - [ ] Apply security patches immediately
  - [ ] Review security advisories

- [ ] **Security Audits**
  - [ ] Quarterly security reviews
  - [ ] Penetration testing (annually)
  - [ ] Code security scans

- [ ] **Access Control**
  - [ ] Review user permissions
  - [ ] Rotate secrets/keys (quarterly)
  - [ ] Audit access logs

---

## Security Recommendations

### High Priority

1. **Implement Admin Authentication**
   - Add login system for admin routes
   - Use JWT or session-based auth
   - Implement 2FA for added security

2. **Add Rate Limiting**
   - Prevent brute force attacks
   - Limit API requests per IP
   - Use Redis for distributed rate limiting

3. **File Validation**
   - Deep content inspection
   - Malware scanning integration
   - File integrity verification

4. **Database Encryption**
   - Encrypt sensitive fields
   - Use database-level encryption
   - Implement field-level encryption

5. **Security Monitoring**
   - Log all security events
   - Setup intrusion detection
   - Alert on suspicious activity

### Medium Priority

1. **API Versioning**
   - Version your API endpoints
   - Maintain backward compatibility
   - Deprecate old versions properly

2. **Webhook Signing**
   - Sign webhook payloads (future feature)
   - Verify webhook authenticity
   - Use HMAC signatures

3. **Content Security Policy**
   - Strict CSP headers
   - Prevent inline scripts
   - Whitelist trusted sources

4. **Secure Headers**
   - Implement all OWASP recommended headers
   - Use security.txt
   - Enable certificate transparency

### Low Priority (Nice to Have)

1. **Audit Logging**
   - Log all document operations
   - Track user actions
   - Maintain compliance records

2. **Watermarking**
   - Add watermarks to PDFs
   - Track document distribution
   - Prevent unauthorized copies

3. **Digital Signatures**
   - PKI-based signatures
   - Certificate validation
   - Legal compliance

---

## Security Testing

### Manual Testing

```bash
# Test SQL Injection
curl -X POST http://localhost:3000/api/documents/sign \
  -H "Content-Type: application/json" \
  -d '{"token": "abc123\" OR \"1\"=\"1", "signature": "data:image/png;base64,..."}'

# Test XSS
curl -X POST http://localhost:3000/api/admin/upload \
  -F "title=<script>alert('XSS')</script>" \
  -F "file=@test.pdf"

# Test Path Traversal
curl -X POST http://localhost:3000/api/admin/upload \
  -F "title=Test" \
  -F "file=@../../etc/passwd"

# Test File Upload Bomb
curl -X POST http://localhost:3000/api/admin/upload \
  -F "title=Test" \
  -F "file=@huge_file.pdf"
```

### Automated Testing

```bash
# Install OWASP ZAP
docker pull owasp/zap2docker-stable

# Run security scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000
```

### Vulnerability Scanning

```bash
# NPM audit
npm audit

# Fix vulnerabilities
npm audit fix

# Snyk scanning
npm install -g snyk
snyk test
```

---

## Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs and alerts
2. **Contain**: Isolate affected systems
3. **Investigate**: Analyze the breach
4. **Remediate**: Fix vulnerabilities
5. **Recover**: Restore services
6. **Review**: Post-mortem analysis

### Emergency Contacts

Document emergency procedures:
- System administrator contacts
- Security team contacts
- Legal team contacts
- User notification procedures

### Data Breach Protocol

1. Identify scope of breach
2. Notify affected users (within 72 hours)
3. Report to authorities if required
4. Document incident details
5. Implement preventive measures

---

## Compliance

### GDPR Compliance

- [ ] Data minimization
- [ ] User consent management
- [ ] Right to deletion
- [ ] Data portability
- [ ] Privacy policy
- [ ] Cookie consent

### Industry Standards

- **OWASP Top 10**: Follow OWASP security guidelines
- **PCI DSS**: If handling payments (future)
- **HIPAA**: If handling health data (future)
- **SOC 2**: For enterprise customers

---

## Security Resources

### Tools

- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Security testing platform
- **Snyk**: Dependency vulnerability scanner
- **Sentry**: Error and security monitoring
- **Cloudflare**: DDoS protection and WAF

### References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Security is an ongoing process, not a one-time task. Stay vigilant!** 🔒

For questions or to report security vulnerabilities, contact: security@yourdomain.com
