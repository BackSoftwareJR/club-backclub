# 01_Vision_e_Core_Loop.md
**Priority:** Absolute architectural directive. This document supersedes earlier commercial or multi-user interpretations.

## 1. Nature of the project
Club CRM is not an e-commerce platform, a public club, a marketplace, a payment service, or an organization for selling goods.

It is a closed, private, gamified personal savings database developed and used exclusively by **Julian Rovera** to track his own savings. Terms such as “club”, “member”, “wallet”, “product”, “purchase”, and “treasury” are simulation vocabulary only. They never represent third-party money, real customers, real inventory, or real sales.

## 2. Personal savings loop
- A balance represents Julian Rovera’s simulated personal savings allocation.
- A top-up or fund injection records a personal savings movement.
- A purchase represents a gamified internal deduction and not a sale or transfer of a real good.
- Ledger entries are private accounting notes and not invoices, receipts, deposits, or payment transactions.
- All displayed emails, identities, images, products, and descriptions are fictional or test data.

## 3. Closed identity model
- There is no public sign-up, onboarding, invitation system, or external registration.
- Julian Rovera is the sole owner and intended operator.
- Fictional profiles may exist only as internal simulation keys.
- Real email addresses and real personal identities must not be collected.

## 4. Protocollo Ghost
- A valid NFC route followed by a six-digit PIN is the only entry path.
- Direct application URLs without an active session or validated NFC context redirect immediately to `https://www.google.com`.
- Invalid or manipulated NFC identifiers trigger a silent security log and immediate redirect.
- Three incorrect PIN attempts destroy local session context, block the source IP for 24 hours, create a forensic security event, and redirect immediately.
- Security controls remain mandatory even though obscurity and redirection are not substitutes for authentication.

## 5. Mandatory disclaimer
At first NFC access and before creating a new internal module, continued use requires acceptance of the current dated disclaimer:

> Questa piattaforma è un database chiuso ad uso esclusivo di Julian Rovera come salvadanaio personale. Non è un sistema di vendita, non gestisce denaro di terzi e le email/dati presenti sono fittizi o a solo scopo di test. Ogni accesso non autorizzato è vietato e tracciato.

Acceptance must be versioned and recorded with timestamp and technical audit metadata.

## 6. UX and implementation
- Preserve the Luxury/Apple-inspired visual language.
- Laravel is the source of truth for balances, acceptance records, access control, and forensic logs.
- The Vite/React frontend contains no public landing page.
- Never introduce carts, checkout, shipping, invoices, payment providers, public memberships, or real-money language.