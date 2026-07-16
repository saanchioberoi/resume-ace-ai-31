import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Loader2, Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb,
  FileText, MessageSquare, ShieldCheck, Mail, Linkedin, ListTodo, Copy, Trash2, Save,
  GraduationCap, Hammer, ExternalLink, Upload,
} from "lucide-react";
import { runAnalyze } from "@/lib/ai-client";
import { extractPdfText } from "@/lib/pdf";
import { useTracker, type TrackedApp } from "@/lib/tracker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeFit — AI ATS Resume Analyzer, Tailor & Tracker" },
      {
        name: "description",
        content:
          "Score your resume against any job, generate a tailored version, predict interview questions, check ATS formatting, draft cover letters, compare with LinkedIn, and track applications.",
      },
      { property: "og:title", content: "ResumeFit — AI ATS Resume Analyzer, Tailor & Tracker" },
      {
        property: "og:description",
        content: "Score your resume against any job, generate a tailored version, predict interview questions, check ATS formatting, draft cover letters, compare with LinkedIn, and track applications.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

function Home() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [linkedin, setLinkedin] = useState("");

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
              <p className="text-xs text-muted-foreground">AI Career Toolkit</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-8 text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Beat the ATS. <span className="text-primary">Land the interview.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Analyze, tailor, prep, and track — all in one place.
          </p>
        </section>

        <ConfigStatusPanel />

        <InputsCard
          resume={resume} setResume={setResume}
          jd={jd} setJd={setJd}
          linkedin={linkedin} setLinkedin={setLinkedin}
        />

        <Tabs defaultValue="analyze" className="mt-8">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 md:grid md:grid-cols-9">
            <TabsTrigger value="analyze"><Target className="mr-1 h-3.5 w-3.5" />Analyze</TabsTrigger>
            <TabsTrigger value="tailor"><FileText className="mr-1 h-3.5 w-3.5" />Tailor</TabsTrigger>
            <TabsTrigger value="interview"><MessageSquare className="mr-1 h-3.5 w-3.5" />Interview</TabsTrigger>
            <TabsTrigger value="format"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Format</TabsTrigger>
            <TabsTrigger value="cover"><Mail className="mr-1 h-3.5 w-3.5" />Cover</TabsTrigger>
            <TabsTrigger value="linkedin"><Linkedin className="mr-1 h-3.5 w-3.5" />LinkedIn</TabsTrigger>
            <TabsTrigger value="roadmap"><GraduationCap className="mr-1 h-3.5 w-3.5" />Roadmap</TabsTrigger>
            <TabsTrigger value="projects"><Hammer className="mr-1 h-3.5 w-3.5" />Projects</TabsTrigger>
            <TabsTrigger value="tracker"><ListTodo className="mr-1 h-3.5 w-3.5" />Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="mt-6">
            <AnalyzePanel resume={resume} jd={jd} />
          </TabsContent>
          <TabsContent value="tailor" className="mt-6">
            <TailorPanel resume={resume} jd={jd} />
          </TabsContent>
          <TabsContent value="interview" className="mt-6">
            <InterviewPanel resume={resume} jd={jd} />
          </TabsContent>
          <TabsContent value="format" className="mt-6">
            <FormatPanel resume={resume} />
          </TabsContent>
          <TabsContent value="cover" className="mt-6">
            <CoverLetterPanel resume={resume} jd={jd} />
          </TabsContent>
          <TabsContent value="linkedin" className="mt-6">
            <LinkedInPanel resume={resume} linkedin={linkedin} jd={jd} />
          </TabsContent>
          <TabsContent value="roadmap" className="mt-6">
            <RoadmapPanel resume={resume} jd={jd} />
          </TabsContent>
          <TabsContent value="projects" className="mt-6">
            <ProjectsPanel resume={resume} jd={jd} />
          </TabsContent>
          <TabsContent value="tracker" className="mt-6">
            <TrackerPanel />
          </TabsContent>
        </Tabs>

      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built with TanStack Start + Lovable AI
      </footer>
    </div>
  );
}

