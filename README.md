# Lock Decision Engine

Lock AI Backend

Create a minimal backend service for an existing product called Lock.

IMPORTANT:

Do NOT recreate Lock’s frontend.

Do NOT create a landing page.

Do NOT redesign anything.

Do NOT add unnecessary UI.

This project is ONLY the AI backend for the existing Lock application.

Goal

Create a production-ready API that allows the existing Lock frontend to send a decision turn to the backend and receive a structured JSON decision.

Use Lovable Cloud + Lovable AI for the AI functionality.

Do NOT require external OpenAI, Gemini, OpenRouter, Groq, or other API keys if Lovable AI can provide the functionality itself.

The AI must run server-side. Never expose credentials or provider configuration to the client.

API

Create:

POST /api/decision

It should accept JSON containing the context required for a Lock decision turn, including the conversation/context and the user’s latest answer.

Return JSON only.

If the existing Lock schema can be discovered from the repository or project context, use that exact schema. Otherwise create a clean, stable schema containing at least:

verdict

reason

action

confidence

AI behavior

Use Lovable AI.

The model must:

follow the Lock system instructions;

return structured JSON;

never wrap the response in Markdown;

never return conversational text instead of JSON;

produce consistent output suitable for an interactive decision flow.

Validate the AI response server-side before returning it.

If the model returns malformed JSON or an invalid structure, return a clean structured API error rather than passing malformed data to Lock.

Reliability

Implement:

sensible request timeout;

safe error handling;

no unnecessary retries;

no duplicate AI generations for one request;

no credentials in API responses;

no credentials in logs;

appropriate CORS for the existing Lock frontend.

Diagnostic

Create a simple diagnostic/health endpoint that can verify:

the backend is deployed;

Lovable AI is configured;

a real AI generation can be performed;

the result can be parsed as valid Lock JSON.

Never expose credentials.

Keep it minimal

Do NOT add:

authentication;

payments;

analytics;

unnecessary database features;

unrelated dependencies;

landing pages;

a replacement frontend.

The architecture should simply be:

Lock frontend → /api/decision → Lovable AI → validated Lock JSON

Final verification

Actually test the deployed AI endpoint with a real request.

Do not consider the task complete merely because the code builds.

After deployment, report:

Production backend URL.

Exact /api/decision URL.

Diagnostic URL.

Whether a real Lovable AI generation succeeded.

The exact JSON response structure.

Anything the existing Lock frontend needs to send.

Any environment/configuration step I personally still need to perform.

Do as much as possible automatically. Only ask me to perform a manual step if it is genuinely required by Lovable.

Do not modify or recreate the existing Lock frontend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lock-ai-logic.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bf3f54eb-3dd1-4021-a89e-d16620445c20).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
