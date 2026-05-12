import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export async function createVoiceNote(data: schema.InsertVoiceNote) {
  const db = getDb();
  const result = await db.insert(schema.voiceNotes).values(data).$returningId();
  return result[0]?.id;
}

export async function listVoiceNotesByEvaluation(evaluationId: number) {
  const db = getDb();
  return db
    .select()
    .from(schema.voiceNotes)
    .where(eq(schema.voiceNotes.evaluationId, evaluationId))
    .orderBy(schema.voiceNotes.createdAt);
}
