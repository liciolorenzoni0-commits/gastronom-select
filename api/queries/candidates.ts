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

function serializeTags(tags: string[] | null | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

export async function findCandidateByToken(token: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.token, token))
    .limit(1);
  const row = rows.at(0);
  if (!row) return null;
  return {
    ...row,
    tags: parseJsonField<string[]>(row.tags),
  };
}

export async function findCandidateById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.id, id))
    .limit(1);
  const row = rows.at(0);
  if (!row) return null;
  return {
    ...row,
    tags: parseJsonField<string[]>(row.tags),
  };
}

export async function listCandidates() {
  const db = getDb();
  const rows = await db.select().from(schema.candidates).orderBy(schema.candidates.createdAt);
  return rows.map((row) => ({
    ...row,
    tags: parseJsonField<string[]>(row.tags),
  }));
}

export async function createCandidate(data: schema.InsertCandidate) {
  const db = getDb();
  const result = await db.insert(schema.candidates).values({
    ...data,
    tags: serializeTags(data.tags as string[] | null | undefined),
  }).$returningId();
  return result[0]?.id;
}

export async function updateCandidateStatus(id: number, status: schema.Candidate["status"]) {
  const db = getDb();
  await db
    .update(schema.candidates)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.candidates.id, id));
}

export async function updateCandidateCv(id: number, cvText: string, matchScore: number | null) {
  const db = getDb();
  await db
    .update(schema.candidates)
    .set({ cvText, matchScore })
    .where(eq(schema.candidates.id, id));
}
