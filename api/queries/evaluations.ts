import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export async function createEvaluation(data: schema.InsertEvaluation) {
  const db = getDb();
  const result = await db.insert(schema.evaluations).values(data).$returningId();
  return result[0]?.id;
}

export async function findEvaluationById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.evaluations)
    .where(eq(schema.evaluations.id, id))
    .limit(1);
  return rows.at(0);
}

export async function listEvaluationsByCandidate(candidateId: number) {
  const db = getDb();
  return db
    .select()
    .from(schema.evaluations)
    .where(eq(schema.evaluations.candidateId, candidateId))
    .orderBy(schema.evaluations.createdAt);
}

export async function submitEvaluation(
  id: number,
  data: {
    overallScore: string;
    recommendation: schema.Evaluation["recommendation"];
    generalNotes: string;
    interviewerName: string;
    interviewerEmail: string;
    restaurantName: string;
  }
) {
  const db = getDb();
  await db
    .update(schema.evaluations)
    .set({
      ...data,
      status: "submitted",
      updatedAt: new Date(),
    })
    .where(eq(schema.evaluations.id, id));
}

export async function updateEvaluationAiSummary(evaluationId: number, aiSummaryId: number) {
  const db = getDb();
  await db
    .update(schema.evaluations)
    .set({ aiSummaryId, updatedAt: new Date() })
    .where(eq(schema.evaluations.id, evaluationId));
}

// Evaluation scores
export async function createEvaluationScore(data: schema.InsertEvaluationScore) {
  const db = getDb();
  await db.insert(schema.evaluationScores).values(data);
}

export async function listScoresByEvaluation(evaluationId: number) {
  const db = getDb();
  return db
    .select()
    .from(schema.evaluationScores)
    .where(eq(schema.evaluationScores.evaluationId, evaluationId));
}

// Create evaluation with scores in a transaction
export async function createEvaluationWithScores(
  evalData: schema.InsertEvaluation,
  scores: Omit<schema.InsertEvaluationScore, "evaluationId">[]
) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const result = await tx.insert(schema.evaluations).values(evalData).$returningId();
    const evaluationId = result[0]?.id;
    if (!evaluationId) throw new Error("Failed to create evaluation");

    if (scores.length > 0) {
      await tx.insert(schema.evaluationScores).values(
        scores.map((s) => ({ ...s, evaluationId }))
      );
    }

    return evaluationId;
  });
}
