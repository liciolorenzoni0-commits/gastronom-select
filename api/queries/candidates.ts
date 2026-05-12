import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export async function findCandidateByToken(token: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.token, token))
    .limit(1);
  return rows.at(0);
}

export async function findCandidateById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.id, id))
    .limit(1);
  return rows.at(0);
}

export async function listCandidates() {
  const db = getDb();
  return db.select().from(schema.candidates).orderBy(schema.candidates.createdAt);
}

export async function createCandidate(data: schema.InsertCandidate) {
  const db = getDb();
  const result = await db.insert(schema.candidates).values(data).$returningId();
  return result[0]?.id;
}

export async function updateCandidateStatus(id: number, status: schema.Candidate["status"]) {
  const db = getDb();
  await db
    .update(schema.candidates)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.candidates.id, id));
}
