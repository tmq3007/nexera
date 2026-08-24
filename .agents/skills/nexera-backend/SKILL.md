---
name: nexera-backend
description: >-
  Use this skill when developing or modifying the NestJS backend for the Nexera project.
  This covers payment gateways (PayOS), sensitive logic, and webhooks.
---

# Nexera Backend Development Skill

You are working on the Backend Microservice of the Nexera platform.

## Core Technologies
- **Framework:** NestJS (built on Node.js).
- **Language:** TypeScript.
- **Primary Function:** Acts as a secure intermediary for Payments and Webhooks.

## Architecture Rules
1. **Separation of Concerns:** The NestJS backend does NOT serve frontend pages. It strictly provides RESTful APIs (or GraphQL if configured) for the Next.js frontend.
2. **Database Access:** The backend will connect to Supabase (PostgreSQL) using Prisma ORM or the Supabase Service Role Key to bypass RLS when performing admin-level updates (e.g., updating an order status to "PAID" after a successful webhook).
3. **Payment Security:**
   - Always verify the signature of incoming webhooks from PayOS using HMAC SHA256 (or their provided library).
   - Never trust pricing data sent from the frontend. Always re-calculate the order total by querying the database before creating a payment session.

## Common Workflows
- **Generating a Module:** Use the NestJS CLI (`nest g module <name>`, `nest g controller <name>`, `nest g service <name>`).
- **Payment Flow:** 
  1. Receive checkout request from Frontend.
  2. Validate cart and calculate total.
  3. Generate PayOS Checkout URL (VietQR) and return to Frontend.
  4. Await Webhook confirmation, verify signature, and update the Order status in Supabase.
