# 06_Integrazione_AI.md
**Target Audience:** Autonomous AI Developer Agent (Paul) / Cursor Execution Environment.
**Document Purpose:** Define the architecture for integrating Kimi 2.6 (via Canopywave) as a behavioral agent. Outline the RAG (Retrieval-Augmented Generation) pipeline, system prompts, and the API interception logic for the "Sommelier/Coach" personas.

## 1. AI Architecture & Security (The Proxy Model)
The Next.js frontend MUST NEVER communicate directly with the Canopywave API. This prevents API key leakage and manipulation of the transaction history context.

*   **The Backend Proxy:** Laravel acts as the secure middleman. It receives the prompt from the frontend, compiles the user's secure financial context from the database, and securely dispatches the enriched payload to Canopywave.
*   **Context Assembling:** Before sending a request to the AI, Laravel must build a real-time JSON object containing the user's `current_balance`, the last 10 `wallet_transactions` (with timestamps and product names), and the specific Club's `theme_config` (to allow the AI to adapt its tone to the Club's vibe).

## 2. The Behavioral Personas (System Prompts)
Depending on the user's intent (general chat vs. pre-purchase intervention), Laravel will inject one of two strict System Prompts into the Canopywave request.

### A. The "Coach" (Friction & Financial Reality)
*   **Trigger:** When a user is about to make a high-frequency or high-cost vice purchase.
*   **Directive:** Act as a psychological barrier. Do not forbid the purchase, but highlight the financial and behavioral cost.
*   **Example Prompt Injection:** *"You are the Coach of this private club. The user wants to buy [Product] for [Cost]. They have already spent [Total Spent] this week on similar items. Their current wallet balance is [Balance]. Remind them of the money they are burning. Be concise, slightly provocative, but elegant."*

### B. The "Sommelier" (Qualitative Consumption)
*   **Trigger:** When a user asks for advice, or selects a premium/rare item.
*   **Directive:** Elevate the experience. Shift the user's focus from compulsive consumption to mindful, high-quality tasting/usage. 
*   **Example Prompt Injection:** *"You are the Sommelier of this luxury club. The user selected [Product]. Describe the best way to enjoy it. Suggest pairing it with a specific moment or mood. Your tone must be highly sophisticated, knowledgeable, and aligned with luxury standards."*

## 3. The "Pre-Purchase Interception" Workflow
The AI is not just a passive chat window; it actively participates in the transaction flow to create the "Positive Friction".

1.  **User Action:** The user selects a product and quantity, then clicks "Proceed to Purchase".
2.  **Frontend Action:** Instead of immediately executing the transaction, Next.js calls a Laravel endpoint: `POST /api/ai/intervene`.
3.  **Backend Action:** Laravel sends the transaction intent and the user's history to Canopywave using the "Coach" prompt.
4.  **AI Response:** Canopywave returns a short, impactful text (e.g., *"Are you sure? This €20 brings your weekly total to €100. That's a weekend trip you're smoking away."*).
5.  **UI Display:** Next.js displays this AI message in an elegant Glassmorphism modal, directly above the final "Confirm Purchase" button. 
6.  **User Decision:** The user must read the AI's friction message and deliberately click "Confirm" to proceed. 

## 4. API Payload Specifications for Canopywave
When developing the Laravel HTTP client for Canopywave, structure the payload strictly as follows to ensure context retention:

```json
{
  "model": "kimi-2.6",
  "temperature": 0.6, // Keep it relatively low to prevent hallucinating financial advice
  "messages": [
    {
      "role": "system",
      "content": "[INJECT PERSONA PROMPT HERE]"
    },
    {
      "role": "system",
      "content": "USER CONTEXT: Balance: 50.00. Last Purchases: 1x Pack (Yesterday), 1x Pack (2 days ago)."
    },
    {
      "role": "user",
      "content": "[USER INTENT OR CHAT MESSAGE]"
    }
  ]
}