type StatusInfo = {
  endpoint: string;
  configured: boolean;
  key_present: boolean;
  key_length: number;
  key_hint: string | null;
  gateway: string;
  model: string;
  checked_at: string;
};

function ConfigStatusPanel() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Status check failed");
      setStatus(data as StatusInfo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status check failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  const ok = status?.configured === true;
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Configuration Status
          </CardTitle>
          <Button size="sm" variant="outline" onClick={check} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            Re-check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        ) : !status ? (
          <p className="text-sm text-muted-foreground">Checking endpoint…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusRow label="Endpoint" value={status.endpoint} mono />
            <StatusRow
              label="LOVABLE_API_KEY"
              value={
                <Badge variant={ok ? "default" : "destructive"} className="gap-1">
                  {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {ok ? "Configured" : "Missing"}
                </Badge>
              }
            />
            <StatusRow label="Key preview" value={<span className="font-mono text-xs">{status.key_hint ?? "—"}</span>} />
            <StatusRow label="Key length" value={status.key_length > 0 ? `${status.key_length} chars` : "—"} />
            <StatusRow label="Model" value={status.model} mono />
            <StatusRow label="Gateway" value={status.gateway} mono />
            <StatusRow
              label="Last checked"
              value={new Date(status.checked_at).toLocaleTimeString()}
            />
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          The key value never leaves the server. Only a masked preview and length are returned.
        </p>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function InputsCard(props: {
  resume: string; setResume: (v: string) => void;
  jd: string; setJd: (v: string) => void;
  linkedin: string; setLinkedin: (v: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Inputs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium">Resume</label>
              <PdfUploadButton onText={props.setResume} label="Upload PDF" />
            </div>
            <Textarea
              value={props.resume}
              onChange={(e) => props.setResume(e.target.value)}
              placeholder="Paste your resume text, or upload a PDF above…"
              className="min-h-[220px] resize-y"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium">Target Job Description</label>
              <PdfUploadButton onText={props.setJd} label="Upload PDF" />
            </div>
            <Textarea
              value={props.jd}
              onChange={(e) => props.setJd(e.target.value)}
              placeholder="Paste the job description, or upload a PDF above…"
              className="min-h-[220px] resize-y"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">LinkedIn Profile (optional — for gap analysis)</label>
          <Textarea
            value={props.linkedin}
            onChange={(e) => props.setLinkedin(e.target.value)}
            placeholder="Paste the visible text from your LinkedIn profile (About, Experience, Skills)…"
            className="min-h-[120px] resize-y"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PdfUploadButton({ onText, label = "Upload PDF" }: { onText: (text: string) => void; label?: string }) {
  const [loading, setLoading] = useState(false);
  const inputId = useMemo(() => `pdf-${Math.random().toString(36).slice(2, 8)}`, []);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return toast.error("Please upload a PDF file");
    }
    setLoading(true);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) throw new Error("No text found in PDF (it may be a scanned image)");
      onText(text);
      toast.success(`Loaded ${file.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read PDF");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <input id={inputId} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handle} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
        {label}
      </Button>
    </>
  );
}

function ActionBar({ onRun, loading, label, disabled }: { onRun: () => void; loading: boolean; label: string; disabled?: boolean }) {
  return (
    <div className="mb-4 flex justify-end">
      <Button onClick={onRun} disabled={loading || disabled}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working…</> : <><Sparkles className="mr-2 h-4 w-4" />{label}</>}
      </Button>
    </div>
  );
}

function copy(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copied to clipboard"),
    () => toast.error("Copy failed"),
  );
}

/* ------------------------- ANALYZE ------------------------- */
type Analysis = {
  score: number; verdict: string;
  matched_keywords: string[]; missing_keywords: string[];
  skill_gaps: { skill: string; why_it_matters: string }[];
  strengths: string[]; weaknesses: string[];
  recommendations: { title: string; detail: string }[];
  rewrite_suggestions: { original: string; improved: string }[];
};

function AnalyzePanel({ resume, jd }: { resume: string; jd: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Analysis | null>(null);
  const run = async () => {
    if (!resume.trim() || !jd.trim()) return toast.error("Add resume and job description first.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<Analysis>("analyze", { resume, jobDescription: jd })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <ActionBar onRun={run} loading={loading} label="Run ATS Analysis" />
      {data && <AnalysisResults data={data} />}
    </div>
  );
}

function AnalysisResults({ data }: { data: Analysis }) {
  const score = Math.max(0, Math.min(100, Number(data.score) || 0));
  const tone = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">ATS Compatibility</p>
            <div className={`text-6xl font-bold ${tone}`}>{score}%</div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{data.verdict}</p>
          </div>
          <div className="w-full sm:max-w-xs">
            <Progress value={score} className="h-3" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <ChipCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} title="Matched Keywords" items={data.matched_keywords} variant="secondary" />
        <ChipCard icon={<Target className="h-4 w-4 text-rose-600" />} title="Missing Keywords" items={data.missing_keywords} variant="destructive" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <BulletCard icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} title="Strengths" items={data.strengths} bullet="✓" tone="text-emerald-600" />
        <BulletCard icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} title="Weaknesses" items={data.weaknesses} bullet="!" tone="text-amber-600" />
      </div>
      {data.skill_gaps?.length > 0 && (
        <SectionCard title="Skill Gaps">
          {data.skill_gaps.map((g, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="font-medium">{g.skill}</div>
              <p className="mt-1 text-sm text-muted-foreground">{g.why_it_matters}</p>
            </div>
          ))}
        </SectionCard>
      )}
      {data.recommendations?.length > 0 && (
        <SectionCard title="Recommendations" icon={<Lightbulb className="h-4 w-4 text-primary" />}>
          {data.recommendations.map((r, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="font-medium">{r.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
            </div>
          ))}
        </SectionCard>
      )}
      {data.rewrite_suggestions?.length > 0 && (
        <SectionCard title="Bullet Rewrites">
          {data.rewrite_suggestions.map((r, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-900 dark:bg-rose-950/30">
                <div className="mb-1 text-xs font-semibold uppercase text-rose-700 dark:text-rose-400">Before</div>{r.original}
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="mb-1 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">After</div>{r.improved}
              </div>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}

/* ------------------------- TAILOR ------------------------- */
type Tailored = {
  summary: string;
  core_skills: string[];
  experience: { role: string; company: string; duration: string; bullets: string[] }[];
  projects: { name: string; description: string; highlights: string[] }[];
  education: { degree: string; institution: string; year: string }[];
  certifications: string[];
  keywords_added: string[];
  plain_text_resume: string;
};

function TailorPanel({ resume, jd }: { resume: string; jd: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Tailored | null>(null);
  const run = async () => {
    if (!resume.trim() || !jd.trim()) return toast.error("Add resume and job description first.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<Tailored>("tailor", { resume, jobDescription: jd })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <ActionBar onRun={run} loading={loading} label="Generate Tailored Resume" />
      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Professional Summary</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => copy(data.summary)}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
            </CardHeader>
            <CardContent><p className="text-sm">{data.summary}</p></CardContent>
          </Card>
          <ChipCard title="Core Skills" items={data.core_skills} variant="secondary" />
          <SectionCard title="Experience">
            {data.experience?.map((e, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium">{e.role} · {e.company}</div>
                  <div className="text-xs text-muted-foreground">{e.duration}</div>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </SectionCard>
          {data.projects?.length > 0 && (
            <SectionCard title="Projects">
              {data.projects.map((p, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="font-medium">{p.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {p.highlights?.map((h, j) => <li key={j}>{h}</li>)}
                  </ul>
                </div>
              ))}
            </SectionCard>
          )}
          {data.keywords_added?.length > 0 && (
            <ChipCard title="Keywords Woven In" items={data.keywords_added} variant="secondary" />
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Plain-Text Resume (ATS-Safe)</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => copy(data.plain_text_resume)}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{data.plain_text_resume}</pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ------------------------- INTERVIEW ------------------------- */
type Interview = {
  technical: { question: string; why_asked: string; model_answer: string }[];
  behavioral: { question: string; why_asked: string; model_answer: string }[];
  role_specific: { question: string; why_asked: string; model_answer: string }[];
  questions_to_ask_them: string[];
};

function InterviewPanel({ resume, jd }: { resume: string; jd: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Interview | null>(null);
  const run = async () => {
    if (!resume.trim() || !jd.trim()) return toast.error("Add resume and job description first.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<Interview>("interview", { resume, jobDescription: jd })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  const groups: [string, Interview["technical"]][] = data
    ? [["Technical", data.technical], ["Behavioral", data.behavioral], ["Role-Specific", data.role_specific]]
    : [];
  return (
    <div>
      <ActionBar onRun={run} loading={loading} label="Predict Interview Questions" />
      {data && (
        <div className="space-y-6">
          {groups.map(([title, list]) => (
            <SectionCard key={title} title={title}>
              {list?.map((q, i) => (
                <details key={i} className="rounded-lg border p-3 open:bg-muted/40">
                  <summary className="cursor-pointer font-medium">{q.question}</summary>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Why asked</p>
                  <p className="text-sm">{q.why_asked}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Model answer</p>
                  <p className="whitespace-pre-wrap text-sm">{q.model_answer}</p>
                </details>
              ))}
            </SectionCard>
          ))}
          {data.questions_to_ask_them?.length > 0 && (
            <SectionCard title="Smart Questions to Ask Them">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {data.questions_to_ask_them.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- FORMAT CHECK ------------------------- */
type FormatReport = {
  format_score: number; verdict: string;
  issues: { type: string; severity: "low"|"medium"|"high"; evidence: string; impact: string; fix: string }[];
  safe_practices: string[];
  checklist: { item: string; passed: boolean }[];
};

function FormatPanel({ resume }: { resume: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormatReport | null>(null);
  const run = async () => {
    if (!resume.trim()) return toast.error("Add your resume text first.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<FormatReport>("format-check", { resume })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  const sevTone = (s: string) => s === "high" ? "destructive" : s === "medium" ? "default" : "secondary";
  return (
    <div>
      <ActionBar onRun={run} loading={loading} label="Check ATS Formatting" />
      {data && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Format Score</p>
                <div className="text-5xl font-bold">{data.format_score}%</div>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">{data.verdict}</p>
              </div>
              <Progress value={data.format_score} className="h-3 w-40" />
            </CardContent>
          </Card>
          {data.issues?.length > 0 && (
            <SectionCard title="Issues Detected">
              {data.issues.map((iss, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={sevTone(iss.severity) as "default"|"secondary"|"destructive"}>{iss.severity}</Badge>
                    <span className="font-medium capitalize">{iss.type}</span>
                  </div>
                  <p className="text-sm"><span className="text-muted-foreground">Evidence:</span> {iss.evidence}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Impact:</span> {iss.impact}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Fix:</span> {iss.fix}</p>
                </div>
              ))}
            </SectionCard>
          )}
          {data.checklist?.length > 0 && (
            <SectionCard title="ATS Checklist">
              <ul className="space-y-1 text-sm">
                {data.checklist.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={c.passed ? "text-emerald-600" : "text-rose-600"}>{c.passed ? "✓" : "✗"}</span>
                    <span>{c.item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          {data.safe_practices?.length > 0 && (
            <SectionCard title="What's Working">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {data.safe_practices.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- COVER LETTER ------------------------- */
type Cover = {
  subject_line: string; greeting: string; opening: string;
  body_paragraphs: string[]; closing: string; signature: string; full_letter: string;
};

function CoverLetterPanel({ resume, jd }: { resume: string; jd: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Cover | null>(null);
  const [tone, setTone] = useState("professional");
  const run = async () => {
    if (!resume.trim() || !jd.trim()) return toast.error("Add resume and job description first.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<Cover>("cover-letter", { resume, jobDescription: jd, extras: { tone } })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tone</span>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Writing…</> : <><Sparkles className="mr-2 h-4 w-4" />Write Cover Letter</>}
        </Button>
      </div>
      {data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{data.subject_line}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => copy(data.full_letter)}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{data.full_letter}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------- LINKEDIN GAP ------------------------- */
type Gap = {
  consistency_score: number;
  inconsistencies: { field: string; resume_says: string; linkedin_says: string; recommendation: string }[];
  missing_on_linkedin: string[];
  missing_on_resume: string[];
  headline_suggestions: string[];
  about_section_rewrite: string;
  profile_improvements: { area: string; suggestion: string }[];
};

function LinkedInPanel({ resume, linkedin, jd }: { resume: string; linkedin: string; jd: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Gap | null>(null);
  const run = async () => {
    if (!resume.trim() || !linkedin.trim())
      return toast.error("Paste both resume and LinkedIn profile text in the inputs above.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<Gap>("linkedin-gap", { resume, linkedin, jobDescription: jd })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <ActionBar onRun={run} loading={loading} label="Analyze LinkedIn Gap" />
      {data && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Consistency Score</p>
                <div className="text-5xl font-bold">{data.consistency_score}%</div>
              </div>
              <Progress value={data.consistency_score} className="h-3 w-40" />
            </CardContent>
          </Card>
          {data.inconsistencies?.length > 0 && (
            <SectionCard title="Inconsistencies">
              {data.inconsistencies.map((c, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="font-medium capitalize">{c.field}</div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div className="rounded bg-muted p-2 text-sm"><span className="text-xs text-muted-foreground">Resume:</span> {c.resume_says}</div>
                    <div className="rounded bg-muted p-2 text-sm"><span className="text-xs text-muted-foreground">LinkedIn:</span> {c.linkedin_says}</div>
                  </div>
                  <p className="mt-2 text-sm"><span className="text-muted-foreground">Fix:</span> {c.recommendation}</p>
                </div>
              ))}
            </SectionCard>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Add to LinkedIn">
              <ul className="list-disc space-y-1 pl-5 text-sm">{data.missing_on_linkedin?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </SectionCard>
            <SectionCard title="Add to Resume">
              <ul className="list-disc space-y-1 pl-5 text-sm">{data.missing_on_resume?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </SectionCard>
          </div>
          {data.headline_suggestions?.length > 0 && (
            <SectionCard title="Headline Suggestions">
              <ul className="space-y-2 text-sm">
                {data.headline_suggestions.map((h, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 rounded border p-2">
                    <span>{h}</span>
                    <Button size="sm" variant="ghost" onClick={() => copy(h)}><Copy className="h-3.5 w-3.5" /></Button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          {data.about_section_rewrite && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Rewritten "About" Section</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => copy(data.about_section_rewrite)}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
              </CardHeader>
              <CardContent><pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{data.about_section_rewrite}</pre></CardContent>
            </Card>
          )}
          {data.profile_improvements?.length > 0 && (
            <SectionCard title="Profile Improvements">
              {data.profile_improvements.map((p, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="font-medium">{p.area}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.suggestion}</p>
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- TRACKER ------------------------- */
function TrackerPanel() {
  const { apps, add, update, remove } = useTracker();
  const [form, setForm] = useState({ company: "", role: "", resumeVersion: "", score: "" });

  const stats = useMemo(() => ({
    total: apps.length,
    applied: apps.filter((a) => a.status === "applied").length,
    interview: apps.filter((a) => a.status === "interview").length,
    offer: apps.filter((a) => a.status === "offer").length,
  }), [apps]);

  const submit = () => {
    if (!form.company.trim() || !form.role.trim())
      return toast.error("Company and role are required.");
    add({
      company: form.company.trim(),
      role: form.role.trim(),
      status: "saved",
      resumeVersion: form.resumeVersion.trim() || undefined,
      score: form.score ? Number(form.score) : undefined,
    });
    setForm({ company: "", role: "", resumeVersion: "", score: "" });
    toast.success("Application saved");
  };

  const badgeFor = (s: TrackedApp["status"]) => {
    const map: Record<TrackedApp["status"], "default"|"secondary"|"destructive"> = {
      saved: "secondary", applied: "default", interview: "default", offer: "default", rejected: "destructive",
    };
    return map[s];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[["Total", stats.total], ["Applied", stats.applied], ["Interviews", stats.interview], ["Offers", stats.offer]].map(([label, v]) => (
          <Card key={label as string}>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold">{v}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add Application</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input placeholder="Resume version (e.g. v3-backend)" value={form.resumeVersion} onChange={(e) => setForm({ ...form, resumeVersion: e.target.value })} />
            <Input placeholder="ATS score" type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={submit}><Save className="mr-1 h-4 w-4" />Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Your Applications</CardTitle></CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No applications yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {apps.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{a.role} · <span className="text-muted-foreground">{a.company}</span></div>
                    <div className="text-xs text-muted-foreground">
                      {a.resumeVersion ? `Resume: ${a.resumeVersion}` : "No version"} ·{" "}
                      {typeof a.score === "number" ? `${a.score}% match` : "no score"} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Select value={a.status} onValueChange={(v) => update(a.id, { status: v as TrackedApp["status"] })}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saved">Saved</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant={badgeFor(a.status)}>{a.status}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------- ROADMAP ------------------------- */
type Roadmap = {
  overview: string;
  total_weeks: number;
  weekly_hours: number;
  phases: {
    name: string; weeks: number; goal: string; skills: string[]; milestone: string;
    resources: { title: string; type: string; provider: string; url: string; estimated_hours: number; why: string }[];
  }[];
  certifications: { name: string; provider: string; why: string }[];
  daily_habits: string[];
  success_metrics: string[];
};

function RoadmapPanel({ resume, jd }: { resume: string; jd: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Roadmap | null>(null);
  const run = async () => {
    if (!resume.trim() || !jd.trim()) return toast.error("Add resume and job description first.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<Roadmap>("roadmap", { resume, jobDescription: jd })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <ActionBar onRun={run} loading={loading} label="Generate Learning Roadmap" />
      {data && (
        <div className="space-y-6">
          <Card>
            <CardContent className="grid gap-4 py-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total duration</p>
                <div className="text-3xl font-bold">{data.total_weeks} <span className="text-base font-normal text-muted-foreground">weeks</span></div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Weekly commitment</p>
                <div className="text-3xl font-bold">{data.weekly_hours} <span className="text-base font-normal text-muted-foreground">hrs/wk</span></div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phases</p>
                <div className="text-3xl font-bold">{data.phases?.length ?? 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-sm text-muted-foreground">{data.overview}</CardContent>
          </Card>
          <div className="relative space-y-4 border-l-2 border-primary/30 pl-6">
            {data.phases?.map((p, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-baseline justify-between gap-2 text-base">
                      <span>{p.name}</span>
                      <Badge variant="secondary">{p.weeks} weeks</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.goal}</p>
                    {p.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.skills.map((s, j) => <Badge key={j} variant="secondary">{s}</Badge>)}
                      </div>
                    )}
                    {p.resources?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resources</div>
                        {p.resources.map((r, k) => (
                          <div key={k} className="rounded-lg border p-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <div className="font-medium">
                                {r.url ? (
                                  <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                    {r.title} <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : r.title}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="capitalize">{r.type}</Badge>
                                <span>{r.estimated_hours}h</span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{r.provider}</div>
                            <p className="mt-1 text-sm">{r.why}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.milestone && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Milestone: </span>{p.milestone}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          {data.certifications?.length > 0 && (
            <SectionCard title="Recommended Certifications">
              {data.certifications.map((c, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.provider}</div>
                  <p className="mt-1 text-sm">{c.why}</p>
                </div>
              ))}
            </SectionCard>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {data.daily_habits?.length > 0 && (
              <SectionCard title="Daily Habits">
                <ul className="list-disc space-y-1 pl-5 text-sm">{data.daily_habits.map((h, i) => <li key={i}>{h}</li>)}</ul>
              </SectionCard>
            )}
            {data.success_metrics?.length > 0 && (
              <SectionCard title="Success Metrics">
                <ul className="list-disc space-y-1 pl-5 text-sm">{data.success_metrics.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- PROJECTS ------------------------- */
type ProjectIdeas = {
  overview: string;
  projects: {
    title: string;
    difficulty: "beginner"|"intermediate"|"advanced";
    estimated_time: string;
    skills_demonstrated: string[];
    problem_statement: string;
    description: string;
    core_features: string[];
    stretch_features: string[];
    tech_stack: string[];
    learning_outcomes: string[];
    portfolio_pitch: string;
  }[];
  showcase_tips: string[];
};

function ProjectsPanel({ resume, jd }: { resume: string; jd: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProjectIdeas | null>(null);
  const run = async () => {
    if (!resume.trim() || !jd.trim()) return toast.error("Add resume and job description first.");
    setLoading(true); setData(null);
    try { setData(await runAnalyze<ProjectIdeas>("projects", { resume, jobDescription: jd })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };
  const diffTone = (d: string) =>
    d === "beginner" ? "text-emerald-700 dark:text-emerald-400" :
    d === "intermediate" ? "text-amber-700 dark:text-amber-400" :
    "text-rose-700 dark:text-rose-400";
  return (
    <div>
      <ActionBar onRun={run} loading={loading} label="Suggest Portfolio Projects" />
      {data && (
        <div className="space-y-6">
          <Card><CardContent className="py-4 text-sm text-muted-foreground">{data.overview}</CardContent></Card>
          <div className="grid gap-4 md:grid-cols-2">
            {data.projects?.map((p, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-start justify-between gap-2 text-base">
                    <span>{p.title}</span>
                    <span className={`text-xs font-semibold uppercase ${diffTone(p.difficulty)}`}>{p.difficulty}</span>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">{p.estimated_time}</div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm"><span className="font-medium">Problem: </span>{p.problem_statement}</p>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  {p.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.tech_stack.map((t, j) => <Badge key={j} variant="secondary">{t}</Badge>)}
                    </div>
                  )}
                  {p.skills_demonstrated?.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills demonstrated</div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.skills_demonstrated.map((s, j) => <Badge key={j}>{s}</Badge>)}
                      </div>
                    </div>
                  )}
                  {p.core_features?.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core features</div>
                      <ul className="list-disc space-y-0.5 pl-5 text-sm">
                        {p.core_features.map((f, j) => <li key={j}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                  {p.stretch_features?.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stretch features</summary>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {p.stretch_features.map((f, j) => <li key={j}>{f}</li>)}
                      </ul>
                    </details>
                  )}
                  {p.learning_outcomes?.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">You'll learn</summary>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {p.learning_outcomes.map((f, j) => <li key={j}>{f}</li>)}
                      </ul>
                    </details>
                  )}
                  {p.portfolio_pitch && (
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resume bullet</span>
                        <Button size="sm" variant="ghost" onClick={() => copy(p.portfolio_pitch)}><Copy className="h-3.5 w-3.5" /></Button>
                      </div>
                      <p className="text-sm italic">"{p.portfolio_pitch}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {data.showcase_tips?.length > 0 && (
            <SectionCard title="How to Showcase These">
              <ul className="list-disc space-y-1 pl-5 text-sm">{data.showcase_tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- SHARED UI ------------------------- */

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}
function ChipCard({ icon, title, items, variant }: { icon?: React.ReactNode; title: string; items: string[]; variant: "secondary"|"destructive" }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle></CardHeader>
      <CardContent>
        {items?.length ? (
          <div className="flex flex-wrap gap-2">{items.map((k, i) => <Badge key={i} variant={variant}>{k}</Badge>)}</div>
        ) : <p className="text-sm text-muted-foreground">None detected.</p>}
      </CardContent>
    </Card>
  );
}
function BulletCard({ icon, title, items, bullet, tone }: { icon?: React.ReactNode; title: string; items: string[]; bullet: string; tone: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {items?.map((s, i) => <li key={i} className="flex gap-2"><span className={tone}>{bullet}</span><span>{s}</span></li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
