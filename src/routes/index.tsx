import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeFit — AI ATS Resume Analyzer" },
      {
        name: "description",
        content:
          "Score your resume against any job description. Get an ATS score, skill gaps, and personalized rewrite suggestions powered by AI.",
      },
      { property: "og:title", content: "ResumeFit — AI ATS Resume Analyzer" },
      {
        property: "og:description",
        content: "AI-powered ATS compatibility score, skill-gap analysis, and resume improvement recommendations.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

type Analysis = {
  score: number;
  verdict: string;
  matched_keywords: string[];
  missing_keywords: string[];
  skill_gaps: { skill: string; why_it_matters: string }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: { title: string; detail: string }[];
  rewrite_suggestions: { original: string; improved: string }[];
};

function Home() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);

  async function analyze() {
    if (!resume.trim() || !jd.trim()) {
      toast.error("Please paste both your resume and the job description.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data as Analysis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">ResumeFit</h1>
              <p className="text-xs text-muted-foreground">AI ATS Analyzer</p>
            </div>
          </div>
          <Badge variant="secondary">Powered by Lovable AI</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-10 text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Beat the ATS. <span className="text-primary">Land the interview.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Paste your resume and a target job description. Get an instant ATS compatibility score, skill-gap
            analysis, and AI-generated rewrite suggestions.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your full resume text here…"
                className="min-h-[280px] resize-y"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description or role requirements here…"
                className="min-h-[280px] resize-y"
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={analyze} disabled={loading} className="min-w-[220px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Analyze My Resume
              </>
            )}
          </Button>
        </div>

        {result && <Results data={result} />}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built with TanStack Start + Lovable AI
      </footer>
    </div>
  );
}

function Results({ data }: { data: Analysis }) {
  const score = Math.max(0, Math.min(100, Number(data.score) || 0));
  const tone = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";

  return (
    <section className="mt-10 space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">ATS Compatibility Score</p>
            <div className={`text-6xl font-bold ${tone}`}>{score}%</div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{data.verdict}</p>
          </div>
          <div className="w-full sm:max-w-xs">
            <Progress value={score} className="h-3" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ListCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          title="Matched Keywords"
          items={data.matched_keywords}
          variant="secondary"
        />
        <ListCard
          icon={<Target className="h-4 w-4 text-rose-600" />}
          title="Missing Keywords"
          items={data.missing_keywords}
          variant="destructive"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.strengths?.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.weaknesses?.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600">!</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {data.skill_gaps?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skill Gaps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.skill_gaps.map((g, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="font-medium">{g.skill}</div>
                <p className="mt-1 text-sm text-muted-foreground">{g.why_it_matters}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recommendations.map((r, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="font-medium">{r.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.rewrite_suggestions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bullet Rewrite Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.rewrite_suggestions.map((r, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900 dark:bg-rose-950/30">
                  <div className="mb-1 text-xs font-semibold uppercase text-rose-700 dark:text-rose-400">Before</div>
                  {r.original}
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="mb-1 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                    After
                  </div>
                  {r.improved}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function ListCard({
  icon,
  title,
  items,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  variant: "secondary" | "destructive";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items?.length ? (
          <div className="flex flex-wrap gap-2">
            {items.map((k, i) => (
              <Badge key={i} variant={variant}>
                {k}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">None detected.</p>
        )}
      </CardContent>
    </Card>
  );
}
