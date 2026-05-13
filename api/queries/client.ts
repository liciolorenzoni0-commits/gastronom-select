import { eq, like, or } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export async function findCandidatesByClientToken(clientToken: string) {
  const db = getDb();
  // Find evaluations with matching clientToken, restaurantName, or interviewerEmail
  const evals = await db
    .select()
    .from(schema.evaluations)
    .where(
      or(
        like(schema.evaluations.clientToken, `%${clientToken}%`),
        like(schema.evaluations.restaurantName, `%${clientToken}%`),
        like(schema.evaluations.interviewerEmail, `%${clientToken}%`)
      )
    );

  const candidateIds = [...new Set(evals.map((e) => e.candidateId))];
  if (candidateIds.length === 0) return [];

  const results = await db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.id, candidateIds[0]));

  // For now, return all candidates (filtering happens in frontend)
  return db.select().from(schema.candidates);
}
