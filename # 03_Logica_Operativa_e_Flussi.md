# 03_Logica_Operativa_e_Flussi.md
**Target Audience:** Autonomous AI Developer Agent (Paul) / Cursor Execution Environment.
**Document Purpose:** Define the step-by-step operational workflows, state mutations, and the exact handling of the Admin/User dual role. Do NOT implement standard e-commerce features (no carts, no checkout, no refunds).

## 1. The Dual-Role Execution (Admin as User)
The system does not use separate user accounts for Admins and Members. The identity is singular, but the permissions and views branch based on the `club_members` pivot table.

*   **Rule of Coexistence:** If `users.id` matches `clubs.owner_id`, the frontend must grant access to the "Admin Dashboard" (Treasury view). However, this user MUST STILL possess a record in `user_wallets` for this specific Club.
*   **Admin Consumption:** When the Admin wishes to consume a product (e.g., smoke a cigarette), they do not bypass the system. They must act entirely as a User: select the product, and pay the "Vice Tax" markup from their personal `user_wallets` balance. 
*   **Result:** The Admin funds their own Club Treasury by participating in the identical friction/cost loop as regular members.

## 2. The "Strictly One-Way" Top-Up Flow (Wallet Recharge)
The User Wallet is a sink. Funds enter, but never exit as raw currency. There is no "withdraw" function.

### A. User-Initiated Request
1.  **Trigger:** User navigates to the "Wallet" section on the frontend and inputs an amount (e.g., 50.00).
2.  **Action:** The system creates a pending record in a new `topup_requests` table (Fields: `id`, `club_id`, `user_id`, `amount`, `status: pending`, `created_at`).
3.  **Real-World Action:** The User physically hands €50 cash to the Admin or sends a bank transfer.

### B. Admin Approval & Minting
1.  **Trigger:** Admin reviews the `topup_requests` list on their dashboard and clicks "Approve".
2.  **Action (DB Transaction):**
    *   Update `topup_requests.status` to `approved`.
    *   Increment `user_wallets.current_balance` by 50.00.
    *   Insert `+50.00` into `club_ledger` (Type: 'user_topup').
3.  **Alternative (Direct Injection):** The Admin can bypass the request system and manually inject funds directly into a user's wallet via the dashboard, triggering the exact same DB transaction.

## 3. The Purchase Workflow (Frictionless Consumption)
The purchase flow is immediate. It relies heavily on the parsed `price_config` JSON to determine the cost.

1.  **Trigger:** User scans the NFC, enters PIN, and selects a product from the catalog.
2.  **Input:** Based on `selling_mode` (e.g., 'weight'), the user selects the quantity (e.g., 10 grams).
3.  **Calculation (Backend enforced):** Laravel calculates the total cost. If `price_per_step` is 2.50 per 5 grams, 10 grams = €5.00.
4.  **Validation:** Laravel checks if `user_wallets.current_balance` >= 5.00.
    *   *If False:* Abort. Return HTTP 402. Display a "Top-Up Required" UI error.
5.  **Execution (DB Transaction):**
    *   Decrement `user_wallets.current_balance` by 5.00.
    *   Insert record into `wallet_transactions` (User X bought 10g of Product Y for €5.00).
6.  **Post-Condition:** The `club_ledger` is strictly untouched during this event. The funds were already secured during the Top-Up flow.

## 4. Club Management (Treasury Expenditures)
To track the real profitability of the Club, the Admin must log external real-world expenses (e.g., buying the physical stock from wholesalers).

1.  **Trigger:** Admin accesses the "Treasury Management" view.
2.  **Input:** Admin inputs a negative expense amount (e.g., 120.00) and a description (e.g., "Purchased 10 cartons of cigarettes").
3.  **Execution:** Insert `-120.00` into `club_ledger` (Type: 'admin_expense').
4.  **Analytics:** The Dashboard calculates `Cash Flow = SUM(club_ledger.amount)`. If positive, the Club has successfully generated a margin (The "Savings Fund") from the vice tax.