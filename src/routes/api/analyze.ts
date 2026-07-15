import { createFileRoute } from "@tanstack/react-router";

type Body = { resume?: string; jobDescription?: string };

const SYSTEM = `You are an expert ATS (Applicant Tracking System) and technical recruiter.
Analyze the candidate's resume against the target job description and return STRICT JSON with this exact shape:
{
  "score": number (0-100 ATS compatibility),
  "verdict": string (one short sentence),
  "matched_keywords": string[] (skills/keywords present in BOTH),
  "missing_keywords": string[] (important keywords in the JD missing from the resume),
  "skill_gaps": [{ "skill": string, "why_it_matters": string }],
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": [{ "title": string, "detail": string }],
  "rewrite_suggestions": [{ "original": string, "improved": string }]
}
Return ONLY the JSON. No prose, no markdown fences.`;

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { resume, jobDescription } = (await request.json()) as Body;
        if (!resume?.trim() || !jobDescription?.trim()) {
          return new Response(JSON.stringify({ error: "Resume and job description are required." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify({
            model: "openai/gpt-5.5",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "user",
                content: `JOB DESCRIPTION:\n${jobDescription}\n\n---\n\nRESUME:\n${resume}`,
              },
            ],
          }),
        });

        if (res.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
            status: 429,
            headers: { "content-type": "application/json" },
          });
        }
        if (res.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Add credits in workspace billing." }),
            { status: 402, headers: { "content-type": "application/json" } },
          );
        }
        if (!res.ok) {
          const text = await res.text();
          return new Response(JSON.stringify({ error: `Upstream error: ${text.slice(0, 200)}` }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "{}";
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          const match = content.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : { error: "Failed to parse model output" };
        }
        return new Response(JSON.stringify(parsed), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
