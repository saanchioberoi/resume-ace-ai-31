import { useEffect, useState } from "react";

export type TrackedApp = {
  id: string;
  company: string;
  role: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  score?: number;
  resumeVersion?: string;
  jobDescription?: string;
  notes?: string;
  createdAt: number;
};

const KEY = "resumefit.tracker.v1";

export function loadApps(): TrackedApp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as TrackedApp[];
  } catch {
    return [];
  }
}

export function saveApps(apps: TrackedApp[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(apps));
}

export function useTracker() {
  const [apps, setApps] = useState<TrackedApp[]>([]);
  useEffect(() => setApps(loadApps()), []);
  const persist = (next: TrackedApp[]) => {
    setApps(next);
    saveApps(next);
  };
  return {
    apps,
    add: (a: Omit<TrackedApp, "id" | "createdAt">) =>
      persist([{ ...a, id: crypto.randomUUID(), createdAt: Date.now() }, ...apps]),
    update: (id: string, patch: Partial<TrackedApp>) =>
      persist(apps.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    remove: (id: string) => persist(apps.filter((a) => a.id !== id)),
  };
}
