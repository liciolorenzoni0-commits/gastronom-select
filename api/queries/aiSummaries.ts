import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

function parseJsonField<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function createAiSummary(data: schema.InsertAiSummary) {
  const db = getDb();
  const result = await db.insert(schema.aiSummaries).values(data).$returningId();
  return result[0]?.id;
}

export async function findAiSummaryByEvaluation(evaluationId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.aiSummaries)
    .where(eq(schema.aiSummaries.evaluationId, evaluationId))
    .limit(1);
  const row = rows.at(0);
  if (!row) return null;
  return {
    ...row,
    strengths: parseJsonField<string[]>(row.strengths),
    concerns: parseJsonField<string[]>(row.concerns),
  };
}

export async function findAiSummaryById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.aiSummaries)
    .where(eq(schema.aiSummaries.id, id))
    .limit(1);
  const row = rows.at(0);
  if (!row) return null;
  return {
    ...row,
    strengths: parseJsonField<string[]>(row.strengths),
    concerns: parseJsonField<string[]>(row.concerns),
  };
}
