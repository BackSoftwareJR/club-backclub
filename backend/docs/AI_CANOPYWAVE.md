# Integrazione AI — Canopywave + Kimi K2.6

Club CRM non comunica mai direttamente con Canopywave dal frontend. Laravel agisce come **proxy sicuro**: costruisce il contesto finanziario dell'utente dal database e inoltra la richiesta all'API di inferenza.

## Configurazione ambiente

Copia le variabili da `.env.example` nel tuo `.env` e imposta almeno la chiave API:

```env
CANOPYWAVE_ENABLED=true
CANOPYWAVE_BASE_URL=https://inference.canopywave.io/v1
CANOPYWAVE_API_KEY=la_tua_chiave_qui
CANOPYWAVE_MODEL=moonshotai/kimi-k2.6
CANOPYWAVE_TEMPERATURE=0.6
CANOPYWAVE_TIMEOUT=3
CANOPYWAVE_MAX_TOKENS=512
```

| Variabile | Descrizione |
|-----------|-------------|
| `CANOPYWAVE_ENABLED` | `false` disabilita tutte le chiamate HTTP (fallback silenzioso) |
| `CANOPYWAVE_BASE_URL` | Base URL dell'API OpenAI-compatible |
| `CANOPYWAVE_API_KEY` | Bearer token del piano **Monthly Subscription** (vedi sezione sotto) |
| `CANOPYWAVE_MODEL` | Modello da usare (default: `moonshotai/kimi-k2.6`) |
| `CANOPYWAVE_TEMPERATURE` | Creatività della risposta (0.6 consigliato) |
| `CANOPYWAVE_TIMEOUT` | Timeout HTTP in secondi (default: 3) |
| `CANOPYWAVE_MAX_TOKENS` | Lunghezza massima della risposta |

Ottieni la chiave API su [canopywave.com](https://canopywave.com): **Model API → Model API Key**, dopo aver sottoscritto un piano mensile (Unlimited Token Plan o Coding Plan). Non usare chiavi pay-as-you-go/serverless basate sul saldo prepagato — vedi [docs/CANOPYWAVE_SETUP.md](../../docs/CANOPYWAVE_SETUP.md).

## Tipo di chiave API

Canopywave espone **due tipi di chiavi API** nella dashboard. Club CRM usa esclusivamente quella del piano **Monthly Subscription**.

| Tipo | Uso | Compatibile con Club CRM |
|------|-----|--------------------------|
| **Monthly Subscription** | Quota inclusa nel piano mensile; endpoint `inference.canopywave.io` | ✅ Sì — usare questa |
| **On-demand / pay-per-use** | Fatturazione a consumo, chiave separata | ❌ No |

Nella dashboard possono comparire entrambe le chiavi. Imposta `CANOPYWAVE_API_KEY` con quella del piano **Monthly Subscription**: è l'unica che funziona con `https://inference.canopywave.io/v1` per le richieste incluse nella quota mensile.

Se usi per errore la chiave on-demand, le chiamate verso `inference.canopywave.io` falliranno o non consumeranno la quota del piano — il proxy risponderà con il fallback silenzioso descritto sotto.

## Modello e endpoint

- **Modello:** `moonshotai/kimi-k2.6` (Kimi K2.6)
- **Endpoint:** `POST {CANOPYWAVE_BASE_URL}/chat/completions`
- **Auth:** `Authorization: Bearer {CANOPYWAVE_API_KEY}`
- **Formato:** OpenAI-compatible (`messages`, `model`, `temperature`, `max_tokens`)

La risposta viene letta da `choices[0].message.content`.

## Personas

### Coach (intervento pre-acquisto)

**Endpoint:** `POST /api/clubs/{club_id}/ai/intervene`

Si attiva quando l'utente ha speso più di **€30** negli ultimi 7 giorni. Il Coach genera un messaggio di *positive friction* prima della conferma d'acquisto.

Risposta con intervento:
```json
{
  "intervention_required": true,
  "message": "Sei sicuro? Questi €20 portano il totale settimanale a €100...",
  "persona": "coach"
}
```

### Sommelier (chat consulenza)

**Endpoint:** `POST /api/clubs/{club_id}/ai/chat`

Fornisce consigli di consumo consapevole e di qualità, con tono luxury.

Risposta:
```json
{
  "message": "Per apprezzare al meglio questo prodotto...",
  "persona": "sommelier"
}
```

## Fallback silenzioso

Se l'AI non è disponibile, il flusso dell'app **non si blocca**:

| Scenario | Comportamento |
|----------|---------------|
| `CANOPYWAVE_ENABLED=false` | Nessuna chiamata HTTP |
| `CANOPYWAVE_API_KEY` vuota | Nessuna chiamata HTTP |
| Timeout o errore HTTP | Log `warning` con prefisso `[Canopywave]` |
| Risposta vuota o malformata | Trattata come fallimento |

- **Coach:** restituisce `{ "intervention_required": false }` — l'utente procede senza modale
- **Sommelier:** restituisce `{ "message": "", "persona": "sommelier" }`

## Come testare

### Test automatici

```bash
php artisan test
```

Il test `AiInterveneTest` verifica:
- messaggio Coach quando la spesa settimanale supera €30
- fallback silenzioso con chiave API vuota
- fallback silenzioso su errore HTTP

### Test manuale con curl

1. Avvia il backend e autenticati (JWT via `/api/auth/login`)
2. Assicurati che l'utente abbia transazioni > €30 negli ultimi 7 giorni
3. Chiama l'endpoint intervene:

```bash
curl -X POST "http://localhost:8000/api/clubs/1/ai/intervene" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 1}'
```

4. Per la chat Sommelier:

```bash
curl -X POST "http://localhost:8000/api/clubs/1/ai/chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Come posso apprezzare al meglio questo prodotto?", "product_id": 1}'
```

### Verifica log

In caso di errore, controlla `storage/logs/laravel.log` per righe con prefisso `[Canopywave]`.

## Architettura

```
Frontend (React/Vite SPA)
    ↓ POST /api/clubs/{id}/ai/*
Laravel AiController
    ↓ AiContextBuilder (saldo, transazioni, tema club)
    ↓ AiPromptBuilder (system prompts Coach/Sommelier)
    ↓ CanopywaveClient → POST /chat/completions
Canopywave Inference API (Kimi K2.6)
```

Il contesto utente (saldo, ultime 10 transazioni, `theme_config`) viene iniettato come messaggio di sistema `USER CONTEXT` in ogni richiesta, senza esporre dati sensibili al frontend.
