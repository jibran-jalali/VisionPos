# VisionPOS

VisionPOS is an AI-ready, web-based POS SaaS for retail teams. The MVP starts as a reliable POS with products, inventory, users, invoices, receipt/A4 printing, and a touch-first checkout interface. The architecture is prepared for a local Python computer-vision agent that will recognize products from a webcam.

## Stack

```text
Next.js App Router
TypeScript
Tailwind CSS
Auth.js
Prisma
Neon PostgreSQL
pnpm
```

## Local Development

```bash
pnpm install
pnpm prisma:generate
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Environment

Copy `.env.example` to `.env` and add your Neon connection string before running migrations or real auth flows.

```text
DATABASE_URL="postgresql://user:password@host.neon.tech/visionpos?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
```

## Current Screens

```text
/
/login
/register
/dashboard
/dashboard/products
/dashboard/inventory
/dashboard/users
/dashboard/sales
/dashboard/settings
/dashboard/analytics
/pos/checkout
/invoices/demo/receipt
/invoices/demo/a4
```

## Current Status

Implemented foundation:

```text
Branded landing page
Login/register UI
Odoo-style dashboard shell
Products page
Inventory page
Users page
Sales page
Settings page
Analytics placeholder
Touch-first POS checkout demo
Receipt invoice template
A4 invoice template
Prisma schema for SaaS POS domain
Auth.js credentials structure
Role and currency utilities
```

Next phase:

```text
Wire registration/login to database
Create real CRUD actions
Connect products/inventory/sales to Neon
Implement transactional checkout
Persist and print real invoices
```

## Local Vision Agent

The first Python REST agent is in `vision-agent/`.

```bash
cd vision-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Agent URL:

```text
http://127.0.0.1:8765
```

The POS checkout screen checks `/health` and shows whether the local agent is online.
