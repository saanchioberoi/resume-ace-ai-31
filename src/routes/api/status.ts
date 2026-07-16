import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.LOVABLE_API_KEY ?? "";
        const configured = key.trim().length > 0;
        return Response.json({
          endpoint: "/api/analyze",
          configured,
          key_present: configured,
          key_length: configured ? key.length : 0,
          key_hint: configured ? `${key.slice(0, 3)}••••${key.slice(-2)}` : null,
          gateway: "https://ai.gateway.lovable.dev",
          model: "openai/gpt-5.5",
          checked_at: new Date().toISOString(),
        });
      },
    },
  },
});
