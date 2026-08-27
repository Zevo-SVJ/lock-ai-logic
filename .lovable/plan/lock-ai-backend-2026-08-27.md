# Lock AI Backend

A backend-only service: one decision endpoint plus a diagnostic endpoint. No frontend, no landing page, no auth, no database.

```text
Lock frontend  ->  POST /api/public/decision  ->  Lovable AI  ->  validated Lock JSON
```

## One thing to flag first

The Lock frontend/repo is **not** present in this project and none of your other accessible projects is named Lock, so there is no existing schema, state machine, or system prompt for me to read. I will implement a clean, documented contract (below) that mirrors standard Lock-style journey semantics. If you paste Lock's real types/prompt (or link the repo), I will change the contract to match exactly — the validation layer is a single schema file, so that swap is cheap.

## Endpoints

- `POST /api/public/decision` — the decision turn. JSON in, JSON out.
- `GET /api/public/health` — diagnostics: reports that the backend is deployed, that Lovable AI is configured, that a real generation just succeeded, and that its output parsed as valid Lock JSON. Never reveals key values, only booleans.

Both live under `/api/public/` so the existing Lock frontend can call them without a Lovable login, with CORS open to all origins (you left the origin blank — say the word and I'll lock it to a fixed origin list).

## Request contract

```json
{
  "journey": { "id": "string", "state": "string", "decision": "string" },
  "history": [{ "role": "user" | "lock", "content": "string" }],
  "answer": "the user's latest answer"
}
```
Only `answer` is required; `journey` and `history` are optional and passed to the model as context. Bounded sizes (answer length, history count) are enforced server-side.

## Response contract

```json
{
  "verdict": "lock" | "unlock" | "hold" | "reject",
  "reason": "short explanation of the verdict",
  "action": "continue" | "ask_followup" | "finalize" | "abort",
  "confidence": 0.0,
  "next_state": "string | null",
  "followup": "string | null"
}
```
`confidence` is a number between 0 and 1. `next_state` and `followup` are nullable so the state machine can advance or ask again.

Errors are always structured, never raw model output:

```json
{ "error": { "code": "invalid_request" | "ai_unavailable" | "invalid_ai_output" | "rate_limited", "message": "..." } }
```

## AI behavior

- Lovable AI, server-side only. No external provider keys.
- A Lock system prompt instructs the model to act as a decision engine, never to converse, and to emit only the JSON object above.
- Strict structured output (schema-enforced), so Markdown fences and prose are not possible paths.
- Server-side re-validation with Zod after generation; a schema miss returns `invalid_ai_output`, never passthrough.
- Exactly one generation per request. No retry loop. Gateway statuses mapped honestly: 429/5xx surface as retryable errors for the client to decide, 402/403 surface as configuration/credit errors.

## Technical notes

- TanStack server routes: `src/routes/api/public/decision.ts` and `src/routes/api/public/health.ts`, each with an `OPTIONS` handler and CORS headers on every response, including errors.
- Shared pieces: `src/lib/lock-schema.ts` (Zod request/response schemas — the single place to swap in Lock's real contract), `src/lib/lock-prompt.ts` (system instructions), `src/lib/ai-gateway.server.ts` (Lovable AI provider helper).
- `LOVABLE_API_KEY` is provisioned automatically and read only inside handlers; it never appears in responses or logs. Request/response bodies are not logged.
- The gateway call streams and is consumed server-side, so the request returns one buffered JSON object without risking a platform timeout on a long generation.
- `src/routes/index.tsx` becomes a bare, unstyled text page documenting the two endpoints (no design, no marketing) — the placeholder cannot stay, and shipping an actual UI is out of scope.

## Verification before I report back

Publish, then call the live `/api/public/health` and `/api/public/decision` with a real payload, and report: production URL, both endpoint URLs, whether the real Lovable AI generation succeeded, the exact JSON returned, what Lock must send, and any manual step left for you (expected: none).
