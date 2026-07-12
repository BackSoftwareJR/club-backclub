# 05_Sicurezza_e_Accessi.md
**Target Audience:** Autonomous AI Developer Agent (Paul) / Cursor Execution Environment.
**Document Purpose:** Define the zero-trust access perimeter, the strict NFC-to-PIN validation flow, session isolation parameters, and remote administration controls. 

## 0. Protocollo Ghost
- The application has no public landing page. A request without an authenticated session or valid NFC entry context renders no application content and immediately uses `window.location.replace('https://www.google.com')`.
- Invalid, expired, or manipulated NFC values return the machine-readable API code `ghost_redirect`; the frontend clears local state and redirects with no delay.
- On the third incorrect PIN, Laravel persists a 24-hour IP block, records a `Wrong PIN` security event, and returns `ghost_redirect`.
- Every Ghost redirect is recorded in `security_logs` with IP, user agent, exact timestamp, violation type, attempted route, and available NFC/club context.
- Security Radar is owner-only and displays a pulsing red alert when any event occurred within the previous 24 hours.
- Redirecting to an unrelated site is camouflage only. JWT scope, PIN hashing, throttling, server-side authorization, and NFC validation remain the actual security controls.

## 1. The "Zero-Trust" Entry Perimeter
The system completely abandons traditional email/password authentication for User access. The physical NFC card is the hardware key. 
*   **The Entry URL:** The NFC card stores a static URL (e.g., `https://app.domain.com/entry/{club_id}/{nfc_uid}`).
*   **Bookmark Prevention:** If a user bookmarks this URL in Safari to bypass the physical scan later, the system must NOT automatically log them in. There are no "Remember Me" persistent cookies. Every session initiation requires the 6-digit PIN.

## 2. The Two-Factor Flow (NFC + PIN)
The Laravel backend must handle the authentication strictly through the `club_members` pivot table, matching the physical ID with the memorized secret.

*   **State 1: First-Time Onboarding**
    1. User scans the NFC card. Frontend extracts `nfc_uid`.
    2. API checks `club_members`. If `nfc_uid` is recognized but `pin_hash` is NULL, the frontend routes to the "Setup PIN" view.
    3. User inputs a 6-digit PIN. Laravel hashes this PIN (using bcrypt/Argon2) and saves it to `club_members.pin_hash`.
*   **State 2: Standard Access**
    1. User scans the NFC card.
    2. Frontend immediately displays a minimalist, iOS-style 6-digit numpad.
    3. User inputs the PIN. Payload (`nfc_uid`, `pin`) is sent to the Auth endpoint.
    4. Laravel validates the hash. If successful, it issues a short-lived JSON Web Token (JWT).

## 3. Session Isolation (The "1 Card = 1 Club" Axiom)
A single human user (`user_id`) might belong to multiple Clubs, holding multiple physical NFC cards. The session state MUST be rigidly isolated.

*   **JWT Claims:** The issued JWT must encode both the `user_id` AND the specific `club_id`.
*   **Middleware Enforcement:** Every single API route must be protected by a strict Laravel Middleware. If a JWT was issued for Club A, the middleware must instantly reject (HTTP 403 Forbidden) any attempt to POST/GET data for Club B, even if the global `user_id` is the same. Cross-club data leakage is a critical failure.

## 4. Admin Remote Controls (The Kill Switch)
Because physical cards can be lost or stolen, the Admin must have absolute authority over access credentials via their Dashboard.

*   **Action: Reset PIN**
    *   *Implementation:* Admin clicks "Reset PIN". API sets `club_members.pin_hash` to NULL.
    *   *Result:* The next time the user scans that specific card, they will be forced through the "First-Time Onboarding" flow to choose a new PIN.
*   **Action: Suspend Access**
    *   *Implementation:* Admin toggles user state. API sets `club_members.status` to `suspended`.
    *   *Result:* The API authentication middleware intercepts the state without exposing application details to unauthorized clients.
*   **Action: Revoke/Reassign Card**
    *   *Implementation:* Admin unlinks the card. API nullifies the `nfc_uid` in `club_members` for that user. The physical card is now effectively dead or ready to be wiped/reassigned to someone else.

## 5. Frontend Security Posture
*   **Idle Timeout:** Implement a strict idle timeout on the Next.js frontend. If the user leaves the application inactive (no screen taps, no scrolling) for a predefined threshold (e.g., 3 minutes), the JWT must be destroyed locally, and the UI must return to a locked state requiring the 6-digit PIN to resume.
*   **Data Masking:** While the 6-digit PIN is being typed, standard security masking (dots) must be enforced visually on the UI.