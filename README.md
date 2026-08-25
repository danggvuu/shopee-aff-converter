# Shopee Affiliate Link Converter

Production-ready web application for generating Shopee affiliate links with internal short URLs, rate limiting, and robust validation.

## Features
- Convert Shopee links to Affiliate links
- Generate short codes to bypass social media restrictions
- Mobile-first responsive UI
- Rate limiting powered by Upstash Redis
- Security headers and URL validation

## Architecture
- **Frontend/Backend**: Next.js 14 App Router
- **Database**: PostgreSQL (via Supabase or Neon) + Prisma
- **Rate Limit**: Upstash Redis
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Installation & Local Development
1. `npm install`
2. Copy `.env.example` to `.env.local` and configure your credentials.
3. Run migrations: `npx prisma db push`
4. Run locally: `npm run dev`

See `docs/` folder for detailed deployment, Shopee integration, and architecture guides.
