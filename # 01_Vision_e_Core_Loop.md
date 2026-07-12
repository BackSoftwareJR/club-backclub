# 01_Vision_e_Core_Loop.md
**Target Audience:** Autonomous AI Developer Agent (Paul) / Cursor Execution Environment.
**Document Purpose:** Define the overarching business logic, domain vocabulary, and inviolable architectural axioms of the application. This context MUST be prioritized during all subsequent code generation and database design tasks.

## 1. Domain Definition: The "Club" Paradigm
This application is **NOT** a standard e-commerce platform. Do not use generic e-commerce logic, cart systems, or standard checkout flows. 

The system is a strictly segregated, multi-tenant private financial ecosystem. The foundational unit of the architecture is the **Club** (a closed circle). The application serves to run a self-financing behavioral economy based on the "Vice Tax" concept.

*   **Primary Objective:** To create positive friction against bad habits (smoking, drinking, etc.) by applying a deliberate, significant markup on physical goods. The markup difference generates a "Savings Fund" (Treasury) for the Club, completely autofinancing the internal administration.
*   **Aesthetic & UX Posture:** The frontend (Next.js) must strictly adhere to an ultra-premium, "Luxury" aesthetic inspired by Apple's Human Interface Guidelines. Fluid micro-interactions, glassmorphism, and cinematic transitions are mandatory to elevate the user's perception of the platform.

## 2. Core Financial Loop: The "Treasury" Model
The application utilizes a decoupled financial ledger system to ensure absolute data integrity and simplify transaction tracking. 

*   **Fund Injection (One-Way Street):** When a user requests a wallet top-up (e.g., €50) and the Admin approves it, the €50 is immediately minted into the User's Digital Wallet AND simultaneously registered as a physical cash positive entry (`+€50`) in the Club's master Ledger. 
*   **Ownership Axiom:** The moment funds are topped up, they belong strictly to the Club. The User's Wallet represents a *credit to consume services*, not withdrawable cash.
*   **The Purchase Event:** When a User buys a good (e.g., cigarettes for €20), the system ONLY deducts €20 from the User's Wallet. No transaction is recorded on the Club's master Ledger at this moment, because the Club already secured the funds during the top-up phase.
*   **Admin Expenditures:** The Admin logs physical operational costs (e.g., buying the physical cigarettes at a real market cost of €6) as a negative entry (`-€6`) on the Club's master Ledger. 
*   **Cash Flow Result:** The Club's net liquidity is simply the sum of all User top-ups minus the Admin's operational costs. The database structure must reflect this exact separation.

## 3. The Dual-Actor Model (Roles & Permissions)
The system avoids rigid, global user types. Instead, it utilizes contextual permissions tied to the specific Club ID.

*   **Universal Identity:** A user registers a single identity globally.
*   **The Admin (Owner):** The creator of a Club. Crucially, the Admin *automatically possesses a dual role within their own Club*. They have an Admin dashboard to manage the Treasury and approve top-ups, but they also possess a standard User Wallet and must purchase goods exactly like any other member.
*   **The Member (User):** Invited via email. They can only view their own Wallet, request top-ups, make purchases, and interact with the AI assistant. They cannot see the global Club Treasury.

## 4. Hardware Key Inviolability (NFC + PIN)
The application strictly enforces a "Zero Friction but Maximum Security" entry policy.
*   **Rule 1: No Scans, No Access.** The only way a user can access their Club dashboard is by physically tapping an NFC card/tag programmed with a unique, static URL routing to the Next.js application.
*   **Rule 2: 1 Card = 1 Club.** A user belonging to multiple Clubs will possess multiple physical NFC cards. The session state is isolated per NFC unique link.
*   **Rule 3: The 6-Digit PIN.** To prevent unauthorized access if an NFC link is bookmarked or a card is stolen, every scan must be followed by a 6-digit PIN entry to instantiate the JWT session token.

## 5. The Intelligent Agent Layer (Kimi 2.6 via Canopywave)
The platform is not a static tool; it features an embedded behavioral AI trained on the user's transactional memory.
*   **The Sommelier/Coach:** The AI must intervene proactively before and after transactions. It analyzes the user's spending habits (RAG - Retrieval-Augmented Generation context) to either guide them toward a more qualitative consumption of their vice (Sommelier) or act as a psychological barrier, reminding them of the financial cost and alternative goals (Coach).
*   **Implementation Directive:** All API endpoints related to purchases must be designed to optionally trigger or receive payloads from the AI microservice before validating the state change in the database.

## 6. Execution Directives for Autonomous Sub-Agents
When instructed to build features for this architecture:
1.  **Assume Headless Execution:** Strip mock logic immediately. Build strict API endpoints in Laravel that serve the decoupled Next.js/Vite frontend.
2.  **No Implied Conversions:** Do not assume standard integer pricing. Products will use a flexible JSON schema to define arbitrary units of measurement (grams, liters, units, custom text).
3.  **Strict Data Registries:** Ensure database compliance. Use precise migrations for `club_transactions` and `user_wallets` to prevent invoice or ledger corruption.