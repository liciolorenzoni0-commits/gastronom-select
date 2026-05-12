import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

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
  return rows.at(0);
}

export async function findAiSummaryById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.aiSummaries)
    .where(eq(schema.aiSummaries.id, id))
    .limit(1);
  return rows.at(0);
}
