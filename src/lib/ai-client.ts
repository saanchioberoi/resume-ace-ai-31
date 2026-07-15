export async function runAnalyze<T = unknown>(mode: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}
