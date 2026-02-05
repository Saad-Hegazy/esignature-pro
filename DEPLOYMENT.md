# Deployment Guide

Complete guide for deploying E-Signature Pro to production.

---

## Table of Contents

1. [Vercel Deployment](#vercel-deployment-recommended)
2. [Custom VPS Deployment](#custom-vps-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [File Storage](#file-storage)
7. [Security Checklist](#security-checklist)

---

## Vercel Deployment (Recommended)

Vercel provides the easiest deployment for Next.js applications.

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- PostgreSQL database (Vercel Postgres, Railway, Supabase, etc.)

### Step 1: Prepare Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/esignature-pro.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Set Environment Variables

In Vercel dashboard, add these environment variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-super-secret-random-string-here
BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
MAX_FILE_SIZE=52428800
TOKEN_EXPIRY_DAYS=30
NODE_ENV=production
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Visit your live URL!

### Step 5: Run Database Migrations

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

### Step 6: Setup File Storage

**Important**: Vercel's filesystem is read-only. Use cloud storage for uploads.

**Option A: Vercel Blob Storage**
```bash
npm install @vercel/blob
```

**Option B: AWS S3** (See File Storage section below)

**Option C: Cloudinary** (For images/PDFs)

---

## Custom VPS Deployment

Deploy to your own server (Ubuntu 20.04+, Debian, CentOS).

### Prerequisites
- VPS with Node.js 18+ installed
- PostgreSQL installed
- Nginx (optional, for reverse proxy)
- PM2 (process manager)

### Step 1: Setup Server

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Clone Repository

```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/yourusername/esignature-pro.git
cd esignature-pro

# Install dependencies
sudo npm install

# Set proper permissions
sudo chown -R $USER:$USER /var/www/esignature-pro
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

Update with production values:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/esignature
JWT_SECRET=generate-a-strong-random-string
BASE_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NODE_ENV=production
```

### Step 4: Setup Database

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE esignature;
CREATE USER esignature_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE esignature TO esignature_user;
\q

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

### Step 5: Build Application

```bash
# Build Next.js app
npm run build

# Test production build
npm start
```

### Step 6: Setup PM2

```bash
# Start application with PM2
pm2 start npm --name "esignature-pro" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Monitor application
pm2 monit
```

### Step 7: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/esignature-pro
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase upload size limit
    client_max_body_size 50M;
}
```

Enable site:
```bash
# Enable configuration
sudo ln -s /etc/nginx/sites-available/esignature-pro /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Docker Deployment

Deploy using Docker containers.

### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/esignature
      - JWT_SECRET=${JWT_SECRET}
      - BASE_URL=${BASE_URL}
      - NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
    depends_on:
      - db
    volumes:
      - ./public/uploads:/app/public/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=esignature
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Step 3: Deploy

```bash
# Build and start containers
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f
```

---

## Environment Configuration

### Production Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Security
JWT_SECRET=generate-with-openssl-rand-base64-32
NODE_ENV=production

# URLs
BASE_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=52428800

# Token Settings
TOKEN_EXPIRY_DAYS=30

# Optional: Email (for future features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Generate Secure JWT Secret

```bash
# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 3: Online
# Visit: https://www.grc.com/passwords.htm
```

---

## Database Setup

### PostgreSQL (Recommended)

**Local**:
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb esignature

# Create user
sudo -u postgres psql
CREATE USER esignature_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE esignature TO esignature_user;
```

**Cloud Options**:

1. **Railway** (Free tier available)
   - Go to https://railway.app
   - Create new project
   - Add PostgreSQL
   - Copy DATABASE_URL

2. **Supabase** (Free tier available)
   - Go to https://supabase.com
   - Create project
   - Get connection string from Settings > Database

3. **AWS RDS** (Paid)
   - Create RDS PostgreSQL instance
   - Configure security group
   - Get connection string

### MySQL Alternative

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Connection string:
```env
DATABASE_URL="mysql://user:password@host:3306/esignature"
```

---

## File Storage

### Local Storage (Development)

Use for development only. Not suitable for production.

```typescript
// Already configured in project
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
```

### AWS S3 (Recommended for Production)

Install SDK:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Configuration:
```typescript
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

### Cloudinary (Easy Alternative)

Install SDK:
```bash
npm install cloudinary
```

Configuration:
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

---

## Security Checklist

### Pre-Deployment

- [ ] Generate strong JWT_SECRET
- [ ] Use HTTPS only (SSL/TLS certificate)
- [ ] Set secure environment variables
- [ ] Remove console.logs from code
- [ ] Enable CORS properly
- [ ] Implement rate limiting
- [ ] Setup firewall rules
- [ ] Configure security headers
- [ ] Validate all user inputs
- [ ] Sanitize file uploads

### Post-Deployment

- [ ] Test all endpoints
- [ ] Verify SSL certificate
- [ ] Check file upload limits
- [ ] Test signature process
- [ ] Monitor error logs
- [ ] Setup backup system
- [ ] Configure monitoring (Sentry, LogRocket)
- [ ] Test disaster recovery
- [ ] Setup automated backups
- [ ] Document admin procedures

### Ongoing Maintenance

- [ ] Regular security updates
- [ ] Monitor disk space (for file uploads)
- [ ] Review access logs
- [ ] Update dependencies monthly
- [ ] Backup database daily
- [ ] Test restore procedures
- [ ] Monitor performance metrics
- [ ] Review and rotate secrets

---

## Monitoring & Logging

### Application Monitoring

**Sentry** (Error tracking):
```bash
npm install @sentry/nextjs
```

**LogRocket** (Session replay):
```bash
npm install logrocket
```

### Server Monitoring

**PM2 Monitoring**:
```bash
pm2 install pm2-server-monit
```

**Nginx Logs**:
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### Database Monitoring

```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log

# Active connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

---

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump -U esignature_user esignature > backup_$(date +%Y%m%d).sql

# Automated daily backups
crontab -e
# Add: 0 2 * * * pg_dump -U esignature_user esignature > /backups/backup_$(date +\%Y\%m\%d).sql
```

### File Backups

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Sync to remote storage
rsync -avz public/uploads/ remote-server:/backups/uploads/
```

---

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (Nginx, HAProxy)
- Multiple application instances
- Shared file storage (S3, NFS)
- Database connection pooling

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching (Redis)
- Use CDN for static assets

---

## Troubleshooting Production Issues

### Application Won't Start

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs esignature-pro

# Restart application
pm2 restart esignature-pro
```

### Database Connection Issues

```bash
# Test database connection
psql -U esignature_user -d esignature -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### File Upload Errors

```bash
# Check directory permissions
ls -la public/uploads/

# Fix permissions
chmod -R 755 public/uploads/
chown -R www-data:www-data public/uploads/
```

---

## Performance Optimization

1. **Enable Gzip compression** (Nginx)
2. **Use CDN** for static assets
3. **Implement caching** (Redis, CDN)
4. **Optimize images** (Sharp, ImageMagick)
5. **Database indexing** (add indexes to frequently queried fields)
6. **Connection pooling** (pgBouncer for PostgreSQL)
7. **Monitor and optimize slow queries**

---

## Support & Maintenance

### Regular Tasks

**Weekly**:
- Review error logs
- Check disk space
- Monitor performance metrics

**Monthly**:
- Update dependencies
- Review security advisories
- Test backup restoration
- Rotate logs

**Quarterly**:
- Security audit
- Performance review
- Update documentation

---

For more information, refer to:
- [README.md](README.md) - Main documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [API.md](API.md) - API reference

---

**Need help?** Open an issue on GitHub or contact support.
