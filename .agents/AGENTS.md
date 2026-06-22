# Brews & Memories — Project Guidelines & Reference

This document serves as the project memory. Any AI companion starting a new conversation in this workspace must read this file to understand the architecture, endpoints, credentials, and history.

## Project Overview
* **Name:** Brews & Memories Café
* **Type:** React (Frontend, hosted on Vercel) + Express/Node.js/MongoDB (Backend, hosted on Render)
* **Frontend Production URL:** `https://brews-and-memories.vercel.app`
* **Backend Production URL:** `https://brews-backend.onrender.com`

---

## Technical Stack & Configuration
* **Frontend:** Vite + React + Vanilla CSS (No Tailwind).
* **Backend:** Express, MongoDB (Mongoose), JSON Web Tokens (JWT), express-rate-limit.
* **Database:** MongoDB Atlas cluster.
* **Rate Limiting:** Auth routes are limited to 5 attempts per 15 minutes. `trust proxy` is enabled (`app.set('trust proxy', 1)`) to track actual user IPs and prevent global lockouts behind Render/Cloudflare.

---

## Credentials (For Testing & Verification)
* **Admin Login:**
  * **Email:** `brewsandmemoriescafe@gmail.com`
  * **Password:** `Brews&MemoriesCafe!@2025`
  * **Role:** `admin` (Full access to sales stats, order deletion, table reservation management).
* **Kitchen Staff Login (KDS):**
  * **Email:** `kitchen@brews-memories.local`
  * **Password:** `Kitchen123!`
  * **Role:** `kitchen` (Only loads the live Kitchen Display System screen; has no access to billing/reservations).

---

## Key Features Implemented
1. **Kitchen Display System (KDS):**
   * Live Kanban dashboard split into *New Orders*, *In Prep*, and *Recently Ready*.
   * Auto-refreshes every 12 seconds via background polling.
   * Play synthesized double-chime audio alerts natively in the browser on new incoming orders using Web Audio API.
2. **Espresso Theme Toggle:**
   * Light/Dark toggle on the navbar.
3. **SEO Configurations:**
   * Added `robots.txt` and `sitemap.xml`.
   * Verified ownership in Google Search Console using HTML file verification (`google4d64079202a7759b.html`).
   * Dynamic meta tag and document title updates in React page transitions using the `useSEO` custom hook.
   * Proper semantic heading hierarchies (`<h1>` for primary page headers).
