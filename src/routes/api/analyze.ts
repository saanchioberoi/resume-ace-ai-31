import { createFileRoute } from "@tanstack/react-router";

type Mode =
  | "analyze"
  | "tailor"
  | "interview"
  | "format-check"
  | "cover-letter"
  | "linkedin-gap"
  | "roadmap"
  | "projects";


type Body = {
  mode?: Mode;
  resume?: string;
  jobDescription?: string;
  linkedin?: string;
  extras?: Record<string, string>;
};

const SYSTEMS: Record<Mode, string> = {
  analyze: `You are an expert ATS and technical recruiter. Analyze the resume vs job description. Return STRICT JSON:
{
  "score": number (0-100),
  "verdict": string,
  "matched_keywords": string[],
  "missing_keywords": string[],
  "skill_gaps": [{ "skill": string, "why_it_matters": string }],
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": [{ "title": string, "detail": string }],
  "rewrite_suggestions": [{ "original": string, "improved": string }]
}
Return ONLY the JSON. No prose, no fences.`,

  tailor: `You are a resume writer. Produce a fully tailored, ATS-friendly resume for the target job, using ONLY facts present in the source resume (no fabrication). Optimize wording, ordering, and keywords. Return STRICT JSON:
{
  "summary": string (3-4 sentence professional summary),
  "core_skills": string[] (12-20 skills matching the JD),
  "experience": [{
    "role": string, "company": string, "duration": string,
    "bullets": string[] (impact-first, quantified where possible, keyword-aligned)
  }],
  "projects": [{ "name": string, "description": string, "highlights": string[] }],
  "education": [{ "degree": string, "institution": string, "year": string }],
  "certifications": string[],
  "keywords_added": string[] (JD keywords now woven in),
  "plain_text_resume": string (single ATS-safe plain-text resume, ready to paste)
}
Return ONLY the JSON.`,

  interview: `You are a senior interviewer for the target role. Based on the job description and resume, generate likely interview questions with strong model answers grounded in the candidate's background. Return STRICT JSON:
{
  "technical": [{ "question": string, "why_asked": string, "model_answer": string }],
  "behavioral": [{ "question": string, "why_asked": string, "model_answer": string (STAR format) }],
  "role_specific": [{ "question": string, "why_asked": string, "model_answer": string }],
  "questions_to_ask_them": string[] (smart questions the candidate should ask)
}
Return 5-7 items in each of technical, behavioral, role_specific. Return ONLY the JSON.`,

  "format-check": `You are an ATS parsing engine. Inspect the resume text for elements that break or degrade ATS parsing (tables, multi-column layouts, text-in-images, icons, headers/footers, unusual fonts, graphics, non-standard section headings, dates in odd formats, contact info in images, excessive symbols). Return STRICT JSON:
{
  "format_score": number (0-100, higher = more ATS-friendly),
  "verdict": string,
  "issues": [{
    "type": string (e.g. "tables","columns","icons","images","headers","fonts","sections","dates","contact","symbols","length","other"),
    "severity": "low"|"medium"|"high",
    "evidence": string (short quote or description),
    "impact": string,
    "fix": string
  }],
  "safe_practices": string[] (what the resume does right),
  "checklist": [{ "item": string, "passed": boolean }]
}
Return ONLY the JSON.`,

  "cover-letter": `You are a professional writer. Write a role-specific cover letter grounded in the resume and JD, no fabrications. Match tone to the company. Return STRICT JSON:
{
  "subject_line": string,
  "greeting": string,
  "opening": string (hook, 2-3 sentences),
  "body_paragraphs": string[] (2-3 paragraphs, each 3-5 sentences, quantified achievements aligned to JD),
  "closing": string (call to action, 2-3 sentences),
  "signature": string,
  "full_letter": string (the complete letter as a single formatted string ready to paste)
}
Return ONLY the JSON.`,

  "linkedin-gap": `You are a career brand strategist. Compare the resume and the LinkedIn profile text. Identify inconsistencies, missing items, and improvements. Return STRICT JSON:
{
  "consistency_score": number (0-100),
  "inconsistencies": [{ "field": string, "resume_says": string, "linkedin_says": string, "recommendation": string }],
  "missing_on_linkedin": string[] (resume items that should be added),
  "missing_on_resume": string[] (LinkedIn items that should be added),
  "headline_suggestions": string[] (3 improved LinkedIn headlines targeting the JD),
  "about_section_rewrite": string (a strong LinkedIn "About" section),
  "profile_improvements": [{ "area": string, "suggestion": string }]
}
Return ONLY the JSON.`,

  roadmap: `You are a career coach and curriculum designer. Given the resume, the target job description, and the identified skill gaps, produce a personalized learning roadmap organized into phases. Recommend concrete, high-quality resources (courses, docs, books, YouTube channels) — use widely-known real sources only (freeCodeCamp, Coursera, Udemy, MIT OCW, official docs, YouTube channels like fireship, etc.); if unsure, describe the resource type instead of inventing a URL. Return STRICT JSON:
{
  "overview": string (2-3 sentences summarizing the plan),
  "total_weeks": number,
  "weekly_hours": number (recommended hours per week),
  "phases": [{
    "name": string (e.g. "Phase 1: Foundations"),
    "weeks": number,
    "goal": string,
    "skills": string[] (skills mastered in this phase),
    "resources": [{
      "title": string,
      "type": "course"|"video"|"book"|"docs"|"tutorial"|"practice",
      "provider": string,
      "url": string (best-effort real URL, or empty string if unsure),
      "estimated_hours": number,
      "why": string
    }],
    "milestone": string (checkpoint to prove mastery)
  }],
  "certifications": [{ "name": string, "provider": string, "why": string }],
  "daily_habits": string[] (5-7 sustainable habits),
  "success_metrics": string[] (how to know the roadmap is working)
}
Return ONLY the JSON.`,

  projects: `You are a senior engineer / hiring manager. Given the resume, job description, and skill gaps, propose 5-7 portfolio projects the candidate should build to close those gaps and impress recruiters for THIS specific role. Prioritize projects that directly demonstrate the missing skills and can be built in 1-4 weeks each. Return STRICT JSON:
{
  "overview": string,
  "projects": [{
    "title": string,
    "difficulty": "beginner"|"intermediate"|"advanced",
    "estimated_time": string (e.g. "2 weeks", "20 hours"),
    "skills_demonstrated": string[] (targets the missing_keywords / skill_gaps),
    "problem_statement": string (what problem it solves),
    "description": string (2-3 sentences of what to build),
    "core_features": string[] (5-8 must-have features),
    "stretch_features": string[] (optional bonus scope),
    "tech_stack": string[] (specific technologies matching the JD),
    "learning_outcomes": string[] (what you will learn by building it),
    "portfolio_pitch": string (1-2 sentence resume bullet describing the finished project, impact-first with metrics)
  }],
  "showcase_tips": string[] (how to present these on GitHub, resume, LinkedIn)
}
Return ONLY the JSON.`,
};


