import { NoObjectGeneratedError, Output, streamText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { LOCK_SYSTEM_PROMPT, buildLockTurnPrompt } from "./lock-prompt";
import {
  LockDecisionResponseSchema,
  type LockDecisionRequest,
  type LockDecisionResponse,
  type LockErrorCode,
} from "./lock-schema";

const LOCK_MODEL = "google/gemini-3.7-flash";

export type LockDecisionResult =
  | { ok: true; decision: LockDecisionResponse }
  | { ok: false; status: number; code: LockErrorCode; message: string };

/**
 * Runs exactly one Lovable AI generation for one Lock turn and validates the
 * result against the Lock response schema. No retries, no second generation.
 */
export async function runLockDecision(
  input: LockDecisionRequest,
  options?: { runId?: string | undefined; abortSignal?: AbortSignal | undefined },
): Promise<LockDecisionResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      code: "ai_not_configured",
      message: "AI is not configured for this backend.",
    };
  }

  const gateway = createLovableAiGatewayProvider(apiKey, options?.runId);

  try {
    // Streaming keeps bytes flowing so long generations are not severed by the
    // platform; the stream is consumed server-side and returned as one object.
    const result = streamText({
      model: gateway(LOCK_MODEL),
      system: LOCK_SYSTEM_PROMPT,
      prompt: buildLockTurnPrompt(input),
      output: Output.object({ schema: LockDecisionResponseSchema }),
      maxRetries: 0,
      ...(options?.abortSignal ? { abortSignal: options.abortSignal } : {}),
    });

    const raw = await result.output;
    const parsed = LockDecisionResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        status: 502,
        code: "invalid_ai_output",
        message: "The AI returned a response that does not match the Lock decision schema.",
      };
    }

    return { ok: true, decision: parsed.data };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return {
        ok: false,
        status: 502,
        code: "invalid_ai_output",
        message: "The AI returned malformed or non-conforming JSON for this Lock turn.",
      };
    }

    return mapGatewayError(error);
  }
}

function mapGatewayError(error: unknown): LockDecisionResult {
  const status = extractStatus(error);

  if (status === 429) {
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      message: "AI rate limit reached. Retry this turn shortly.",
    };
  }
  if (status === 402) {
    return {
      ok: false,
      status: 402,
      code: "ai_not_configured",
      message: "AI credits are exhausted for this workspace.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      ok: false,
      status: 503,
      code: "ai_not_configured",
      message: "AI access is not available for this backend.",
    };
  }

  // Never surface raw provider payloads or credentials to the client.
  console.error("[lock] AI generation failed", {
    status: status ?? null,
    name: error instanceof Error ? error.name : typeof error,
  });

  return {
    ok: false,
    status: 502,
    code: "ai_unavailable",
    message: "The AI service is temporarily unavailable.",
  };
}

function extractStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const candidate = error as { statusCode?: unknown; status?: unknown };
    if (typeof candidate.statusCode === "number") return candidate.statusCode;
    if (typeof candidate.status === "number") return candidate.status;
  }
  return undefined;
}
