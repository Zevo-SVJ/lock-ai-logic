import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflightResponse } from "@/lib/cors";
import { runLockDecision } from "@/lib/lock-decision.server";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      OPTIONS: async () => preflightResponse(),

      GET: async () => {
        const aiConfigured = Boolean(process.env["LOVABLE_API_KEY"]);
        const startedAt = Date.now();

        if (!aiConfigured) {
          return jsonResponse(
            {
              status: "degraded",
              deployed: true,
              ai_configured: false,
              ai_generation_ok: false,
              lock_json_valid: false,
              error: { code: "ai_not_configured", message: "AI is not configured." },
            },
            503,
          );
        }

        const result = await runLockDecision({
          journey: { id: "diagnostic", state: "diagnostic_check", decision: "Health check turn." },
          history: [{ role: "lock", content: "Diagnostic: confirm the decision engine responds." }],
          answer: "Yes, proceed with the diagnostic check.",
        });

        if (!result.ok) {
          return jsonResponse(
            {
              status: "degraded",
              deployed: true,
              ai_configured: true,
              ai_generation_ok: result.code !== "ai_unavailable" && result.code !== "rate_limited",
              lock_json_valid: false,
              latency_ms: Date.now() - startedAt,
              error: { code: result.code, message: result.message },
            },
            result.status,
          );
        }

        return jsonResponse({
          status: "ok",
          deployed: true,
          ai_configured: true,
          ai_generation_ok: true,
          lock_json_valid: true,
          latency_ms: Date.now() - startedAt,
          sample: result.decision,
        });
      },
    },
  },
});
