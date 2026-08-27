import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflightResponse } from "@/lib/cors";
import { getLovableAiGatewayRunId } from "@/lib/ai-gateway.server";
import { runLockDecision } from "@/lib/lock-decision.server";
import { LockDecisionRequestSchema, lockError } from "@/lib/lock-schema";

const REQUEST_TIMEOUT_MS = 60_000;

export const Route = createFileRoute("/api/public/decision")({
  server: {
    handlers: {
      OPTIONS: async () => preflightResponse(),

      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse(lockError("invalid_request", "Body must be valid JSON."), 400);
        }

        const parsed = LockDecisionRequestSchema.safeParse(body);
        if (!parsed.success) {
          return jsonResponse(
            lockError(
              "invalid_request",
              parsed.error.issues
                .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
                .join("; "),
            ),
            400,
          );
        }

        // Sensible upper bound on one turn; a single generation, never retried.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const result = await runLockDecision(parsed.data, {
            runId: getLovableAiGatewayRunId(request),
            abortSignal: controller.signal,
          });

          if (!result.ok) {
            return jsonResponse(lockError(result.code, result.message), result.status);
          }

          return jsonResponse(result.decision, 200);
        } catch {
          return jsonResponse(
            lockError("ai_unavailable", "The Lock decision turn could not be completed in time."),
            504,
          );
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});
