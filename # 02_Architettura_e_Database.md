# 02_Architettura_e_Database.md
**Target Audience:** Autonomous AI Developer Agent (Paul) / Cursor Execution Environment.
**Document Purpose:** Define the relational database schema, the JSON data structures for dynamic entities, and the strict API contract for the Laravel backend.

## 1. System Architecture Pattern
*   **Backend:** Headless API utilizing a modular Laravel framework. Must expose strict REST/GraphQL endpoints.
*   **Frontend:** Next.js (React 19) initialized via Vite for local HMR. Operates as a completely decoupled SPA consuming the Laravel APIs.
*   **State Management:** Frontend state is transient; the Laravel database is the single source of truth. All financial and state calculations MUST be performed server-side.

## 2. Core Relational Schema (Database Strictness)
The database must enforce strict foreign key constraints. Use the following structural guidelines for migrations. Do NOT hallucinate standard e-commerce tables (like `carts` or `orders`).

### A. Identity & Access Control
*   `users`: Global identity registry (`id`, `email`, `password_hash`).
*   `clubs`: The core multi-tenant entity (`id`, `owner_id` -> references users, `name`, `theme_config` (JSON)).
*   `club_members` (Pivot): The gatekeeper table.
    *   Fields: `club_id`, `user_id`, `nfc_uid` (Unique string, strictly tied to the physical card), `pin_hash` (6-digit hardware lock), `status` (active, paused).
    *   **Crucial Logic:** Session JWT generation relies exclusively on resolving `nfc_uid` + `pin_hash` against this specific table.

### B. Financial Engine (The Decoupled Treasury)
Separate the Club's real-world cash flow from the User's virtual credit. This is non-negotiable.

*   `club_ledger`: The master cash flow registry for the Administration.
    *   Fields: `id`, `club_id`, `transaction_type` (ENUM: 'user_topup', 'admin_expense', 'admin_injection'), `amount` (Decimal, 10,2), `description`, `created_at`.
    *   *Rule:* ONLY real-world money movements (cash collected, bills paid) touch this table.
*   `user_wallets`: The virtual credit balance.
    *   Fields: `id`, `club_id`, `user_id`, `current_balance` (Decimal, 10,2).
*   `wallet_transactions`: The log of consumed credits (internal purchases).
    *   Fields: `id`, `wallet_id`, `product_id`, `amount_deducted` (Decimal, 10,2), `metadata` (JSON for arbitrary quantities/notes), `created_at`.

### C. Dynamic Products (JSON Data Types)
To support arbitrary units (grams, liters, flat prices, custom text) without schema bloat, the products table must heavily utilize JSON columns.
*   `products`:
    *   Fields: `id`, `club_id`, `name`, `selling_mode` (ENUM: 'unit', 'weight', 'volume', 'custom_text'), `price_config` (JSON), `is_active`.

## 3. JSON Schema Definitions

### A. Product `price_config` Payload Examples
The frontend Next.js components will parse this JSON to dynamically render UI controls (sliders, steppers, text areas).

```json
// Example 1: Standard Unit (e.g., Cigarette Pack)
{
  "step_value": 1,
  "unit_label": "pack",
  "price_per_step": 20.00,
  "allow_fractions": false
}

// Example 2: Weight-based (e.g., custom loose goods)
{
  "step_value": 5,
  "unit_label": "grams",
  "price_per_step": 2.50,
  "allow_fractions": true
}

B. Club theme_config Payload (White-Labeling)
Fetched upon successful NFC login and injected directly into the Next.js root layout to dynamically override Tailwind/CSS variables for a custom "Luxury" aesthetic.

{
  "template_id": 3, // Instructs Next.js which macro-layout to render
  "colors": {
    "primary": "#D4AF37", 
    "secondary": "#1A1A1A",
    "background": "#000000",
    "glass_opacity": 0.6
  },
  "typography": {
    "heading_font": "Playfair Display",
    "body_font": "Inter"
  },
  "assets": {
    "logo_url": "https://...",
    "cover_url": "https://..."
  }
}

4. API Transaction Boundaries (Mandatory DB Transactions)
When implementing Laravel Controllers, DB::transaction blocks are mandatory to prevent race conditions during state mutations.

Top-Up Endpoint (Admin Approves €50):

Begin Transaction.

user_wallets -> increment current_balance by 50.

club_ledger -> insert row +50.00 ('user_topup').

Commit Transaction.

Purchase Endpoint (User buys €20 item):

Begin Transaction.

Check if user_wallets.current_balance >= 20. If false, abort/rollback and return HTTP 402 Payment Required.

user_wallets -> decrement current_balance by 20.

wallet_transactions -> insert usage log.

CRITICAL: DO NOT insert any record into club_ledger.

Commit Transaction.