function buildUserMessage(body: Body): string {
  const jd = body.jobDescription?.trim() ?? "";
  const resume = body.resume?.trim() ?? "";
  const linkedin = body.linkedin?.trim() ?? "";
  const parts: string[] = [];
  if (jd) parts.push(`JOB DESCRIPTION:\n${jd}`);
  if (resume) parts.push(`RESUME:\n${resume}`);
  if (linkedin) parts.push(`LINKEDIN PROFILE:\n${linkedin}`);
  if (body.extras) {
    for (const [k, v] of Object.entries(body.extras)) {
      if (v?.trim()) parts.push(`${k.toUpperCase()}:\n${v}`);
    }
  }
  return parts.join("\n\n---\n\n");
}

function requiredFieldsOk(mode: Mode, b: Body): string | null {
  const has = (s?: string) => !!s?.trim();
  switch (mode) {
    case "format-check":
      if (!has(b.resume)) return "Resume is required.";
      return null;
    case "linkedin-gap":
      if (!has(b.resume) || !has(b.linkedin))
        return "Resume and LinkedIn profile text are required.";
      return null;
    default:
      if (!has(b.resume) || !has(b.jobDescription))
        return "Resume and job description are required.";
      return null;
  }
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const mode: Mode = (body.mode ?? "analyze") as Mode;
        if (!SYSTEMS[mode]) {
          return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
        }
        const missing = requiredFieldsOk(mode, body);
        if (missing) return Response.json({ error: missing }, { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "Missing LOVABLE_API_KEY" }, { status: 500 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", "Lovable-API-Key": key },
          body: JSON.stringify({
            model: "openai/gpt-5.5",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEMS[mode] },
              { role: "user", content: buildUserMessage(body) },
            ],
          }),
        });

        if (res.status === 429)
          return Response.json({ error: "Rate limit reached. Try again shortly." }, { status: 429 });
        if (res.status === 402)
          return Response.json(
            { error: "AI credits exhausted. Add credits in workspace billing." },
            { status: 402 },
          );
        if (!res.ok) {
          const text = await res.text();
          return Response.json(
            { error: `Upstream error: ${text.slice(0, 200)}` },
            { status: 500 },
          );
        }

        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content ?? "{}";
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          const m = content.match(/\{[\s\S]*\}/);
          parsed = m ? JSON.parse(m[0]) : { error: "Failed to parse model output" };
        }
        return Response.json(parsed);
      },
    },
  },
});
