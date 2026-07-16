// Extract plain text from a PDF File using pdfjs-dist (client-only)
export async function extractPdfText(file: File): Promise<string> {
  if (typeof window === "undefined") throw new Error("PDF extraction is client-only");
  const pdfjsLib = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => ("str" in it ? it.str : "")).filter(Boolean);
    out += strings.join(" ") + "\n\n";
  }
  return out.trim();
}
