// @ts-ignore - pdf-parse has no types
import * as pdfParse from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await (pdfParse as any)(buffer);
    return data.text || "";
  } catch (error) {
    console.error("[pdfParser] Failed to parse PDF:", error);
    throw new Error("No se pudo leer el PDF. Asegurate de que sea un archivo valido.");
  }
}
