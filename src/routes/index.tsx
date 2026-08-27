import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock AI Backend — Decision API" },
      {
        name: "description",
        content:
          "Backend-only service for Lock: POST /api/public/decision returns a validated Lock decision JSON, /api/public/health reports AI diagnostics.",
      },
      { property: "og:title", content: "Lock AI Backend — Decision API" },
      {
        property: "og:description",
        content: "Server-side Lock decision API powered by Lovable AI. No frontend included.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApiIndex,
});

function ApiIndex() {
  return (
    <main className="mx-auto max-w-2xl p-6 font-mono text-sm text-foreground">
      <h1 className="text-base font-semibold">Lock AI Backend</h1>
      <p className="mt-2 text-muted-foreground">
        Backend service only. There is no UI here.
      </p>
      <ul className="mt-4 space-y-1">
        <li>POST /api/public/decision — Lock decision turn (JSON in, JSON out)</li>
        <li>GET /api/public/health — deployment and AI diagnostics</li>
      </ul>
    </main>
  );
}
