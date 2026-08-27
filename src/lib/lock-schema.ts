import { z } from "zod";

/**
 * The Lock decision contract.
 *
 * This file is the single source of truth for the request/response shape of
 * POST /api/public/decision. If the Lock application defines its own schema,
 * replace the schemas below and nothing else has to change.
 */

export const LockVerdicts = ["lock", "unlock", "hold", "reject"] as const;
export const LockActions = ["continue", "ask_followup", "finalize", "abort"] as const;

export const LockHistoryMessageSchema = z.object({
  role: z.enum(["user", "lock"]),
  content: z.string().min(1).max(4000),
});

export const LockJourneySchema = z.object({
  id: z.string().max(200).optional(),
  state: z.string().max(200).optional(),
  decision: z.string().max(2000).optional(),
});

export const LockDecisionRequestSchema = z.object({
  journey: LockJourneySchema.optional(),
  history: z.array(LockHistoryMessageSchema).max(50).optional(),
  answer: z.string().min(1).max(8000),
});

export const LockDecisionResponseSchema = z.object({
  verdict: z.enum(LockVerdicts),
  reason: z.string().min(1).max(1000),
  action: z.enum(LockActions),
  confidence: z.number().min(0).max(1),
  next_state: z.string().max(200).nullable(),
  followup: z.string().max(1000).nullable(),
});

export type LockDecisionRequest = z.infer<typeof LockDecisionRequestSchema>;
export type LockDecisionResponse = z.infer<typeof LockDecisionResponseSchema>;

export const LOCK_ERROR_CODES = [
  "invalid_request",
  "ai_unavailable",
  "ai_not_configured",
  "invalid_ai_output",
  "rate_limited",
  "internal_error",
] as const;

export type LockErrorCode = (typeof LOCK_ERROR_CODES)[number];

export function lockError(code: LockErrorCode, message: string) {
  return { error: { code, message } };
}
