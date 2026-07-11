# Robert Plant VIP Membership Platform

A world-class, luxury digital VIP membership platform for Robert Plant fans.

> **This is not a normal website.** The public site is the entrance. The **Admin Portal** is the core of the business — every membership begins there.

## Architecture

Three separate portals built with Next.js App Router route groups:

- **(public)** — Marketing site: homepage, membership tiers, benefits, FAQ, contact, login.
- **admin** — Administrator control center: dashboard, members, cards, events, content, emails, analytics, settings.
- **(member)** — Private VIP lounge: dashboard, digital card, membership, events, content, profile, support, settings.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- TailwindCSS v4
- Framer Motion
- Recharts
- Jose (sessions)
- bcryptjs (password hashing)
- QRCode.react
- jsPDF / html-to-image / file-saver

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default Credentials

- **Admin**: `admin@robertplant.com` / `admin123`
- **Demo Member**: `jane@example.com` / `temp123`

## Key Workflows

1. **Visitor** browses the public site. Visitors cannot self-register.
2. **Administrator** logs into `/admin/login`, opens `/admin/members/new`, and creates a VIP member.
3. The system automatically creates a secure account, membership, digital VIP card, QR code, and welcome email.
4. The **member** logs in via `/login` and enters the private lounge centered on their digital VIP card.

## Project Structure

```
app/
  (public)/          # Public marketing pages
  admin/             # Admin portal (login + portal route group)
    (portal)/        # Protected admin pages
  (member)/          # Member portal
  api/               # API routes for auth and member creation
  verify/[id]/       # Public QR-code verification page
components/
  ui/                # Reusable UI primitives
  admin/             # AdminSidebar, AdminTopBar
  member/            # MemberSidebar
  VIPCard.tsx        # Digital membership card
lib/
  data.ts            # Types, mock data store, analytics
  auth.ts            # Session/JWT helpers
  utils.ts           # cn, formatDate, generators
```

## Notes

- This first version uses an in-memory mock data store. For production, swap it for a real database (e.g., PostgreSQL + Drizzle ORM or Prisma).
- Email sending is stubbed; integrate Resend, SendGrid, or Nodemailer for production.
- Member passwords are hashed with bcryptjs. Sessions use signed JWT cookies.
