# Canopywave Setup — Kimi K2.6 (Monthly Subscription)

Club CRM routes all AI calls through the Laravel backend proxy. The frontend never sees the Canopywave API key.

## 1. Get a monthly subscription API key

1. Create an account at [canopywave.com](https://canopywave.com).
2. Subscribe to a **monthly plan** that includes Kimi K2.6, for example:
   - **Unlimited Token Plan** (50M / 200M / 500M high-speed tokens per month)
   - **Coding Plan** (fixed monthly request quota)
3. In the dashboard go to **Model API → Model API Key** and create a new key.
4. Copy the key into `backend/.env` as `CANOPYWAVE_API_KEY`.

> **Monthly subscription vs pay-as-you-go**
>
> Both key types use the same OpenAI-compatible endpoint (`https://inference.canopywave.io/v1/chat/completions`), but billing differs:
>
> | Key type | Billing | Use with Club CRM? |
> |----------|---------|-------------------|
> | **Monthly subscription** | Fixed monthly quota (tokens or requests) | **Yes — use this** |
> | **Pay-as-you-go / serverless** | Deducts from prepaid account balance per token | No — wrong billing model |
>
> A prepaid balance key will not consume your subscription quota. Use the key created under your active monthly plan.

Monitor usage under **Model API → Monthly subscription** in the Canopywave dashboard.

## 2. Environment variables

Add these to `backend/.env` (see `backend/.env.example` for defaults):

```dotenv
CANOPYWAVE_ENABLED=true
CANOPYWAVE_BASE_URL=https://inference.canopywave.io/v1
CANOPYWAVE_API_KEY=your_subscription_api_key_here
CANOPYWAVE_MODEL=moonshotai/kimi-k2.6
CANOPYWAVE_TEMPERATURE=0.6
CANOPYWAVE_TIMEOUT=3
CANOPYWAVE_MAX_TOKENS=512
```

| Variable | Purpose |
|----------|---------|
| `CANOPYWAVE_API_KEY` | Bearer token from Model API Key (subscription) |
| `CANOPYWAVE_BASE_URL` | OpenAI-compatible base URL (do not change unless Canopywave updates docs) |
| `CANOPYWAVE_MODEL` | `moonshotai/kimi-k2.6` — project spec shorthand is `kimi-2.6` |
| `CANOPYWAVE_TEMPERATURE` | `0.6` per AI spec — low enough to avoid hallucinating financial advice |
| `CANOPYWAVE_TIMEOUT` | `3` seconds — silent fallback on timeout |
| `CANOPYWAVE_ENABLED` | Set `false` to disable all Canopywave HTTP calls |

Never commit a real API key. Keep it in `.env` only.

## 3. How it works

```
POST {CANOPYWAVE_BASE_URL}/chat/completions
Authorization: Bearer {CANOPYWAVE_API_KEY}
Content-Type: application/json

{
  "model": "moonshotai/kimi-k2.6",
  "temperature": 0.6,
  "max_tokens": 512,
  "messages": [
    { "role": "system", "content": "<Coach or Sommelier persona>" },
    { "role": "system", "content": "USER CONTEXT: Balance: ... Last Purchases: ..." },
    { "role": "user", "content": "<user intent>" }
  ]
}
```

If the API key is missing, the request times out, or Canopywave returns an error:

- **Coach** (`POST /api/clubs/{id}/ai/intervene`) → `{ "intervention_required": false }`
- **Sommelier** (`POST /api/clubs/{id}/ai/chat`) → `{ "message": "", "persona": "sommelier" }`

## 4. Test the integration

### Automated tests (no real API key)

```bash
cd backend
php artisan test --filter=AiIntervene
```

### Direct Canopywave curl (verify key + subscription)

```bash
curl -X POST "https://inference.canopywave.io/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CANOPYWAVE_API_KEY" \
  -d '{
    "model": "moonshotai/kimi-k2.6",
    "temperature": 0.6,
    "max_tokens": 100,
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Reply with exactly: OK"}
    ]
  }'
```

### Laravel tinker (verify config loaded)

```bash
cd backend
php artisan tinker
```

```php
config('canopywave.model');   // "moonshotai/kimi-k2.6"
config('canopywave.timeout'); // 3
empty(config('canopywave.api_key')); // true until you set .env
```

### End-to-end via Club CRM API

1. Start the backend and log in to obtain a JWT.
2. Ensure the test user has > €30 spend in the last 7 days (Coach trigger).
3. Call:

```bash
curl -X POST "http://localhost:8000/api/clubs/1/ai/intervene" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 1}'
```

## 5. Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Always `intervention_required: false` | Missing/empty `CANOPYWAVE_API_KEY`, weekly spend ≤ €30, or Canopywave error |
| HTTP 401 from Canopywave | Invalid or revoked API key |
| HTTP 429 from Canopywave | Subscription quota exceeded (Basic Assurance Mode) |
| Slow responses | Normal for Kimi K2.6; Club CRM aborts after 3s and falls back silently |

Check `backend/storage/logs/laravel.log` for lines prefixed with `[Canopywave]`.

## See also

- `backend/docs/AI_CANOPYWAVE.md` — Italian-language integration reference
- `# 06_Integrazione_AI.md` — persona prompts and payload spec
